import { createHash, randomUUID } from "node:crypto";
import { AppDataSource } from "../../config/data-source";

type RadarInput = {
  conversationId: string;
  userId?: string | null;
  message: string;
  platformContext: string;
  canal?: string | null;
  condominioId?: string | null;
};

export class GranConectaDemandRadarService {
  private normalize(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  /**
   * Recalcula alertas de uma categoria/região a partir dos eventos dos últimos
   * 30 dias. A região atual do perfil complementa eventos antigos sem bairro.
   * Atualiza alertas ativos mesmo abaixo de 10 clientes; cria apenas a partir de 10.
   * Não reabre alertas encerrados nem cria alertas para região desconhecida.
   */
  private async refreshRegionalAlert(categoryId: number, categoryName: string, region: string): Promise<void> {
    if (!Number.isInteger(categoryId) || categoryId <= 0 || !region || region === "NAO_INFORMADA") return;

    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    const lockName = `gc_radar_${categoryId}_${region}`;
    let locked = false;
    try {
      const lockRows: Array<{ acquired: number | string | null }> = await qr.query(
        "SELECT GET_LOCK(SHA2(?, 256), 5) AS acquired", [lockName],
      );
      locked = Number(lockRows[0]?.acquired) === 1;
      if (!locked) throw new Error("Não foi possível obter o bloqueio do alerta regional.");

      await qr.startTransaction();
      const counts: Array<{ clients: number | string; searches: number | string }> = await qr.query(`
        SELECT COUNT(DISTINCT e.profile_id) AS clients, COUNT(*) AS searches
        FROM demand_search_events e
        INNER JOIN demand_profiles p ON p.id = e.profile_id
        WHERE e.categoria_id = ?
          AND e.resultado = 'SEM_RESULTADO'
          AND e.created_at >= NOW(6) - INTERVAL 30 DAY
          AND LOWER(TRIM(CONCAT_WS(' ',
            COALESCE(NULLIF(TRIM(p.bairro), ''), NULLIF(TRIM(e.bairro), '')),
            COALESCE(NULLIF(TRIM(p.cidade), ''), NULLIF(TRIM(e.cidade), '')),
            COALESCE(NULLIF(TRIM(p.uf), ''), NULLIF(TRIM(e.uf), ''))
          ))) COLLATE utf8mb4_0900_ai_ci = ?
      `, [categoryId, region]);
      const clients = Number(counts[0]?.clients ?? 0);
      const searches = Number(counts[0]?.searches ?? 0);
      // Consultar qualquer estado: RESOLVIDO/DESCARTADO não pode ser reaberto
      // automaticamente nem gerar um segundo alerta para a mesma região.
      const alerts: Array<{ id: string; status: string }> = await qr.query(`
        SELECT id, status FROM demand_admin_alerts
        WHERE categoria_id = ? AND chave_regiao = ?
        ORDER BY updated_at DESC, id DESC LIMIT 1 FOR UPDATE
      `, [categoryId, region]);
      const latest = alerts[0];
      if (latest && (latest.status === "RESOLVIDO" || latest.status === "DESCARTADO")) {
        await qr.commitTransaction();
        return;
      }
      if (latest) {
        await qr.query(`
          UPDATE demand_admin_alerts
          SET clientes_distintos = ?, pesquisas_total = ?,
              janela_inicio = NOW(6) - INTERVAL 30 DAY, janela_fim = NOW(6)
          WHERE id = ?
        `, [clients, searches, latest.id]);
      } else if (clients >= 10) {
        await qr.query(`
          INSERT INTO demand_admin_alerts
            (id, categoria_id, termo_normalizado, chave_regiao,
             janela_inicio, janela_fim, clientes_distintos, pesquisas_total)
          VALUES (?, ?, ?, ?, NOW(6) - INTERVAL 30 DAY, NOW(6), ?, ?)
        `, [randomUUID(), categoryId, this.normalize(categoryName), region, clients, searches]);
      }
      await qr.commitTransaction();
    } catch (error) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw error;
    } finally {
      try {
        if (locked) await qr.query("SELECT RELEASE_LOCK(SHA2(?, 256))", [lockName]);
      } finally {
        await qr.release();
      }
    }
  }

  /** Consulta o perfil vinculado à conversa, sem criar uma nova pesquisa. */
  async findConversationProfile(conversationId: string): Promise<string | null> {
    if (!AppDataSource.isInitialized || !conversationId) return null;
    const rows: Array<{ profile_id: string }> = await AppDataSource.query(
      "SELECT profile_id FROM demand_search_events WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1",
      [conversationId],
    );
    return rows[0]?.profile_id ?? null;
  }

  /** Atualiza a região informada voluntariamente e reagrupa os interesses. */
  async updateRegion(input: {
    conversationId: string;
    bairro: string;
    cidade?: string | null;
    uf?: string | null;
  }): Promise<boolean> {
    const profileId = await this.findConversationProfile(input.conversationId);
    if (!profileId) return false;
    const bairro = input.bairro.trim().slice(0, 120);
    if (!bairro || bairro.length < 2) return false;
    const cidade = (input.cidade || "São Paulo").trim().slice(0, 120);
    const uf = (input.uf || "SP").trim().toUpperCase().slice(0, 2);
    const region = this.normalize(`${bairro} ${cidade} ${uf}`).slice(0, 200);
    await AppDataSource.transaction(async (manager) => {
      await manager.query(
        "UPDATE demand_profiles SET bairro = ?, cidade = ?, uf = ?, perfil_tipo = CASE WHEN usuario_id IS NULL THEN 'EXTERNO' ELSE perfil_tipo END WHERE id = ?",
        [bairro, cidade, uf, profileId],
      );
      // O histórico bruto permanece imutável; a região atual vale para os próximos eventos.
      const interests: Array<{ id: string; categoria_id: number; termo_normalizado: string; total_pesquisas: number; total_sem_resultado: number }> = await manager.query(
        "SELECT id, categoria_id, termo_normalizado, total_pesquisas, total_sem_resultado FROM demand_interests WHERE profile_id = ? AND chave_regiao = 'NAO_INFORMADA'",
        [profileId],
      );
      for (const interest of interests) {
        const matches: Array<{ id: string }> = await manager.query(
          "SELECT id FROM demand_interests WHERE profile_id = ? AND categoria_id = ? AND termo_normalizado = ? AND chave_regiao = ? LIMIT 1",
          [profileId, interest.categoria_id, interest.termo_normalizado, region],
        );
        if (matches[0]) {
          await manager.query(
            "UPDATE demand_interests SET total_pesquisas = total_pesquisas + ?, total_sem_resultado = total_sem_resultado + ?, ultima_pesquisa = NOW(6) WHERE id = ?",
            [interest.total_pesquisas, interest.total_sem_resultado, matches[0].id],
          );
          await manager.query("DELETE FROM demand_interests WHERE id = ?", [interest.id]);
        } else {
          await manager.query("UPDATE demand_interests SET chave_regiao = ? WHERE id = ?", [region, interest.id]);
        }
      }
    });
    // Após atualizar a região, recalcular as categorias com demanda sem resultado.
    const affected: Array<{ categoria_id: number; termo_normalizado: string }> = await AppDataSource.query(
      `SELECT DISTINCT categoria_id, termo_normalizado FROM demand_interests
       WHERE profile_id = ? AND chave_regiao = ? AND total_sem_resultado > 0
         AND categoria_id IS NOT NULL`,
      [profileId, region],
    );
    for (const item of affected) {
      await this.refreshRegionalAlert(Number(item.categoria_id), item.termo_normalizado, region);
    }
    return true;
  }

  /** Grava contato SOMENTE após consentimento afirmativo explícito. Não envia mensagens. */
  async saveContactConsent(input: {
    conversationId: string;
    canal: "EMAIL" | "WHATSAPP";
    contato: string;
    consentimentoExplicito: boolean;
  }): Promise<boolean> {
    if (!input.consentimentoExplicito) return false;
    const profileId = await this.findConversationProfile(input.conversationId);
    if (!profileId) return false;
    const contato = input.contato.trim();
    if (input.canal === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) return false;
    if (input.canal === "WHATSAPP" && !/^\+?[0-9()\s-]{10,20}$/.test(contato)) return false;
    const existing: Array<{ id: string }> = await AppDataSource.query(
      "SELECT id FROM demand_contact_consents WHERE profile_id = ? AND canal = ? AND contato = ? AND revogado_em IS NULL LIMIT 1",
      [profileId, input.canal, contato],
    );
    if (existing[0]) return true;
    await AppDataSource.query(
      "INSERT INTO demand_contact_consents (id, profile_id, canal, contato) VALUES (?, ?, ?, ?)",
      [randomUUID(), profileId, input.canal, contato],
    );
    return true;
  }

  async record(input: RadarInput): Promise<{ missing: boolean; categoryName: string } | null> {
    if (process.env.NODE_ENV !== "local" && process.env.GRANCONECTA_DEMAND_RADAR_ENABLED !== "true") return null;
    const message = this.normalize(input.message);
    if (!message || !AppDataSource.isInitialized) return null;
    const categories: Array<{ id: number; name: string }> = await AppDataSource.query(
      "SELECT id, name FROM categories WHERE LOWER(tipo) = 'servico' ORDER BY CHAR_LENGTH(name) DESC",
    );
    const category = categories.find((item) => {
      const name = this.normalize(item.name);
      return name.length >= 4 && (` ${message} `).includes(` ${name} `);
    });
    if (!category) return null; // Não contabilizar saudações ou respostas de contato.

    const missing = /nenhum profissional ou loja compativel foi encontrado|nenhum profissional|nenhuma loja compativel|nao foram encontrados profissionais/i
      .test(this.normalize(input.platformContext));
    const userId = String(input.userId || "").trim() || null;
    const visitorToken = userId ? null : createHash("sha256")
      .update(`granconecta-radar:${input.conversationId}`).digest("hex").slice(0, 36);
    const manager = AppDataSource.manager;
    const profiles: Array<{ id: string }> = userId
      ? await manager.query("SELECT id FROM demand_profiles WHERE usuario_id = ? LIMIT 1", [userId])
      : await manager.query("SELECT id FROM demand_profiles WHERE visitor_token = ? LIMIT 1", [visitorToken]);
    let profileId = profiles[0]?.id;
    let condominioId = input.condominioId || null;
    let bairro: string | null = null;
    let cidade: string | null = null;
    let uf: string | null = null;
    if (profileId) {
      const previous: Array<{ bairro: string | null; cidade: string | null; uf: string | null }> = await manager.query(
        "SELECT bairro, cidade, uf FROM demand_profiles WHERE id = ? LIMIT 1", [profileId],
      );
      bairro = previous[0]?.bairro || null;
      cidade = previous[0]?.cidade || null;
      uf = previous[0]?.uf || null;
    }
    if (userId) {
      const rows: Array<{ condominio_id: string | null; bairro: string | null; cidade: string | null; uf: string | null }> =
        await manager.query("SELECT u.condominio_id, c.bairro, c.cidade, c.uf FROM usuarios u LEFT JOIN condominios c ON c.id = u.condominio_id WHERE u.id = ? LIMIT 1", [userId]);
      if (rows[0]) {
        condominioId = rows[0].condominio_id || condominioId;
        bairro = rows[0].bairro || bairro;
        cidade = rows[0].cidade || cidade;
        uf = rows[0].uf || uf;
      }
    }
    if (!profileId) {
      profileId = randomUUID();
      await manager.query(
        "INSERT INTO demand_profiles (id, visitor_token, usuario_id, perfil_tipo, condominio_id, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [profileId, visitorToken, userId, userId ? "CADASTRADO" : "ANONIMO", condominioId, bairro, cidade, uf],
      );
    }
    const region = bairro ? this.normalize(`${bairro} ${cidade || ""} ${uf || ""}`).slice(0, 200) : "NAO_INFORMADA";
    await manager.query(
      "INSERT INTO demand_search_events (id, profile_id, conversation_id, categoria_id, termo_original, termo_normalizado, canal, resultado, quantidade_encontrada, condominio_id, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), profileId, input.conversationId, category.id, input.message.slice(0, 500), this.normalize(category.name), String(input.canal || "CHAT_HOME").slice(0, 40), missing ? "SEM_RESULTADO" : "ENCONTRADO", missing ? 0 : 1, condominioId, bairro, cidade, uf],
    );
    const existing: Array<{ id: string }> = await manager.query(
      "SELECT id FROM demand_interests WHERE profile_id = ? AND categoria_id = ? AND termo_normalizado = ? AND chave_regiao = ? LIMIT 1",
      [profileId, category.id, this.normalize(category.name), region],
    );
    if (existing.length) {
      await manager.query("UPDATE demand_interests SET total_pesquisas = total_pesquisas + 1, total_sem_resultado = total_sem_resultado + ?, ultima_pesquisa = NOW(6) WHERE id = ?", [missing ? 1 : 0, existing[0]!.id]);
    } else {
      await manager.query(
        "INSERT INTO demand_interests (id, profile_id, categoria_id, termo_normalizado, chave_regiao, total_pesquisas, total_sem_resultado) VALUES (?, ?, ?, ?, ?, 1, ?)",
        [randomUUID(), profileId, category.id, this.normalize(category.name), region, missing ? 1 : 0],
      );
    }
    if (missing) {
      await this.refreshRegionalAlert(category.id, category.name, region);
    }
    console.log("[RADAR DEMANDA] Pesquisa registrada", { categoryId: category.id, missing, profileId, region });
    return { missing, categoryName: category.name };
  }
}

export default GranConectaDemandRadarService;
