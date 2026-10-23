import {
  createHash,
  randomBytes,
} from "crypto";

import { AppDataSource } from '../config/data-source';

import {
  MarketingOpportunity,
  MarketingOpportunityStatus,
} from "../models/MarketingOpportunityModel";

import { MarketingOpportunityAnswer } from "../models/MarketingOpportunityAnswerModel";
import { Usuario } from "../models/UserModels";

type OpportunityCreateInput = {
  campanhaId?: number | null;
  playbookId?: number | null;
  categoriaId?: number | null;

  leadId?: string | null;

  sourceConversationId: string;

  userId?: string | null;
  userType?: string | null;
  condominioId?: string | null;

  canalOrigem?: string | null;
};

type OpportunityAnswerInput = {
  opportunityId: string;

  playbookId?: number | null;

  perguntaChave: string;
  pergunta: string;
  resposta: string;

  ordem?: number;
  obrigatoria?: boolean;
};

type OpportunityBusinessInput = {
  opportunityId: string;

  storeId: string;
  storeName: string;
  storeSlug: string;

  chatbotTipo:
    | "LOJA"
    | "PRESTADOR";

  tokenTtlHours?: number;
};

type OpportunityResolveResult = {
  opportunity: MarketingOpportunity;

  answers: MarketingOpportunityAnswer[];

  qualificationContext: string;
};

type IdentifyOpportunityCustomerInput = {
  token: string;
  storeSlug: string;

  nome: string;
  email: string;
  telefone?: string | null;

  /**
   * Quando informado, precisa ser um usuário já autenticado/confiável.
   * Encontrar o mesmo e-mail no banco NÃO autentica ninguém.
   */
  authenticatedUserId?: string | null;
};

export type IdentifyOpportunityCustomerResult =
  | {
      status: "LOGIN_REQUIRED";
      opportunityId: string;
      email: string;
    }
  | {
      status: "REGISTRATION_REQUIRED";
      opportunityId: string;
      customer: {
        nome: string;
        email: string;
        telefone: string | null;
      };
    }
  | {
      status: "IDENTIFIED";
      opportunityId: string;
      userId: string;
      email: string | null;
      nome: string;
      tipo: string;
    };


export class MarketingOpportunityService {
  private get opportunityRepository() {
    return AppDataSource.getRepository(
      MarketingOpportunity,
    );
  }

  private get answerRepository() {
    return AppDataSource.getRepository(
      MarketingOpportunityAnswer,
    );
  }

  private get userRepository() {
    return AppDataSource.getRepository(
      Usuario,
    );
  }

  /**
   * ============================================================
   * HASH DO TOKEN
   * ============================================================
   *
   * O token puro nunca é salvo no banco.
   */
  private hashToken(
    token: string,
  ): string {
    return createHash("sha256")
      .update(token)
      .digest("hex");
  }

  /**
   * ============================================================
   * CRIAR / REUTILIZAR OPORTUNIDADE
   * ============================================================
   *
   * Reutiliza a oportunidade aberta da mesma conversa/campanha.
   *
   * Isso evita criar uma nova oportunidade a cada mensagem do
   * WhatsApp ou Instagram.
   */
  async getOrCreate(
    input: OpportunityCreateInput,
  ): Promise<MarketingOpportunity> {
    const sourceConversationId =
      String(
        input.sourceConversationId ||
        "",
      ).trim();

    if (!sourceConversationId) {
      throw new Error(
        "sourceConversationId é obrigatório para criar a oportunidade.",
      );
    }

    const query =
      this.opportunityRepository
        .createQueryBuilder(
          "opportunity",
        )
        .where(
          "opportunity.source_conversation_id = :sourceConversationId",
          {
            sourceConversationId,
          },
        )
        .andWhere(
          "opportunity.status NOT IN (:...closedStatuses)",
          {
            closedStatuses: [
              MarketingOpportunityStatus.CONVERTIDA,
              MarketingOpportunityStatus.PERDIDA,
              MarketingOpportunityStatus.EXPIRADA,
            ],
          },
        );

    if (input.campanhaId) {
      query.andWhere(
        "opportunity.campanha_id = :campanhaId",
        {
          campanhaId:
            input.campanhaId,
        },
      );
    }

    const existing =
      await query
        .orderBy(
          "opportunity.updatedAt",
          "DESC",
        )
        .getOne();

    if (existing) {
      let changed =
        false;

      if (
        input.campanhaId &&
        existing.campanha_id !==
          input.campanhaId
      ) {
        existing.campanha_id =
          input.campanhaId;
        changed = true;
      }

      if (
        input.playbookId &&
        existing.playbook_id !==
          input.playbookId
      ) {
        existing.playbook_id =
          input.playbookId;
        changed = true;
      }

      if (
        input.categoriaId &&
        existing.categoria_id !==
          input.categoriaId
      ) {
        existing.categoria_id =
          input.categoriaId;
        changed = true;
      }

      if (
        input.leadId &&
        existing.lead_id !==
          input.leadId
      ) {
        existing.lead_id =
          input.leadId;
        changed = true;
      }

      if (
        input.userId &&
        existing.user_id !==
          input.userId
      ) {
        existing.user_id =
          input.userId;
        changed = true;
      }

      if (
        input.userType &&
        existing.user_type !==
          input.userType
      ) {
        existing.user_type =
          input.userType;
        changed = true;
      }

      if (
        input.condominioId &&
        existing.condominio_id !==
          input.condominioId
      ) {
        existing.condominio_id =
          input.condominioId;
        changed = true;
      }

      if (
        input.canalOrigem &&
        existing.canal_origem !==
          input.canalOrigem
      ) {
        existing.canal_origem =
          input.canalOrigem;
        changed = true;
      }

      if (changed) {
        await this.opportunityRepository
          .save(existing);
      }

      return existing;
    }

    const opportunity =
      this.opportunityRepository.create({
        campanha_id:
          input.campanhaId ||
          null,

        playbook_id:
          input.playbookId ||
          null,

        categoria_id:
          input.categoriaId ||
          null,

        lead_id:
          input.leadId ||
          null,

        source_conversation_id:
          sourceConversationId,

        destination_conversation_id:
          null,

        user_id:
          input.userId ||
          null,

        user_type:
          input.userType ||
          null,

        condominio_id:
          input.condominioId ||
          null,

        canal_origem:
          input.canalOrigem ||
          null,

        selected_store_id:
          null,

        selected_store_name:
          null,

        selected_store_slug:
          null,

        selected_chatbot_tipo:
          null,

        status:
          MarketingOpportunityStatus.CRIADA,

        score:
          0,

        resumo_qualificacao:
          null,

        token_hash:
          null,

        token_expires_at:
          null,

        qualificacao_iniciada_em:
          null,

        qualificacao_concluida_em:
          null,

        opcoes_apresentadas_em:
          null,

        negocio_selecionado_em:
          null,

        negocio_acessado_em:
          null,

        negociacao_iniciada_em:
          null,

        convertido_em:
          null,

        perdido_em:
          null,
      });

    const saved =
      await this.opportunityRepository
        .save(opportunity);

    console.log(
      "[MARKETING OPPORTUNITY] Oportunidade criada",
      {
        opportunityId:
          saved.id,
        campanhaId:
          saved.campanha_id,
        categoriaId:
          saved.categoria_id,
        conversationId:
          saved.source_conversation_id,
      },
    );

    return saved;
  }

  async findOpenBySourceConversation(
    sourceConversationId: string,
  ): Promise<MarketingOpportunity | null> {
    const normalizedConversationId =
      String(sourceConversationId || "").trim();

    if (!normalizedConversationId) {
      return null;
    }

    return this.opportunityRepository
      .createQueryBuilder("opportunity")
      .where(
        "opportunity.source_conversation_id = :sourceConversationId",
        {
          sourceConversationId:
            normalizedConversationId,
        },
      )
      .andWhere(
        "opportunity.status NOT IN (:...closedStatuses)",
        {
          closedStatuses: [
            MarketingOpportunityStatus.CONVERTIDA,
            MarketingOpportunityStatus.PERDIDA,
            MarketingOpportunityStatus.EXPIRADA,
          ],
        },
      )
      .orderBy("opportunity.updatedAt", "DESC")
      .getOne();
  }

  /**
   * ============================================================
   * INICIAR QUALIFICAÇÃO
   * ============================================================
   */
  async startQualification(
    opportunityId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    const now =
      new Date();

    opportunity.status =
      MarketingOpportunityStatus.QUALIFICANDO;

    opportunity.qualificacao_iniciada_em =
      opportunity.qualificacao_iniciada_em ||
      now;

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * SALVAR RESPOSTA DO PLAYBOOK
   * ============================================================
   *
   * Uma pergunta/chave só possui uma resposta por oportunidade.
   * Se a pessoa corrigir a resposta, atualizamos.
   */
  async saveAnswer(
    input: OpportunityAnswerInput,
  ): Promise<MarketingOpportunityAnswer> {
    const opportunityId =
      String(
        input.opportunityId ||
        "",
      ).trim();

    const perguntaChave =
      String(
        input.perguntaChave ||
        "",
      ).trim();

    const pergunta =
      String(
        input.pergunta ||
        "",
      ).trim();

    const resposta =
      String(
        input.resposta ||
        "",
      ).trim();

    if (!opportunityId) {
      throw new Error(
        "opportunityId é obrigatório.",
      );
    }

    if (!perguntaChave) {
      throw new Error(
        "perguntaChave é obrigatória.",
      );
    }

    if (!pergunta) {
      throw new Error(
        "pergunta é obrigatória.",
      );
    }

    if (!resposta) {
      throw new Error(
        "resposta é obrigatória.",
      );
    }

    await this.requireOpportunity(
      opportunityId,
    );

    let answer =
      await this.answerRepository
        .findOne({
          where: {
            opportunity_id:
              opportunityId,

            pergunta_chave:
              perguntaChave,
          },
        });

    if (!answer) {
      answer =
        this.answerRepository.create({
          opportunity_id:
            opportunityId,

          playbook_id:
            input.playbookId ||
            null,

          pergunta_chave:
            perguntaChave,

          pergunta,

          resposta,

          ordem:
            Number(
              input.ordem || 0,
            ),

          obrigatoria:
            Boolean(
              input.obrigatoria,
            ),
        });
    } else {
      answer.playbook_id =
        input.playbookId ||
        answer.playbook_id ||
        null;

      answer.pergunta =
        pergunta;

      answer.resposta =
        resposta;

      answer.ordem =
        Number(
          input.ordem ??
          answer.ordem ??
          0,
        );

      answer.obrigatoria =
        Boolean(
          input.obrigatoria ??
          answer.obrigatoria,
        );
    }

    const saved =
      await this.answerRepository
        .save(answer);

    console.log(
      "[MARKETING OPPORTUNITY] Resposta salva",
      {
        opportunityId,
        perguntaChave,
        ordem:
          saved.ordem,
      },
    );

    return saved;
  }

  /**
   * Registra a necessidade expressa no DOT sem marcar a oportunidade
   * como QUALIFICADA. Somente usar com histórico da conversa de origem
   * já autorizado pelo fluxo do chat, nunca com texto arbitrário de URL.
   */
  async registerDotInitialNeed(
    opportunityId: string,
    need: string,
  ): Promise<void> {
    const normalizedNeed = String(need || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    if (!normalizedNeed) return;

    const opportunity = await this.requireOpportunity(opportunityId);
    await this.saveAnswer({
      opportunityId,
      perguntaChave: "dot_necessidade_inicial",
      pergunta: "Qual necessidade o cliente informou ao DOT?",
      resposta: normalizedNeed,
      ordem: 0,
      obrigatoria: false,
    });

    const answers = await this.getAnswers(opportunityId);
    opportunity.resumo_qualificacao = this.buildQualificationSummary(answers);
    // Não alterar status, score nem qualificacao_concluida_em.
    await this.opportunityRepository.save(opportunity);
  }

  /**
   * ============================================================
   * FINALIZAR QUALIFICAÇÃO
   * ============================================================
   */
  async completeQualification(
    opportunityId: string,
  ): Promise<MarketingOpportunity> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    const answers =
      await this.getAnswers(
        opportunityId,
      );

    opportunity.status =
      MarketingOpportunityStatus.QUALIFICADA;

    opportunity.qualificacao_concluida_em =
      new Date();

    opportunity.resumo_qualificacao =
      this.buildQualificationSummary(
        answers,
      );

    opportunity.score =
      this.calculateScore(
        answers,
      );

    return this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * OPÇÕES APRESENTADAS
   * ============================================================
   */
  async markOptionsPresented(
    opportunityId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    opportunity.status =
      MarketingOpportunityStatus.OPCOES_APRESENTADAS;

    opportunity.opcoes_apresentadas_em =
      opportunity.opcoes_apresentadas_em ||
      new Date();

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * NEGÓCIO SELECIONADO + TOKEN
   * ============================================================
   *
   * Retorna o token puro SOMENTE neste momento.
   * No banco fica apenas token_hash.
   */
  async selectBusiness(
    input: OpportunityBusinessInput,
  ): Promise<{
    opportunity: MarketingOpportunity;
    token: string;
  }> {
    const opportunity =
      await this.requireOpportunity(
        input.opportunityId,
      );

    const storeId =
      String(
        input.storeId ||
        "",
      ).trim();

    const storeName =
      String(
        input.storeName ||
        "",
      ).trim();

    const storeSlug =
      String(
        input.storeSlug ||
        "",
      ).trim();

    if (
      !storeId ||
      !storeName ||
      !storeSlug
    ) {
      throw new Error(
        "storeId, storeName e storeSlug são obrigatórios.",
      );
    }

    const ttlHours =
      Math.max(
        1,
        Math.min(
          Number(
            input.tokenTtlHours ||
            24,
          ),
          168,
        ),
      );

    const token =
      randomBytes(32)
        .toString("hex");

    const tokenHash =
      this.hashToken(
        token,
      );

    const expiresAt =
      new Date(
        Date.now() +
        ttlHours *
          60 *
          60 *
          1000,
      );

    opportunity.selected_store_id =
      storeId;

    opportunity.selected_store_name =
      storeName;

    opportunity.selected_store_slug =
      storeSlug;

    opportunity.selected_chatbot_tipo =
      input.chatbotTipo;

    opportunity.status =
      MarketingOpportunityStatus.NEGOCIO_SELECIONADO;

    opportunity.negocio_selecionado_em =
      new Date();

    opportunity.token_hash =
      tokenHash;

    opportunity.token_expires_at =
      expiresAt;

    const saved =
      await this.opportunityRepository
        .save(opportunity);

    console.log(
      "[MARKETING OPPORTUNITY] Negócio selecionado",
      {
        opportunityId:
          saved.id,
        storeId,
        storeSlug,
        chatbotTipo:
          input.chatbotTipo,
        tokenExpiresAt:
          expiresAt,
      },
    );

    return {
      opportunity:
        saved,

      token,
    };
  }

  async issueAccessToken(
    opportunityId: string,
    tokenTtlHours = 24,
  ): Promise<string> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    if (
      !opportunity.selected_store_id ||
      !opportunity.selected_store_slug
    ) {
      throw new Error(
        "OPORTUNIDADE_SEM_NEGOCIO_SELECIONADO",
      );
    }

    const ttlHours = Math.max(
      1,
      Math.min(Number(tokenTtlHours || 24), 168),
    );
    const token = randomBytes(32).toString("hex");

    opportunity.token_hash = this.hashToken(token);
    opportunity.token_expires_at = new Date(
      Date.now() + ttlHours * 60 * 60 * 1000,
    );

    await this.opportunityRepository.save(
      opportunity,
    );

    return token;
  }

  /**
   * ============================================================
   * IDENTIFICAR CLIENTE DA OPORTUNIDADE
   * ============================================================
   *
   * Regras:
   * - token + slug validam a oportunidade;
   * - encontrar e-mail existente NÃO autentica ninguém;
   * - conta existente sem sessão autenticada => LOGIN_REQUIRED;
   * - conta inexistente => REGISTRATION_REQUIRED;
   * - só vinculamos opportunity.user_id com authenticatedUserId confiável.
   */
  async identifyCustomer(
    input: IdentifyOpportunityCustomerInput,
  ): Promise<IdentifyOpportunityCustomerResult> {
    const token = String(input.token || "").trim();
    const storeSlug = String(input.storeSlug || "").trim();

    const nome = String(input.nome || "")
      .trim()
      .replace(/\s+/g, " ");

    const email = this.normalizeEmail(input.email);
    const telefone = this.normalizePhone(input.telefone);

    const authenticatedUserId = String(
      input.authenticatedUserId || "",
    ).trim();

    if (!token) {
      throw new Error("Token da oportunidade não informado.");
    }

    if (!storeSlug) {
      throw new Error("Slug do negócio não informado.");
    }

    if (!nome) {
      throw new Error("Nome do cliente é obrigatório.");
    }

    if (!email) {
      throw new Error("E-mail do cliente é obrigatório.");
    }

    if (!this.isValidEmail(email)) {
      throw new Error("E-mail do cliente inválido.");
    }

    const resolved = await this.resolveByToken(
      token,
      storeSlug,
    );

    const opportunity = resolved.opportunity;

    /**
     * Sessão autenticada: agora sim podemos vincular user_id.
     */
    if (authenticatedUserId) {
      const authenticatedUser =
        await this.userRepository.findOne({
          where: {
            id: authenticatedUserId,
          },
        });

      if (!authenticatedUser) {
        throw new Error(
          "Usuário autenticado não encontrado.",
        );
      }

      const authenticatedEmail =
        this.normalizeEmail(
          authenticatedUser.email,
        );

      if (
        authenticatedEmail &&
        authenticatedEmail !== email
      ) {
        throw new Error(
          "O e-mail informado não corresponde ao usuário autenticado.",
        );
      }

      opportunity.user_id =
        authenticatedUser.id;

      opportunity.user_type =
        String(
          authenticatedUser.tipo || "",
        ).trim() || null;

      await this.opportunityRepository.save(
        opportunity,
      );

      console.log(
        "[MARKETING OPPORTUNITY] Cliente autenticado vinculado",
        {
          opportunityId: opportunity.id,
          userId: authenticatedUser.id,
          email: authenticatedEmail || null,
          userType:
            authenticatedUser.tipo || null,
        },
      );

      return {
        status: "IDENTIFIED",
        opportunityId: opportunity.id,
        userId: authenticatedUser.id,
        email:
          authenticatedUser.email || null,
        nome: authenticatedUser.name,
        tipo: String(
          authenticatedUser.tipo || "",
        ),
      };
    }

    /**
     * Procura conta existente por e-mail normalizado.
     */
    const existingUsers =
      await this.userRepository
        .createQueryBuilder("usuario")
        .where(
          "LOWER(TRIM(usuario.email)) = :email",
          {
            email,
          },
        )
        .orderBy(
          "usuario.createdAt",
          "ASC",
        )
        .getMany();

    if (existingUsers.length > 1) {
      console.warn(
        "[MARKETING OPPORTUNITY] Mais de um usuário encontrado para o mesmo e-mail",
        {
          opportunityId: opportunity.id,
          email,
          quantidade:
            existingUsers.length,
        },
      );
    }

    const existingUser =
      existingUsers[0] ?? null;

    if (existingUser) {
      console.log(
        "[MARKETING OPPORTUNITY] Conta existente requer login",
        {
          opportunityId: opportunity.id,
          email,
        },
      );

      return {
        status: "LOGIN_REQUIRED",
        opportunityId: opportunity.id,
        email,
      };
    }

    console.log(
      "[MARKETING OPPORTUNITY] Cliente precisa de cadastro rápido",
      {
        opportunityId: opportunity.id,
        email,
        telefone:
          telefone ? "PRESENTE" : null,
      },
    );

    return {
      status: "REGISTRATION_REQUIRED",
      opportunityId: opportunity.id,
      customer: {
        nome,
        email,
        telefone,
      },
    };
  }

  private normalizeEmail(
    value?: string | null,
  ): string {
    return String(
      value || "",
    )
      .trim()
      .toLowerCase();
  }

  private normalizePhone(
    value?: string | null,
  ): string | null {
    const digits =
      String(
        value || "",
      )
        .replace(/\D/g, "")
        .trim();

    return digits || null;
  }

  private isValidEmail(
    value: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(value);
  }

  /**
   * ============================================================
   * RESOLVER OPORTUNIDADE PELO TOKEN
   * ============================================================
   *
   * É o método que a landing/page viewer utilizará.
   */
  async resolveByToken(
    token: string,
    expectedStoreSlug?: string,
  ): Promise<OpportunityResolveResult> {
    const normalizedToken =
      String(
        token || "",
      ).trim();

    if (!normalizedToken) {
      throw new Error(
        "Token da oportunidade não informado.",
      );
    }

    const tokenHash =
      this.hashToken(
        normalizedToken,
      );

    const opportunity =
      await this.opportunityRepository
        .findOne({
          where: {
            token_hash:
              tokenHash,
          },
        });

    if (!opportunity) {
      throw new Error(
        "Oportunidade não encontrada ou token inválido.",
      );
    }

    if (
      opportunity.token_expires_at &&
      opportunity.token_expires_at.getTime() <
        Date.now()
    ) {
      opportunity.status =
        MarketingOpportunityStatus.EXPIRADA;

      await this.opportunityRepository
        .save(opportunity);

      throw new Error(
        "O link desta oportunidade expirou.",
      );
    }

    const normalizedExpectedSlug =
      String(
        expectedStoreSlug ||
        "",
      ).trim();

    if (
      normalizedExpectedSlug &&
      opportunity.selected_store_slug !==
        normalizedExpectedSlug
    ) {
      throw new Error(
        "Esta oportunidade não pertence ao negócio informado.",
      );
    }

    const answers =
      await this.getAnswers(
        opportunity.id,
      );

    return {
      opportunity,

      answers,

      qualificationContext:
        this.buildQualificationContext(
          opportunity,
          answers,
        ),
    };
  }

  /**
   * ============================================================
   * NEGÓCIO ACESSADO
   * ============================================================
   */
  async markBusinessAccessed(
    opportunityId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    opportunity.negocio_acessado_em =
      opportunity.negocio_acessado_em ||
      new Date();

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * VINCULAR CONVERSA DO NEGÓCIO
   * ============================================================
   */
  async attachDestinationConversation(
    opportunityId: string,
    destinationConversationId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    const normalizedConversationId =
      String(
        destinationConversationId ||
        "",
      ).trim();

    if (!normalizedConversationId) {
      return;
    }

    opportunity.destination_conversation_id =
      normalizedConversationId;

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * INICIAR NEGOCIAÇÃO
   * ============================================================
   */
  async startNegotiation(
    opportunityId: string,
    destinationConversationId?: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    opportunity.status =
      MarketingOpportunityStatus.NEGOCIANDO;

    opportunity.negociacao_iniciada_em =
      opportunity.negociacao_iniciada_em ||
      new Date();

    if (
      destinationConversationId
    ) {
      opportunity.destination_conversation_id =
        destinationConversationId;
    }

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * CONVERTER
   * ============================================================
   */
  async convert(
    opportunityId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    opportunity.status =
      MarketingOpportunityStatus.CONVERTIDA;

    opportunity.convertido_em =
      new Date();

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * PERDER OPORTUNIDADE
   * ============================================================
   */
  async lose(
    opportunityId: string,
  ): Promise<void> {
    const opportunity =
      await this.requireOpportunity(
        opportunityId,
      );

    opportunity.status =
      MarketingOpportunityStatus.PERDIDA;

    opportunity.perdido_em =
      new Date();

    await this.opportunityRepository
      .save(opportunity);
  }

  /**
   * ============================================================
   * BUSCAR RESPOSTAS
   * ============================================================
   */
  async getAnswers(
    opportunityId: string,
  ): Promise<MarketingOpportunityAnswer[]> {
    return this.answerRepository.find({
      where: {
        opportunity_id:
          opportunityId,
      },

      order: {
        ordem:
          "ASC",

        id:
          "ASC",
      },
    });
  }

  /**
   * ============================================================
   * BUSCAR OPORTUNIDADE
   * ============================================================
   */
  async findById(
    opportunityId: string,
  ): Promise<MarketingOpportunity | null> {
    if (!opportunityId) {
      return null;
    }

    return this.opportunityRepository
      .findOne({
        where: {
          id:
            opportunityId,
        },
      });
  }

  /**
   * ============================================================
   * CONTEXTO PARA O CHATBOT DA EMPRESA
   * ============================================================
   *
   * O bot do negócio recebe isto no prompt.
   */
  buildQualificationContext(
    opportunity: MarketingOpportunity,
    answers: MarketingOpportunityAnswer[],
  ): string {
    const answerText =
      answers.length > 0
        ? answers
            .map(
              (
                answer,
                index,
              ) =>
                `${index + 1}. ${answer.pergunta}\nResposta do cliente: ${answer.resposta}`,
            )
            .join("\n\n")
        : "Nenhuma resposta estruturada foi registrada.";

    return `
CONTEXTO COMERCIAL RECEBIDO DO GRANCONECTA

Esta pessoa veio do GranConecta. Algumas informações iniciais podem ter sido coletadas, mas a qualificação pode estar incompleta.
Não repita perguntas que já tenham resposta abaixo.

Oportunidade ID: ${opportunity.id}
Campanha ID: ${opportunity.campanha_id || "não informada"}
Categoria ID: ${opportunity.categoria_id || "não informada"}
Canal de origem: ${opportunity.canal_origem || "não informado"}

Negócio escolhido:
Nome: ${opportunity.selected_store_name || "não informado"}
Slug: ${opportunity.selected_store_slug || "não informado"}

Resumo da qualificação:
${opportunity.resumo_qualificacao || "Resumo ainda não gerado."}

Perguntas e respostas já coletadas:
${answerText}

REGRAS:
- continue o atendimento de onde o GranConecta parou;
- não faça novamente perguntas que já estejam respondidas;
- se precisar confirmar algum dado, faça isso de forma natural;
- use o contexto do negócio atual para conduzir a pessoa para produto, serviço, orçamento, agenda, negociação ou atendimento humano;
- não invente preço, estoque, agenda, prazo ou serviço;
- preserve as informações fornecidas pelo cliente durante toda a negociação.
    `.trim();
  }

  /**
   * ============================================================
   * RESUMO DA QUALIFICAÇÃO
   * ============================================================
   */
  private buildQualificationSummary(
    answers: MarketingOpportunityAnswer[],
  ): string {
    if (!answers.length) {
      return "";
    }

    return answers
      .map(
        (answer) =>
          `${answer.pergunta_chave}: ${answer.resposta}`,
      )
      .join(" | ");
  }

  /**
   * ============================================================
   * SCORE
   * ============================================================
   *
   * Inicialmente simples e determinístico.
   * Depois podemos evoluir por playbook/categoria.
   */
  private calculateScore(
    answers: MarketingOpportunityAnswer[],
  ): number {
    if (!answers.length) {
      return 0;
    }

    const answered =
      answers.filter(
        (answer) =>
          String(
            answer.resposta ||
            "",
          ).trim().length > 0,
      ).length;

    const required =
      answers.filter(
        (answer) =>
          Boolean(
            answer.obrigatoria,
          ),
      );

    const requiredAnswered =
      required.filter(
        (answer) =>
          String(
            answer.resposta ||
            "",
          ).trim().length > 0,
      ).length;

    const generalScore =
      Math.round(
        (
          answered /
          Math.max(
            1,
            answers.length,
          )
        ) *
        70,
      );

    const requiredScore =
      required.length > 0
        ? Math.round(
            (
              requiredAnswered /
              required.length
            ) *
            30,
          )
        : 30;

    return Math.min(
      100,
      generalScore +
        requiredScore,
    );
  }

  /**
   * ============================================================
   * REQUIRE
   * ============================================================
   */
  private async requireOpportunity(
    opportunityId: string,
  ): Promise<MarketingOpportunity> {
    const normalizedId =
      String(
        opportunityId ||
        "",
      ).trim();

    if (!normalizedId) {
      throw new Error(
        "ID da oportunidade não informado.",
      );
    }

    const opportunity =
      await this.opportunityRepository
        .findOne({
          where: {
            id:
              normalizedId,
          },
        });

    if (!opportunity) {
      throw new Error(
        "Oportunidade não encontrada.",
      );
    }

    return opportunity;
  }
}

export default MarketingOpportunityService;