import { randomUUID } from "node:crypto";
import { AppDataSource } from "../../config/data-source";

/** Relatório agregado. Não retorna identificadores, contatos nem mensagens dos moradores. */
class GranConectaDemandRadarAdminService {
  async getOverview() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Banco de dados não inicializado.");
    }

    // Os interesses são consolidados por perfil/categoria/região.
    // Não contar linhas como pesquisas: utilizar os contadores persistidos.
    const totals: Array<{
      pesquisas: string | number;
      sem_resultado: string | number;
      interessados: string | number;
      regioes: string | number;
    }> = await AppDataSource.query(`
      SELECT
        COALESCE(SUM(i.total_pesquisas), 0) AS pesquisas,
        COALESCE(SUM(i.total_sem_resultado), 0) AS sem_resultado,
        COUNT(DISTINCT CASE WHEN i.total_sem_resultado > 0 THEN i.profile_id END) AS interessados,
        COUNT(DISTINCT CASE WHEN i.chave_regiao <> 'NAO_INFORMADA' THEN i.chave_regiao END) AS regioes
      FROM demand_interests i
    `);

    const opportunities: Array<{
      categoria_id: number;
      categoria: string;
      bairro: string | null;
      cidade: string | null;
      uf: string | null;
      chave_regiao: string;
      pesquisas: string | number;
      sem_resultado: string | number;
      interessados: string | number;
      alerta_id: string | null;
      status_gestao: string | null;
    }> = await AppDataSource.query(`
      SELECT
        i.categoria_id,
        COALESCE(c.name, i.termo_normalizado) AS categoria,
        p.bairro,
        p.cidade,
        p.uf,
        i.chave_regiao,
        (SELECT a.id FROM demand_admin_alerts a
         WHERE a.categoria_id = i.categoria_id AND a.chave_regiao = i.chave_regiao
         ORDER BY a.updated_at DESC LIMIT 1) AS alerta_id,
        (SELECT a.status FROM demand_admin_alerts a
         WHERE a.categoria_id = i.categoria_id AND a.chave_regiao = i.chave_regiao
         ORDER BY a.updated_at DESC LIMIT 1) AS status_gestao,
        SUM(i.total_pesquisas) AS pesquisas,
        SUM(i.total_sem_resultado) AS sem_resultado,
        COUNT(DISTINCT CASE WHEN i.total_sem_resultado > 0 THEN i.profile_id END) AS interessados
      FROM demand_interests i
      LEFT JOIN categories c ON c.id = i.categoria_id
      LEFT JOIN demand_profiles p ON p.id = i.profile_id
      GROUP BY i.categoria_id, COALESCE(c.name, i.termo_normalizado),
               p.bairro, p.cidade, p.uf, i.chave_regiao
      ORDER BY sem_resultado DESC, interessados DESC, pesquisas DESC
      LIMIT 100
    `);

    const total = totals[0];
    return {
      resumo: {
        pesquisas: Number(total?.pesquisas ?? 0),
        semResultado: Number(total?.sem_resultado ?? 0),
        interessados: Number(total?.interessados ?? 0),
        regioes: Number(total?.regioes ?? 0),
      },
      oportunidades: opportunities.map((row) => ({
        categoriaId: Number(row.categoria_id),
        categoria: row.categoria,
        bairro: row.bairro,
        cidade: row.cidade,
        uf: row.uf,
        chaveRegiao: row.chave_regiao,
        pesquisas: Number(row.pesquisas),
        semResultado: Number(row.sem_resultado),
        interessados: Number(row.interessados),
        alertaId: row.alerta_id,
        statusGestao: row.status_gestao || "NOVO",
      })),
    };
  }
  /** Atualiza o acompanhamento administrativo; não dispara notificações aos clientes. */
  async updateOpportunity(input: {
    categoriaId: number;
    chaveRegiao: string;
    status: "NOVO" | "EM_CAPTACAO" | "RESOLVIDO" | "DESCARTADO";
    observacao?: string;
    adminId?: string | null;
  }) {
    if (!AppDataSource.isInitialized) throw new Error("Banco não inicializado.");
    const { categoriaId, chaveRegiao, status } = input;
    if (!Number.isInteger(categoriaId) || categoriaId <= 0 || !chaveRegiao || chaveRegiao.length > 200) {
      throw new Error("Categoria ou região inválida.");
    }
    const observacao = (input.observacao || "").trim();
    if (observacao.length > 1000) throw new Error("Observação muito longa (máximo 1000 caracteres).");
    const lockName = `gc_radar_${categoriaId}_${chaveRegiao}`;
    // Lock nomeado evita duas ações administrativas simultâneas criarem dois alertas.
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    let locked = false;
    try {
      const lockRows: Array<{ acquired: number }> = await qr.query(
        "SELECT GET_LOCK(SHA2(?, 256), 5) AS acquired", [lockName]);
      locked = Number(lockRows[0]?.acquired) === 1;
      if (!locked) throw new Error("Oportunidade em atualização. Tente novamente.");
      await qr.startTransaction();
      const rows: Array<{ termo_normalizado: string; pesquisas: number | string; interessados: number | string }> = await qr.query(`
        SELECT MIN(termo_normalizado) AS termo_normalizado,
               SUM(total_pesquisas) AS pesquisas,
               COUNT(DISTINCT CASE WHEN total_sem_resultado > 0 THEN profile_id END) AS interessados
        FROM demand_interests WHERE categoria_id = ? AND chave_regiao = ?
        HAVING COUNT(*) > 0`, [categoriaId, chaveRegiao]);
      const oportunidade = rows[0];
      if (!oportunidade) throw new Error("Oportunidade não encontrada.");
      const alerts: Array<{ id: string; status: string }> = await qr.query(`
        SELECT id, status FROM demand_admin_alerts
        WHERE categoria_id = ? AND chave_regiao = ?
        ORDER BY updated_at DESC LIMIT 1 FOR UPDATE`, [categoriaId, chaveRegiao]);
      const previous = alerts[0]?.status || null;
      const id = alerts[0]?.id || randomUUID();
      if (alerts.length) {
        await qr.query(`UPDATE demand_admin_alerts SET status = ?, clientes_distintos = ?,
          pesquisas_total = ?, janela_fim = NOW(6) WHERE id = ?`,
          [status, Number(oportunidade.interessados), Number(oportunidade.pesquisas), id]);
      } else {
        await qr.query(`INSERT INTO demand_admin_alerts
          (id, categoria_id, termo_normalizado, chave_regiao, janela_inicio, janela_fim,
           clientes_distintos, pesquisas_total, status)
          VALUES (?, ?, ?, ?, NOW(6), NOW(6), ?, ?, ?)`,
          [id, categoriaId, oportunidade.termo_normalizado, chaveRegiao,
           Number(oportunidade.interessados), Number(oportunidade.pesquisas), status]);
      }
      await qr.query(`INSERT INTO demand_admin_alert_history
        (id, alerta_id, status_anterior, status_novo, observacao, admin_usuario_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), id, previous, status, observacao || null, input.adminId || null]);
      await qr.commitTransaction();
      return { id, status };
    } catch (err) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw err;
    } finally {
      if (locked) await qr.query("SELECT RELEASE_LOCK(SHA2(?, 256))", [lockName]);
      await qr.release();
    }
  }

  /** Lista vínculos de uma oportunidade, sem dados pessoais de moradores. */
  async listOpportunityProfessionals(alertaId: string) {
    if (!AppDataSource.isInitialized) throw new Error("Banco não inicializado.");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alertaId)) {
      throw new Error("Identificador da oportunidade inválido.");
    }
    const alerts: Array<{ id: string }> = await AppDataSource.query(
      "SELECT id FROM demand_admin_alerts WHERE id = ? LIMIT 1", [alertaId]);
    if (!alerts[0]) throw new Error("Oportunidade não encontrada.");
    const rows: Array<{
      id: string; alerta_id: string; prestador_id: string | null;
      nome_externo: string | null; status: string; observacao: string | null;
      created_at: Date; updated_at: Date; nome_profissional: string | null;
      perfil_status: string | null; perfil_ativo: number | null;
      status_aprovacao: string | null; status_assinatura: string | null;
      assinatura_vence_em: Date | null; bloqueado_por_assinatura: number | null;
      usuario_status: string | null; categoriaid: number | null;
    }> = await AppDataSource.query(`
      SELECT v.id, v.alerta_id, v.prestador_id, v.nome_externo, v.status,
             v.observacao, v.created_at, v.updated_at,
             p.nome_profissional, p.status AS perfil_status, p.ativo AS perfil_ativo,
             p.status_aprovacao, p.status_assinatura, p.assinatura_vence_em,
             p.bloqueado_por_assinatura, p.categoriaid,
             u.status_conta AS usuario_status
      FROM demand_opportunity_professionals v
      LEFT JOIN perfil_prestador p ON p.id = v.prestador_id
      LEFT JOIN usuarios u ON u.id = p.usuarioId
      WHERE v.alerta_id = ?
      ORDER BY v.created_at DESC, v.id DESC`, [alertaId]);
    return rows.map((r) => {
      const cadastrado = Boolean(r.prestador_id);
      const perfilStatus = String(r.perfil_status ?? "").trim().toUpperCase();
      const aprovacaoStatus = String(r.status_aprovacao ?? "").trim().toUpperCase();
      const usuarioStatus = String(r.usuario_status ?? "").trim().toUpperCase();
      const assinaturaStatus = String(r.status_assinatura ?? "").trim().toUpperCase();
      const perfilAtivo = Number(r.perfil_ativo ?? 0) === 1;
      const assinaturaBloqueada = Number(r.bloqueado_por_assinatura) === 1;
      const assinaturaVencida = r.assinatura_vence_em != null &&
        !Number.isNaN(new Date(r.assinatura_vence_em).getTime()) &&
        new Date(r.assinatura_vence_em).getTime() < Date.now();

      // Diagnóstico administrativo, NÃO é autorização de encaminhamento pelo DOT.
      // O serviço canônico de elegibilidade deve decidir se o profissional aparece nas buscas.
      const pendencias: string[] = [];
      if (!cadastrado) {
        pendencias.push("Profissional ainda não associado a um cadastro.");
      } else {
        if (perfilStatus !== "ATIVO") pendencias.push("Perfil ainda não está com status ativo.");
        if (aprovacaoStatus !== "APROVADO") pendencias.push("Aprovação do perfil pendente.");
        if (!perfilAtivo) pendencias.push("Perfil desativado.");
        if (usuarioStatus !== "APROVADO") pendencias.push("Conta do usuário não aprovada.");
        if (assinaturaStatus !== "ATIVA" && assinaturaStatus !== "ATIVO") {
          pendencias.push("Assinatura ainda não está ativa.");
        }
        if (assinaturaBloqueada) pendencias.push("Assinatura bloqueada.");
        if (assinaturaVencida) pendencias.push("Validade da assinatura expirada.");
      }

      return {
        id: r.id, alertaId: r.alerta_id, prestadorId: r.prestador_id,
        nome: r.nome_externo ?? r.nome_profissional,
        origem: cadastrado ? "CADASTRADO" : "EXTERNO",
        status: r.status, observacao: r.observacao,
        createdAt: r.created_at, updatedAt: r.updated_at,
        habilitacao: cadastrado ? {
          perfilStatus: r.perfil_status, ativo: perfilAtivo,
          statusAprovacao: r.status_aprovacao,
          statusAssinatura: r.status_assinatura,
          assinaturaVenceEm: r.assinatura_vence_em,
          bloqueadoPorAssinatura: assinaturaBloqueada,
          usuarioStatus: r.usuario_status, categoriaId: r.categoriaid,
        } : null,
        acompanhamento: {
          cadastroAssociado: cadastrado,
          perfilStatus: r.perfil_status,
          statusAprovacao: r.status_aprovacao,
          perfilAtivo,
          usuarioStatus: r.usuario_status,
          statusAssinatura: r.status_assinatura,
          assinaturaVenceEm: r.assinatura_vence_em,
          assinaturaBloqueada,
          assinaturaVencida,
          pendencias,
          // Não declarar elegibilidade a partir de uma consulta administrativa.
          elegibilidadeDot: "NAO_VERIFICADA" as const,
        },
      };
    });
  }

  /** Adiciona um vínculo; a oportunidade deve já possuir um alerta administrativo. */
  async addOpportunityProfessional(input: {
    alertaId: string;
    prestadorId?: string | null;
    nomeExterno?: string | null;
    observacao?: string | null;
  }) {
    if (!AppDataSource.isInitialized) throw new Error("Banco não inicializado.");
    const { alertaId } = input;
    const prestadorId = input.prestadorId?.trim() || null;
    const nomeExterno = input.nomeExterno?.trim() || null;
    const observacao = input.observacao?.trim() || null;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(alertaId)) throw new Error("Identificador da oportunidade inválido.");
    if ((prestadorId === null) === (nomeExterno === null)) {
      throw new Error("Informe somente um prestador cadastrado ou um nome externo.");
    }
    if (prestadorId && !uuid.test(prestadorId)) throw new Error("Prestador inválido.");
    if (nomeExterno && nomeExterno.length > 150) throw new Error("Nome externo muito longo.");
    if (observacao && observacao.length > 1000) throw new Error("Observação muito longa.");
    return AppDataSource.transaction(async (manager) => {
      const alerts: Array<{ id: string; categoria_id: number | null }> = await manager.query(
        "SELECT id, categoria_id FROM demand_admin_alerts WHERE id = ? LIMIT 1", [alertaId]);
      const alerta = alerts[0];
      if (!alerta) throw new Error("Oportunidade não encontrada. Inicie a captação primeiro.");
      if (prestadorId) {
        const prestadores: Array<{ id: string; categoriaid: number | null }> = await manager.query(
          "SELECT id, categoriaid FROM perfil_prestador WHERE id = ? LIMIT 1", [prestadorId]);
        const prestador = prestadores[0];
        if (!prestador) throw new Error("Prestador não encontrado.");
        if (alerta.categoria_id != null && prestador.categoriaid != null &&
            Number(alerta.categoria_id) !== Number(prestador.categoriaid)) {
          throw new Error("A categoria do prestador é diferente da oportunidade.");
        }
        const existing: Array<{ id: string }> = await manager.query(
          "SELECT id FROM demand_opportunity_professionals WHERE alerta_id = ? AND prestador_id = ? LIMIT 1",
          [alertaId, prestadorId]);
        if (existing[0]) throw new Error("Prestador já vinculado a esta oportunidade.");
      }
      const id = randomUUID();
      await manager.query(`
        INSERT INTO demand_opportunity_professionals
          (id, alerta_id, prestador_id, nome_externo, status, observacao)
        VALUES (?, ?, ?, ?, 'PROSPECTADO', ?)`,
        [id, alertaId, prestadorId, nomeExterno, observacao]);
      return { id, alertaId, prestadorId, nomeExterno, status: "PROSPECTADO" as const };
    });
  }

  /** Atualiza somente o acompanhamento comercial do profissional vinculado. */
  async updateOpportunityProfessional(input: {
    vinculoId: string;
    status: "PROSPECTADO" | "CONTATADO" | "INTERESSADO" | "CADASTRADO" | "DESCARTADO";
    observacao?: string | null;
  }) {
    if (!AppDataSource.isInitialized) throw new Error("Banco não inicializado.");
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(input.vinculoId)) throw new Error("Vínculo inválido.");
    const valid = ["PROSPECTADO", "CONTATADO", "INTERESSADO", "CADASTRADO", "DESCARTADO"];
    if (!valid.includes(input.status)) throw new Error("Status inválido.");
    const observacao = input.observacao?.trim() ?? null;
    if (observacao && observacao.length > 1000) throw new Error("Observação muito longa.");
    const result: { affectedRows?: number } = await AppDataSource.query(`
      UPDATE demand_opportunity_professionals
      SET status = ?, observacao = COALESCE(?, observacao)
      WHERE id = ?`, [input.status, observacao, input.vinculoId]);
    if (!result.affectedRows) throw new Error("Vínculo não encontrado.");
    return { id: input.vinculoId, status: input.status };
  }


  /**
   * Converte um prospect externo em vínculo com perfil real, sem criar outra linha.
   * Não aprova cadastro, não altera assinatura e não autoriza o DOT.
   */
  async associateExternalProfessional(input: { vinculoId: string; prestadorId: string }) {
    if (!AppDataSource.isInitialized) throw new Error("Banco não inicializado.");
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(input.vinculoId) || !uuid.test(input.prestadorId)) {
      throw new Error("Identificador do vínculo ou prestador inválido.");
    }

    return AppDataSource.transaction(async (manager) => {
      const rows: Array<{
        id: string; alerta_id: string; prestador_id: string | null;
        nome_externo: string | null; observacao: string | null; categoria_id: number | null;
      }> = await manager.query(`
        SELECT v.id, v.alerta_id, v.prestador_id, v.nome_externo,
               v.observacao, a.categoria_id
        FROM demand_opportunity_professionals v
        INNER JOIN demand_admin_alerts a ON a.id = v.alerta_id
        WHERE v.id = ? FOR UPDATE`, [input.vinculoId]);
      const vinculo = rows[0];
      if (!vinculo) throw new Error("Vínculo de prospecção não encontrado.");
      if (vinculo.prestador_id) throw new Error("Este vínculo já está associado a um prestador.");

      const prestadores: Array<{ id: string; categoriaid: number | null }> = await manager.query(
        "SELECT id, categoriaid FROM perfil_prestador WHERE id = ? LIMIT 1",
        [input.prestadorId]
      );
      const prestador = prestadores[0];
      if (!prestador) throw new Error("Prestador cadastrado não encontrado.");
      if (vinculo.categoria_id != null &&
          Number(vinculo.categoria_id) !== Number(prestador.categoriaid)) {
        throw new Error("A categoria do prestador é diferente da oportunidade.");
      }

      const duplicados: Array<{ id: string }> = await manager.query(
        `SELECT id FROM demand_opportunity_professionals
         WHERE alerta_id = ? AND prestador_id = ? LIMIT 1`,
        [vinculo.alerta_id, input.prestadorId]
      );
      if (duplicados.length) throw new Error("Prestador já vinculado a esta oportunidade.");

      // O CHECK da tabela exige nome_externo = NULL quando prestador_id está preenchido.
      // Preservamos o nome usado na prospecção na observação existente.
      const anotacao = vinculo.nome_externo
        ? `Nome na prospecção: ${vinculo.nome_externo}` : "";
      const observacao = [vinculo.observacao, anotacao].filter(Boolean).join("\n");
      if (observacao.length > 1000) {
        throw new Error("A observação atingiu o limite. Reduza-a antes de associar o cadastro.");
      }
      await manager.query(`
        UPDATE demand_opportunity_professionals
        SET prestador_id = ?, nome_externo = NULL, status = 'CADASTRADO', observacao = ?
        WHERE id = ?`, [input.prestadorId, observacao || null, input.vinculoId]);

      return { id: input.vinculoId, alertaId: vinculo.alerta_id,
        prestadorId: input.prestadorId, status: "CADASTRADO" as const };
    });
  }

}

export default new GranConectaDemandRadarAdminService();
