import { AppDataSource } from "../../config/data-source";
import GeocodingService from "../address/GeocodingService";
import type { ChatMessageInput } from "./ChatTypes";

type CategoryResult = {
  id: number | string;
  name: string;
  score: number;
};

export type StoreResult = {
  id: string;
  name: string;
  slug: string;
  prestadorId?: string | null;
  possuiLandingPublicada?: boolean | number;
  tipo?: string | null;
  categoria: string | null;
  categoria_tag?: string | null;
  descricao_loja: string | null;
  condominio_id: string | null;
  logo_url?: string | null;
  capa_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanciaKm?: number | null;
};

type DocumentoLegalResult = {
  id: string;
  tipo: string;
  titulo: string;
  versao: string;
  conteudo: string;
};



export class ChatKnowledgeService {
  private readonly frontendUrl = (
    process.env.FRONTEND_PUBLIC_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

  // Regra única para recomendações públicas: exige perfil comercial regular.
  // O tipo MORADOR não impede a atuação como prestador quando existe perfil
  // comercial aprovado; um empreendedor sem perfil verificável não é exibido.
  private readonly publicBusinessJoins = `
    INNER JOIN usuarios u ON u.id = s.usuarioId
    LEFT JOIN perfil_prestador p ON p.usuarioId = s.usuarioId
    LEFT JOIN enderecos ep ON ep.id = (
      SELECT e.id FROM enderecos e
      WHERE e.usuarioId = s.usuarioId
        AND (e.localizacao_publica = 1 OR e.proximidade_autorizada = 1)
        AND e.geocoding_status = 'LOCALIZADO'
        AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
      ORDER BY e.id DESC LIMIT 1
    )
  `;

  private readonly publicBusinessEligibility = `
    s.ativa = 1
    AND LOWER(TRIM(u.status_conta)) = 'ativo'
    AND p.id IS NOT NULL
    AND p.ativo = 1
    AND LOWER(TRIM(p.status)) = 'ativo'
    AND p.disponivel = 1
    AND UPPER(TRIM(p.status_aprovacao)) = 'APROVADO'
    AND UPPER(TRIM(p.status_assinatura)) IN ('ATIVA', 'A_VENCER')
    AND COALESCE(p.bloqueado_por_assinatura, 0) = 0
    AND p.assinatura_vence_em IS NOT NULL
    AND p.assinatura_vence_em > NOW()
  `;

  private readonly publicBusinessPublication = `
    CASE WHEN s.pageHtmlPublished IS NOT NULL
      AND LENGTH(TRIM(s.pageHtmlPublished)) > 0 THEN 1 ELSE 0 END
  `;

  private readonly publicBusinessName = `
    CASE WHEN TRIM(s.name) = 'Minha Loja'
      THEN COALESCE(NULLIF(TRIM(p.nome_profissional), ''), s.name)
      ELSE s.name END
  `;

  async buildContext(input: ChatMessageInput): Promise<string> {

    //const ownerContext = await this.buildOwnerContext(input);

    const legalContext = await this.buildLegalDocumentsContext(input.message);
    if (
      (input.chatbotTipo === "LOJA" || input.chatbotTipo === "PRESTADOR") &&
      input.chatbotOwnerId
    ) {
      return this.buildOwnerContext(input, legalContext);
    }

    /**
     * Campanha institucional por CATEGORIA:
     * não tentamos descobrir o nicho a partir de "Quero saber mais".
     * A própria campanha já informou categoriaId/categoriaNome.
     */
    if (
      input.tipoDestino === "CATEGORIA" &&
      input.categoriaId
    ) {
      const stores =
        await this.findStoresByCampaignCategory(
          input.categoriaId,
          input.condominioId,
        );

      console.log(
        "[CHAT KNOWLEDGE] Campanha por categoria",
        {
          campanhaId:
            input.campanhaId || null,
          categoriaId:
            input.categoriaId,
          categoriaNome:
            input.categoriaNome || null,
          encontrados:
            stores.length,
        },
      );

      return this.formatStoresContext(
        stores,
        legalContext,
        `Profissionais e lojas reais da categoria ${
          input.categoriaNome || input.categoriaId
        } encontrados no GranConecta:`,
        `Nenhum profissional ou loja ativa da categoria ${
          input.categoriaNome || input.categoriaId
        } foi encontrado no GranConecta neste momento.`,
      );
    }

    const searchTerms = this.extractSearchTerms(input.message);

    console.log("TERMOS PESQUISADOS:", searchTerms);

    if (this.isAvailabilitySearch(input.message) && !this.hasSpecificServiceNeed(input.message)) {
      const tipo = this.resolveAvailabilityType(input.message);
      const stores = await this.findActiveStoresByType(
        tipo,
        input.condominioId,
      );

      return this.formatStoresContext(
        stores,
        legalContext,
        "Profissionais e lojas ativos encontrados no GranConecta:",
        "Nenhum profissional ou loja ativa foi encontrado no GranConecta neste momento.",
      );
    }

    if (!searchTerms.length) {
      return `
${legalContext || ""}

Nenhum termo relevante foi identificado para pesquisa de lojas ou profissionais.
      `.trim();
    }

    const categories = await this.findSimilarCategories(searchTerms);

    console.log("CATEGORIAS PARECIDAS:", categories);

    const stores = await this.findStores(
      categories,
      searchTerms,
      input.condominioId,
    );

    console.log("PROFISSIONAIS ENCONTRADOS:", stores.map(({ id, name, slug }) => ({ id, name, slug })));

    if (!stores.length) {
      return `
${legalContext || ""}

Nenhum profissional ou loja compatível foi encontrado no GranConecta.
Termos pesquisados: ${searchTerms.join(", ")}.
Categorias semelhantes: ${categories.map((category) => category.name).join(", ") || "nenhuma"
        }.
      `.trim();
    }

    return this.formatStoresContext(
      stores,
      legalContext,
      "Profissionais e lojas reais encontrados no GranConecta:",
      "Nenhum profissional ou loja compatível foi encontrado no GranConecta.",
    );
  }

  /** Busca pública estruturada do DOT, sem depender da redação da IA. */
  /**
   * userId é opcional: o chamador deve fornecê-lo somente após validar
   * a identidade autenticada no backend. A autorização de proximidade do
   * endereço é verificada aqui antes de utilizar suas coordenadas.
   */
  async listDotBusinesses(
    message: string,
    condominioId?: string,
    userId?: string | null,
    cepOrigem?: string | null,
  ): Promise<StoreResult[]> {
    const generalDiscovery = this.isAvailabilitySearch(message) &&
      !this.hasSpecificServiceNeed(message);
    const terms = this.extractSearchTerms(message);
    // Mesmo sem termos lexicais, a IA pode identificar a especialidade implícita.
    const interpreted = generalDiscovery ? null : await this.interpretDotSearch(message);
    const searchTerms = interpreted?.terms?.length ? interpreted.terms : terms;
    const matchedCategories = interpreted?.categoryIds?.length
      ? await this.findCategoriesByIds(interpreted.categoryIds)
      : await this.findSimilarCategories(searchTerms);
    const stores = generalDiscovery
      ? await this.findActiveStoresByType(this.resolveAvailabilityType(message), condominioId)
      : await this.findStores(matchedCategories, searchTerms, condominioId, 100);
    console.info("[DOT BUSCA] Consulta estruturada", {
      generalDiscovery, tipo: generalDiscovery ? this.resolveAvailabilityType(message) : "ESPECIALIDADE",
      termos: generalDiscovery ? [] : searchTerms, categorias: matchedCategories.map(c => c.name), encontrados: stores.length,
    });
    const cepNormalizado = String(cepOrigem || "").replace(/\D/g, "");
    // CEP é referência aproximada da região, não coordenada do imóvel.
    const cepGeo = cepNormalizado.length === 8
      ? await GeocodingService.geocodificarPorCep({ cep: cepNormalizado })
      : null;
    if (!userId && !cepGeo) {
      console.info("[DOT GEO] Sem CEP geocodificado ou origem autenticada; distância indisponível.");
      return stores.slice(0, 8).map(({ latitude, longitude, ...safe }) => safe);
    }

    // Origem do cálculo: endereço do próprio usuário somente com autorização
    // explícita para proximidade. O userId deve vir da autenticação no backend.
    // Não usamos localizacao_publica como consentimento para o consumidor.
    type GeoOrigin = {
      latitude: string | number | null;
      longitude: string | number | null;
      origem: "ENDERECO" | "CONDOMINIO" | "CEP";
    };

    const addressOrigins: GeoOrigin[] = cepGeo || !userId ? [] : await AppDataSource.query(
      `SELECT e.latitude, e.longitude, 'ENDERECO' AS origem
       FROM enderecos e
       INNER JOIN usuarios u ON u.id = e.usuarioId
       WHERE u.id = ?
         AND e.proximidade_autorizada = 1
         AND e.geocoding_status = 'LOCALIZADO'
         AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
       ORDER BY e.id DESC
       LIMIT 1`,
      [userId],
    );

    let origin: GeoOrigin | undefined = cepGeo
      ? { latitude: cepGeo.latitude, longitude: cepGeo.longitude, origem: "CEP" }
      : addressOrigins.find((item) =>
      item.latitude != null && item.longitude != null &&
      this.validCoordinates(Number(item.latitude), Number(item.longitude))
    );

    // Para moradores, mantém a referência coletiva do condomínio quando
    // não há endereço pessoal autorizado. Não se aplica a visitantes externos.
    if (!origin && userId) {
      const condominiumOrigins: GeoOrigin[] = await AppDataSource.query(
        `SELECT c.latitude, c.longitude, 'CONDOMINIO' AS origem
         FROM usuarios u
         INNER JOIN condominios c ON c.id = u.condominio_id
         WHERE u.id = ?
           AND c.geocoding_status = 'LOCALIZADO'
           AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
         LIMIT 1`,
        [userId],
      );
      origin = condominiumOrigins.find((item) =>
        item.latitude != null && item.longitude != null &&
        this.validCoordinates(Number(item.latitude), Number(item.longitude))
      );
    }

    if (!origin) {
      console.info(
        "[DOT GEO] Sem origem autorizada/válida; distância indisponível.",
        { possuiUserId: true },
      );
      return stores.slice(0, 8).map(({ latitude, longitude, ...safe }) => safe);
    }

    const lat = Number(origin.latitude);
    const lon = Number(origin.longitude);
    console.info("[DOT GEO] Origem selecionada", { origem: origin.origem });

    const ranked = stores.map((store) => {
      const destLat = Number(store.latitude);
      const destLon = Number(store.longitude);
      return {
        ...store,
        distanciaKm: store.latitude != null && store.longitude != null &&
          this.validCoordinates(destLat, destLon)
          ? this.distanceKm(lat, lon, destLat, destLon)
          : null,
      };
    });
    console.info("[DOT GEO] Resultado do cálculo de proximidade", {
      total: ranked.length,
      comDistancia: ranked.filter((store) => store.distanciaKm != null).length,
      semCoordenadasPublicas: ranked.filter((store) => store.distanciaKm == null).length,
    });
    ranked.sort((a, b) => {
      const aDistance = a.distanciaKm ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanciaKm ?? Number.POSITIVE_INFINITY;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return a.id.localeCompare(b.id);
    });
    return ranked.slice(0, 8).map(({ latitude, longitude, ...safe }) => safe);
  }

  private validCoordinates(lat: number, lon: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
      !(lat === 0 && lon === 0);
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  /** Revalida a elegibilidade de um negócio já apresentado ao consumidor. */
  async getEligibleDotBusinessBySlug(slug: string): Promise<StoreResult | null> {
    const rows: StoreResult[] = await AppDataSource.query(`
      SELECT s.id, ${this.publicBusinessName} AS name, s.slug, p.id AS prestadorId, ${this.publicBusinessPublication} AS possuiLandingPublicada, s.tipo,
             s.categoria, s.categoria_tag, s.descricao_loja, s.condominio_id,
             s.logo_url, s.capa_url,
             COALESCE(s.latitude, ep.latitude) AS latitude,
             COALESCE(s.longitude, ep.longitude) AS longitude
      FROM stores s ${this.publicBusinessJoins}
      WHERE ${this.publicBusinessEligibility} AND s.slug = ?
      LIMIT 1
    `, [slug]);
    return rows[0] || null;
  }

  async listCampaignBusinesses(
    categoriaId: number,
    condominioId?: string,
  ): Promise<StoreResult[]> {
    return this.findStoresByCampaignCategory(
      categoriaId,
      condominioId,
    );
  }

  resolveCampaignBusinessSelection(
    message: string,
    stores: StoreResult[],
  ): StoreResult | null {
    if (!stores.length) {
      return null;
    }

    const normalized =
      this.normalize(message);

    if (!normalized) {
      return null;
    }

    const numberMatch =
      normalized.match(
        /(?:opcao|numero|n|quero|escolho|escolher)?\s*([1-9]\d*)\b/i,
      );

    if (numberMatch?.[1]) {
      const index =
        Number(numberMatch[1]) - 1;

      if (
        index >= 0 &&
        index < stores.length
      ) {
        return stores[index] ?? null;
      }
    }

    const ordinalMap: Array<{
      termos: string[];
      index: number;
    }> = [
      {
        termos: ["primeira", "primeiro", "opcao 1"],
        index: 0,
      },
      {
        termos: ["segunda", "segundo", "opcao 2"],
        index: 1,
      },
      {
        termos: ["terceira", "terceiro", "opcao 3"],
        index: 2,
      },
      {
        termos: ["quarta", "quarto", "opcao 4"],
        index: 3,
      },
      {
        termos: ["quinta", "quinto", "opcao 5"],
        index: 4,
      },
    ];

    for (const item of ordinalMap) {
      const store =
        stores[item.index];

      if (
        item.termos.some(
          (term) =>
            normalized.includes(
              this.normalize(term),
            ),
        ) &&
        store
      ) {
        return store;
      }
    }

    const exactByName =
      stores.find(
        (store) =>
          normalized ===
          this.normalize(store.name),
      );

    if (exactByName) {
      return exactByName;
    }

    const containedByName =
      stores
        .map((store) => ({
          store,
          normalizedName:
            this.normalize(store.name),
        }))
        .filter(
          (item) =>
            item.normalizedName.length >= 4 &&
            normalized.includes(
              item.normalizedName,
            ),
        )
        .sort(
          (a, b) =>
            b.normalizedName.length -
            a.normalizedName.length,
        )[0]?.store;

    return containedByName || null;
  }

  formatCampaignBusinessOptions(
    stores: StoreResult[],
    categoriaNome?: string | null,
  ): string {
    if (!stores.length) {
      return `Concluí a qualificação, mas não encontrei profissionais ou lojas ativos${
        categoriaNome
          ? ` em ${categoriaNome}`
          : ""
      } neste momento. Posso continuar procurando outra opção para você.`;
    }

    const title =
      categoriaNome
        ? `Encontrei estas opções de ${categoriaNome} no GranConecta:`
        : "Encontrei estas opções no GranConecta:";

    const options =
      stores
        .map(
          (store, index) =>
            `${index + 1}. ${store.name}${
              store.categoria
                ? ` — ${store.categoria}`
                : ""
            }`,
        )
        .join("\n");

    return `${title}\n\n${options}\n\nResponda com o número ou o nome da opção que você quer conhecer.`;
  }

  resolveBusinessChatbotTipo(
    store: StoreResult,
  ): "LOJA" | "PRESTADOR" {
    const tipo =
      this.normalize(
        `${store.tipo || ""} ${store.categoria || ""} ${store.categoria_tag || ""}`,
      );

    return (
      tipo.includes("loja") ||
      tipo.includes("comercio") ||
      tipo.includes("varejo") ||
      tipo.includes("produto")
    )
      ? "LOJA"
      : "PRESTADOR";
  }

  private async buildStoreOwnerContext(
    input: ChatMessageInput,
    legalContext: string,
  ): Promise<string> {
    const store = await this.findStoreByOwnerContext(input);

    if (!store) {
      return `
${legalContext || ""}

Nenhuma loja ou prestador ativo foi encontrado para este chatbot.
      `.trim();
    }

    const tipoEsperado = input.chatbotTipo === "LOJA" ? "loja" : "servico";
    const tipoAtual = this.normalize(
      `${store.tipo || ""} ${store.categoria || ""} ${store.categoria_tag || ""}`,
    );
    const tipoCompativel =
      tipoAtual.includes(tipoEsperado) ||
      (tipoEsperado === "servico" && tipoAtual.includes("servico"));

    return `
${legalContext || ""}

CHATBOT INDIVIDUAL DO GRANCONECTA

Este atendimento pertence exclusivamente a:
Nome: ${store.name}
Tipo: ${store.tipo || input.chatbotTipo}
Categoria: ${store.categoria || "Não informada"}
Tag: ${store.categoria_tag || "Não informada"}
Descrição: ${store.descricao_loja || "Não informada"}
Condomínio ID: ${store.condominio_id || "Não informado"}
Link público: ${this.frontendUrl}/pagina/${store.slug}

Regras para este atendimento:
- Responda somente sobre esta loja ou prestador.
- Não indique concorrentes, outras lojas ou outros prestadores.
- Se o usuário pedir algo fora deste perfil, explique que este chat atende apenas ${store.name}.
- Se faltar informação, oriente o usuário a chamar pelo WhatsApp ou pelo botão de contato da página.
- Nunca invente preço, prazo, agenda, produto ou serviço que não esteja no contexto.
${tipoCompativel ? "" : "- Atenção: o tipo cadastrado não parece bater perfeitamente com o tipo do chatbot; responda com cautela."}
    `.trim();
  }

  private async findStoreByOwnerContext(
    input: ChatMessageInput,
  ): Promise<StoreResult | null> {
    try {
      const rows: StoreResult[] = await AppDataSource.query(
        `
          SELECT
            s.id,
            s.name,
            s.slug,
            s.tipo,
            s.categoria,
            s.categoria_tag,
            s.descricao_loja,
            s.condominio_id,
            s.logo_url,
            s.capa_url,
            s.latitude,
            s.longitude
          FROM stores s
          WHERE
            s.id = ?
            AND s.ativa = 1
          LIMIT 1
        `,
        [input.chatbotOwnerId],
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar loja/prestador do chatbot:", error);
      return null;
    }
  }

  private async buildLegalDocumentsContext(message: string): Promise<string> {
    if (!this.isLegalQuestion(message)) {
      return "";
    }

    try {
      const documentos: DocumentoLegalResult[] = await AppDataSource.query(`
        SELECT id, tipo, titulo, versao, conteudo
        FROM documentos_legais
        WHERE ativo = 1
        ORDER BY tipo ASC, createdAt DESC
      `);

      if (!documentos.length) {
        return "";
      }

      const docsText = documentos
        .map((doc) => {
          return `
DOCUMENTO LEGAL DO GRANCONECTA
Tipo: ${doc.tipo}
Título: ${doc.titulo}
Versão: ${doc.versao}

Conteúdo:
${this.limit(doc.conteudo, 5000)}
          `.trim();
        })
        .join("\n\n---\n\n");

      return `
BASE LEGAL DA PLATAFORMA GRANCONECTA

Use os documentos abaixo para responder perguntas sobre regras da plataforma, responsabilidades, entregas, fretes, pagamentos, reembolsos, cancelamentos, LGPD, prestadores, empreendedores, lojistas, acesso a condomínios e obrigações das partes.

IMPORTANTE:
- Responda com base nesses documentos.
- Explique de forma simples.
- Não invente regra que não esteja no texto.
- Quando a responsabilidade for do prestador, empreendedor ou lojista, deixe isso claro.
- Quando o GranConecta atuar apenas como plataforma de conexão, deixe isso claro.
- Não dê aconselhamento jurídico definitivo.

${docsText}
      `.trim();
    } catch (error) {
      console.error("Erro ao buscar documentos legais:", error);
      return "";
    }
  }

  private isLegalQuestion(message: string): boolean {
    const texto = this.normalize(message);

    const termosLegais = [
      "termo",
      "termos",
      "politica",
      "privacidade",
      "lgpd",
      "responsabilidade",
      "responsavel",
      "regra",
      "regras",
      "contrato",
      "cancelamento",
      "cancelar",
      "assinatura",
      "plano",
      "pagamento",
      "reembolso",
      "devolucao",
      "troca",
      "garantia",
      "frete",
      "entrega",
      "atraso",
      "inadimplencia",
      "bloqueio",
      "bloqueado",
      "prestador",
      "empreendedor",
      "lojista",
      "loja",
      "condominio",
      "portaria",
      "entrada",
      "acesso",
      "obrigacao",
      "obrigacoes",
      "dano",
      "danos",
      "prejuizo",
      "desistir",
      "desistencia",
    ];

    return termosLegais.some((termo) => texto.includes(termo));
  }

  /** Interpretação semântica: IA sugere categorias REAIS e termos curtos; SQL continua soberano. */
  private async interpretDotSearch(message: string): Promise<{ categoryIds: Array<number | string>; terms: string[] } | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || typeof fetch !== "function") return null;
    try {
      const rows: Array<{ id: number | string; name: string }> = await AppDataSource.query(
        "SELECT id, name FROM categories WHERE name IS NOT NULL ORDER BY name LIMIT 350"
      );
      if (!rows.length) return null;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);
      let response: Response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-4o-mini",
            temperature: 0,
            max_tokens: 180,
            messages: [
              { role: "system", content: "Você interpreta buscas de consumidores de um marketplace brasileiro. Identifique a PROFISSÃO ou SEGMENTO implícito na necessidade (ex.: instalar tomadas requer profissional de elétrica). Use apenas IDs de categorias fornecidos. Responda exclusivamente JSON: {\"categoryIds\":[],\"terms\":[]}. categoryIds: até 3 IDs exatos da lista; terms: até 4 substantivos de especialidade ou sinônimos para busca textual, sem palavras genéricas. Não invente categorias. Se não houver relação segura, deixe categoryIds vazio. Nunca responda ao cliente." },
              { role: "user", content: JSON.stringify({ pedido: message.slice(0, 650), categorias: rows.map(r => ({ id: r.id, nome: r.name })) }) },
            ],
          }),
        });
      } finally { clearTimeout(timeout); }
      if (!response.ok) return null;
      const payload: { choices?: Array<{ message?: { content?: string } }> } = await response.json();
      const raw = String(payload.choices?.[0]?.message?.content || "");
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!json) return null;
      const parsed: { categoryIds?: unknown; terms?: unknown } = JSON.parse(json);
      const allowedIds = new Set(rows.map(r => String(r.id)));
      const categoryIds = (Array.isArray(parsed.categoryIds) ? parsed.categoryIds : [])
        .filter((id): id is number | string => (typeof id === "number" || typeof id === "string") && allowedIds.has(String(id)))
        .slice(0, 3);
      const terms = (Array.isArray(parsed.terms) ? parsed.terms : [])
        .filter((term): term is string => typeof term === "string")
        .map(term => this.normalize(term))
        .filter(term => term.length >= 4 && term.length <= 35 && /^[a-z0-9 ]+$/.test(term))
        .slice(0, 4);
      if (!categoryIds.length && !terms.length) return null;
      console.info("[DOT SEMANTICA] Consulta interpretada", { categoryIds, terms });
      return { categoryIds, terms };
    } catch (error) {
      console.warn("[DOT SEMANTICA] Fallback para busca textual", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private async findCategoriesByIds(ids: Array<number | string>): Promise<CategoryResult[]> {
    if (!ids.length) return [];
    const rows: Array<{ id: number | string; name: string }> = await AppDataSource.query(
      `SELECT id, name FROM categories WHERE id IN (${ids.map(() => "?").join(",")})`, ids
    );
    return rows.map(row => ({ ...row, score: 1 }));
  }

  private async findSimilarCategories(
    searchTerms: string[],
  ): Promise<CategoryResult[]> {
    try {
      const categories: Array<{ id: number | string; name: string }> =
        await AppDataSource.query(`
          SELECT id, name
          FROM categories
          WHERE name IS NOT NULL
        `);

      const rankedCategories = categories
        .map((category) => {
          const normalizedCategory = this.normalize(category.name);

          const score = Math.max(
            ...searchTerms.map((term) =>
              this.calculateSimilarity(term, normalizedCategory),
            ),
          );

          return {
            id: category.id,
            name: category.name,
            score,
          };
        })
        .sort((first, second) => second.score - first.score);

      const bestScore = rankedCategories[0]?.score || 0;

      return rankedCategories
        .filter(
          (category) =>
            category.score >= 0.55 &&
            category.score >= bestScore - 0.15,
        )
        .slice(0, 5);
    } catch (error) {
      console.error("Erro ao pesquisar categorias semelhantes:", error);
      return [];
    }
  }

  private async findStoresByCampaignCategory(
    categoriaId: number,
    condominioId?: string,
  ): Promise<StoreResult[]> {
    const parameters: Array<string | number> = [
      categoriaId, categoriaId,
    ];

    const hasCondominium =
      typeof condominioId === "string" &&
      condominioId.trim().length > 0;

    const condominiumOrder =
      hasCondominium
        ? `
          CASE
            WHEN s.condominio_id = ? THEN 0
            ELSE 1
          END,
        `
        : "";

    if (hasCondominium) {
      parameters.push(
        condominioId.trim(),
      );
    }

    try {
      return await AppDataSource.query(
        `
          SELECT
            s.id,
            ${this.publicBusinessName} AS name,
            s.slug,
            p.id AS prestadorId,
            ${this.publicBusinessPublication} AS possuiLandingPublicada,
            s.tipo,
            s.categoria,
            s.categoria_tag,
            s.descricao_loja,
            s.condominio_id,
            s.logo_url,
            s.capa_url,
            COALESCE(s.latitude, ep.latitude) AS latitude,
            COALESCE(s.longitude, ep.longitude) AS longitude,
            p.servicos_oferecidos
          FROM stores s
          ${this.publicBusinessJoins}
          WHERE
            ${this.publicBusinessEligibility}
            AND (s.categoriaid = ? OR (p.id IS NOT NULL AND p.categoriaid = ?))
          ORDER BY
            ${condominiumOrder}
            s.updatedAt DESC
          LIMIT 8
        `,
        parameters,
      );
    } catch (error) {
      console.error(
        "[CHAT KNOWLEDGE] Erro ao buscar negócios da categoria da campanha:",
        {
          categoriaId,
          error,
        },
      );

      return [];
    }
  }

  private async findStores(
    categories: CategoryResult[],
    searchTerms: string[],
    condominioId?: string,
    limit = 8,
  ): Promise<StoreResult[]> {
    const parameters: Array<string | number> = [];
    const conditions: string[] = [];

    if (categories.length) {
      const categoryIdPlaceholders = categories.map(() => "?").join(", ");
      const categoryNamePlaceholders = categories.map(() => "?").join(", ");

      conditions.push(`
        (
          s.categoriaid IN (${categoryIdPlaceholders})
           OR (p.id IS NOT NULL AND p.categoriaid IN (${categoryIdPlaceholders}))
          OR UPPER(TRIM(COALESCE(s.categoria, '')))
             IN (${categoryNamePlaceholders})
        )
      `);

      parameters.push(
        ...categories.map((category) => category.id),
        ...categories.map((category) => category.id),
        ...categories.map((category) => category.name.trim().toUpperCase()),
      );
    }

    // Busca textual complementar, mesmo quando uma categoria é reconhecida.
    // Evita perder profissionais cuja especialidade está apenas na descrição.
    searchTerms.forEach((term) => {
      conditions.push(`
        (
          LOWER(COALESCE(s.name, '')) LIKE ?
          OR LOWER(COALESCE(s.tipo, '')) LIKE ?
          OR LOWER(COALESCE(s.categoria, '')) LIKE ?
          OR LOWER(COALESCE(s.categoria_tag, '')) LIKE ?
          OR LOWER(COALESCE(s.descricao_loja, '')) LIKE ?
           OR (u.tipo = 'PRESTADOR' AND LOWER(COALESCE(p.servicos_oferecidos, '')) LIKE ?)
        )
      `);

      const searchValue = `%${term}%`;

      parameters.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
      );
    });

    if (!conditions.length) {
      return [];
    }

    const hasCondominium =
      typeof condominioId === "string" &&
      condominioId.trim().length > 0;

    const condominiumOrder = hasCondominium
      ? `
        CASE
          WHEN s.condominio_id = ? THEN 0
          ELSE 1
        END,
      `
      : "";

    if (hasCondominium) {
      parameters.push(condominioId.trim());
    }

    try {
      return await AppDataSource.query(
        `
          SELECT
            s.id,
            ${this.publicBusinessName} AS name,
            s.slug,
            p.id AS prestadorId,
            ${this.publicBusinessPublication} AS possuiLandingPublicada,
            s.tipo,
            s.categoria,
            s.categoria_tag,
            s.descricao_loja,
            s.condominio_id,
            COALESCE(s.latitude, ep.latitude) AS latitude,
            COALESCE(s.longitude, ep.longitude) AS longitude,
            s.updatedAt,
            s.logo_url,
            s.capa_url,
            p.servicos_oferecidos
          FROM stores s
          ${this.publicBusinessJoins}
          WHERE
            ${this.publicBusinessEligibility}
            AND (${conditions.join(" OR ")})
          ORDER BY
            ${condominiumOrder}
            s.updatedAt DESC
          LIMIT ${Math.max(1, Math.min(100, Math.floor(limit)))}
        `,
        parameters,
      );
    } catch (error) {
      console.error("Erro ao buscar profissionais pelas categorias:", error);
      return [];
    }
  }

  private isAvailabilitySearch(message: string): boolean {
    const texto = this.normalize(message);

    const wantsAvailable = [
      "disponivel",
      "disponiveis",
      "ativo",
      "ativos",
      "cadastrado",
      "cadastrados",
      "cadastradas",
      "tem",
      "quais",
      "listar",
      "mostrar",
      "mostre",
      "oferecem",
      "oferece",
      "existem",
      "possui",
    ].some((term) => texto.includes(term));

    const wantsStoreOrService = [
      "profissional",
      "profissionais",
      "prestador",
      "prestadores",
      "servico",
      "servicos",
      "loja",
      "lojas",
      "empreendedor",
      "empreendedores",
    ].some((term) => texto.includes(term));

    return wantsAvailable && wantsStoreOrService;
  }

  /** Distingue descoberta geral de busca por especialidade concreta. */
  private hasSpecificServiceNeed(message: string): boolean {
    const text = this.normalize(message);
    return /\b(eletricistas?|eletrecistas?|encanadores?|pedreiros?|diaristas?|pintores?|manicures?|psicopedagogia|limpeza|reforma|tomadas?|fiacao|disjuntores?)\b/.test(text);
  }

  private resolveAvailabilityType(
    message: string,
  ): "LOJA" | "PRESTADOR" | "TODOS" {
    const texto = this.normalize(message);

    const asksStores = /\b(lojas?|empreendedores?)\b/.test(texto);
    const asksProfessionals = /\b(profissionais?|prestadores?|servicos?)\b/.test(texto);
    if (asksStores && asksProfessionals) return "TODOS";

    if (
      texto.includes("loja") ||
      texto.includes("lojas") ||
      texto.includes("empreendedor") ||
      texto.includes("empreendedores")
    ) {
      return "LOJA";
    }

    if (
      texto.includes("prestador") ||
      texto.includes("prestadores") ||
      texto.includes("profissional") ||
      texto.includes("profissionais") ||
      texto.includes("servico") ||
      texto.includes("servicos")
    ) {
      return "PRESTADOR";
    }

    return "TODOS";
  }

  private async findActiveStoresByType(
    tipo: "LOJA" | "PRESTADOR" | "TODOS",
    condominioId?: string,
  ): Promise<StoreResult[]> {
    const parameters: Array<string | number> = [];

    const typeCondition = tipo === "LOJA"
      ? "AND u.tipo = 'EMPREENDEDOR'"
      : tipo === "PRESTADOR"
        ? "AND p.id IS NOT NULL"
        : "";

    const hasCondominium =
      typeof condominioId === "string" &&
      condominioId.trim().length > 0;

    const condominiumOrder = hasCondominium
      ? `
        CASE
          WHEN s.condominio_id = ? THEN 0
          ELSE 1
        END,
      `
      : "";

    if (hasCondominium) {
      parameters.push(condominioId.trim());
    }

    try {
      return await AppDataSource.query(
        `
          SELECT
            s.id,
            ${this.publicBusinessName} AS name,
            s.slug,
            p.id AS prestadorId,
            ${this.publicBusinessPublication} AS possuiLandingPublicada,
            s.tipo,
            s.categoria,
            s.categoria_tag,
            s.descricao_loja,
            s.condominio_id,
            COALESCE(s.latitude, ep.latitude) AS latitude,
            COALESCE(s.longitude, ep.longitude) AS longitude,
            s.updatedAt,
            s.logo_url,
            s.capa_url,
            p.servicos_oferecidos
          FROM stores s
          ${this.publicBusinessJoins}
          WHERE
            ${this.publicBusinessEligibility}
            ${typeCondition}
          ORDER BY
            ${condominiumOrder}
            s.updatedAt DESC
          LIMIT 8
        `,
        parameters,
      );
    } catch (error) {
      console.error("Erro ao buscar lojas/prestadores ativos:", error);
      return [];
    }
  }

  private formatStoresContext(
    stores: StoreResult[],
    legalContext: string,
    title: string,
    emptyMessage: string,
  ): string {
    if (!stores.length) {
      return `
${legalContext || ""}

${emptyMessage}
      `.trim();
    }

    const lines = [legalContext || "", title].filter(Boolean);

    stores.forEach((store, index) => {
      lines.push(
        [
          `${index + 1}. ${store.name}`,
          `Store ID: ${store.id}`,
          store.tipo ? `Tipo: ${store.tipo}` : "",
          store.categoria ? `Categoria: ${store.categoria}` : "",
          store.categoria_tag ? `Tag: ${store.categoria_tag}` : "",
          store.descricao_loja
            ? `Descrição: ${this.limit(store.descricao_loja, 160)}`
            : "",
          Number(store.possuiLandingPublicada) === 1
            ? `Link: ${this.frontendUrl}/pagina/${store.slug}`
            : "Atendimento: solicitação direta pelo GranConecta (sem landing publicada)",
        ]
          .filter(Boolean)
          .join(" | "),
      );
    });

    return lines.join("\n");
  }

  private calculateSimilarity(searchTerm: string, categoryName: string): number {
    const search = this.normalize(searchTerm);
    const category = this.normalize(categoryName);

    if (search === category) return 1;

    // Semelhança por substring/prefixo gera falsos positivos como
    // "antes" -> "Refrigerantes". Aceitar apenas palavras inteiras.
    const categoryWords = category.split(" ").filter(Boolean);
    if (search.length >= 4 && categoryWords.includes(search)) return 0.94;
    if (search.length < 5 || Math.abs(search.length - category.length) > 2) return 0;

    const diceScore = this.diceCoefficient(search, category);

    return diceScore >= 0.82 ? diceScore : 0;
  }

  private commonPrefixLength(first: string, second: string): number {
    let index = 0;

    while (
      index < first.length &&
      index < second.length &&
      first[index] === second[index]
    ) {
      index++;
    }

    return index;
  }

  private diceCoefficient(first: string, second: string): number {
    if (first.length < 2 || second.length < 2) {
      return first === second ? 1 : 0;
    }

    const firstPairs = this.createPairs(first);
    const secondPairs = this.createPairs(second);

    let matches = 0;
    const availablePairs = [...secondPairs];

    firstPairs.forEach((pair) => {
      const index = availablePairs.indexOf(pair);

      if (index >= 0) {
        matches++;
        availablePairs.splice(index, 1);
      }
    });

    const totalPairs = firstPairs.length + secondPairs.length;

    return totalPairs > 0 ? (2 * matches) / totalPairs : 0;
  }

  private createPairs(value: string): string[] {
    const pairs: string[] = [];

    for (let index = 0; index < value.length - 1; index++) {
      pairs.push(value.substring(index, index + 2));
    }

    return pairs;
  }

  private extractSearchTerms(message: string): string[] {
    const ignored = new Set([
      "como", "antes", "contratar", "gostaria", "conhecer", "saber", "experiencia", "atende", "trabalha", "apartamento", "tres", "instalar", "estou", "procurando", "moro", "gran", "reserva", "paulista",
      "onde",
      "qual",
      "quero",
      "preciso",
      "encontrar",
      "buscar",
      "procuro",
      "existe",
      "algum",
      "alguma",
      "cadastrado",
      "cadastrados",
      "cadastrada",
      "cadastradas",
      "profissional",
      "profissionais",
      "prestador",
      "prestadores",
      "servico",
      "servicos",
      "loja",
      "lojas",
      "favor",
      "termo",
      "termos",
      "politica",
      "privacidade",
      "responsabilidade",
      "regra",
      "regras",
      "contrato",
      "boa", "tarde", "noite", "dia", "dot", "ola", "oi", "perto",
      "proximo", "proximos", "proxima", "proximas", "mim", "meu", "minha",
      "mostrar", "mostre", "opcoes", "opcao", "ordem", "distancia",
      "atualizar", "atualize", "busca", "pesquisa", "novamente", "agora",
      "entre", "esses", "essas", "dois", "duas", "sabe", "falar",
      "esta", "estao", "aproximada", "aproximado", "distancias", "quilometros",
      "mais", "quais", "todos", "todas", "dentro", "fora", "condominio",
      "voces", "oferecem", "oferece", "existem", "possui", "temos", "tem",
    ]);

    const normalized = this.normalize(message)
      .replace(/\beletrecista(s)?\b/g, "eletricista$1")
      .replace(/\beletricidade\b/g, "eletrica");
    const terms = Array.from(new Set(normalized.split(/\s+/)
      .filter((term) => term.length >= 4 && !ignored.has(term))));

    // Priorizar a especialidade e o serviço procurados, mesmo quando
    // a mensagem começa com nome, endereço ou outros detalhes pessoais.
    const serviceTerms = new Set([
      "eletricista", "eletricistas", "eletrica", "eletrico", "fiacao",
      "instalacao", "instalacoes", "tomada", "tomadas", "disjuntor",
      "encanador", "encanadores", "pedreiro", "pedreiros", "diarista",
      "diaristas", "pintor", "pintores", "limpeza", "reforma",
    ]);
    const priority = terms.filter((term) => serviceTerms.has(term));
    const remaining = terms.filter((term) => !serviceTerms.has(term));
    return [...priority, ...remaining].slice(0, 8);
  }

  private normalize(value: string): string {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private limit(value: string, maxLength: number): string {
    const normalized = String(value).replace(/\s+/g, " ").trim();

    return normalized.length <= maxLength
      ? normalized
      : `${normalized.slice(0, maxLength - 3).trim()}...`;
  }

  private async findStoreKnowledge(storeId: string): Promise<string> {
    if (!storeId) return "";

    try {
      const rows = await AppDataSource.query(
        `
      SELECT titulo, tipo, conteudo
      FROM store_chatbot_knowledge
      WHERE store_id = ?
      AND ativo = 1
      ORDER BY
        FIELD(tipo, 'SOBRE', 'CARDAPIO', 'PROMOCAO', 'ENTREGA', 'PAGAMENTO', 'NORMA', 'FAQ', 'ATENDIMENTO', 'GERAL'),
        createdAt DESC
      `,
        [storeId],
      );

      if (!rows.length) {
        return "Nenhuma informação adicional cadastrada para esta loja.";
      }

      return rows
        .map((item: any, index: number) => {
          return `
${index + 1}. [${item.tipo}] ${item.titulo}
${item.conteudo}
        `.trim();
        })
        .join("\n\n");
    } catch (error) {
      console.error("Erro ao buscar conhecimento da loja:", error);
      return "";
    }
  }

  private async buildOwnerContext(
    input: ChatMessageInput,
    legalContext: string,
  ): Promise<string> {
    if (
      (input.chatbotTipo !== "LOJA" && input.chatbotTipo !== "PRESTADOR") ||
      !input.chatbotOwnerId
    ) {
      return "";
    }

    try {
      const stores = await AppDataSource.query(
        `
      SELECT
        s.id,
        s.name,
        s.slug,
        s.tipo,
        s.descricao_loja,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(s.layoutConfig, '$.settings.store_whatsapp')),
          JSON_UNQUOTE(JSON_EXTRACT(s.layoutConfig, '$.store_whatsapp')),
        ''
        ) AS telefone_whatsapp,
        s.categoria,
        s.categoria_tag,
        s.categoriaid,
        s.condominio_id,
        c.name AS categoria_nome
      FROM stores s
      LEFT JOIN categories c ON c.id = s.categoriaid
      WHERE s.id = ?
      AND s.ativa = 1
      LIMIT 1
      `,
        [input.chatbotOwnerId],
      );

      const store = stores?.[0];

      if (!store) {
        return `
${legalContext || ""}

Nenhuma loja ou prestador ativo foi encontrado para este atendimento.
      `.trim();
      }

      const products = await AppDataSource.query(
        `
          SELECT
          id,
          name,
          description,
          price,
          stock,
          status
          FROM product
          WHERE store_id = ?
          ORDER BY id DESC
          LIMIT 30
      `,
        [store.id],
      );

      const knowledge = await this.findStoreKnowledge(store.id);

      const productsText = products.length
        ? products
          .map((p: any, index: number) => {
            const price = Number(p.price || 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });

            return `
${index + 1}. Produto ID: ${p.id}
Nome: ${p.name}
Preço: ${price}
Estoque: ${p.stock ?? "não informado"}
Descrição: ${p.description || "sem descrição"}
        `.trim();
          })
          .join("\n\n")
        : "Nenhum produto ou serviço cadastrado foi encontrado para este negócio.";

      return `
${legalContext || ""}

CONTEXTO EXCLUSIVO DO NEGÓCIO ATUAL

Tipo do chatbot: ${input.chatbotTipo}
Nome: ${store.name}
ID do negócio: ${store.id}
Slug: ${store.slug}
Tipo cadastrado: ${store.tipo || "não informado"}
Categoria: ${store.categoria_nome ||
        store.categoria ||
        store.categoria_tag ||
        "não informada"
        }
Descrição: ${store.descricao_loja || "não informada"}
WhatsApp: ${store.telefone_whatsapp || "não informado"}
Condomínio ID: ${store.condominio_id || "não informado"}
Link público: ${this.frontendUrl}/pagina/${store.slug}

PRODUTOS / CARDÁPIO / SERVIÇOS CADASTRADOS
${productsText}

BASE DE CONHECIMENTO CADASTRADA PELO NEGÓCIO
${knowledge}

REGRAS OBRIGATÓRIAS PARA ESTE ATENDIMENTO:
- Responda somente sobre este negócio.
- Não recomende outras lojas, outros prestadores ou produtos externos.
- Use a categoria do negócio para adaptar a resposta.
- Use os produtos, serviços, cardápio, promoções, formas de pagamento, entrega, normas e FAQ cadastrados acima.
- Se o cliente demonstrar interesse em contratar, pedir, comprar, agendar ou fechar negócio, incentive continuar pelo fluxo da plataforma.
- Não invente preço, prazo, estoque, agenda, produto, serviço, entrega ou promoção que não esteja no contexto.
- Se faltar informação, diga que essa informação não está cadastrada e ofereça abrir uma solicitação.
    `.trim();
    } catch (error) {
      console.error("Erro ao montar contexto exclusivo do negócio:", error);
      return "";
    }
  }
}