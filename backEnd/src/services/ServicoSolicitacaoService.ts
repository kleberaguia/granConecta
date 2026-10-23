import { AppDataSource } from "../config/data-source";
import { ServicoSolicitacao } from "../models/servicoSolicitacaoModels";
import { ServicoTipo } from "../models/ServicoTipoModels";
import { Usuario } from "../models/UserModels";
import { DeepPartial } from "typeorm";
import { v4 as uuidv4 } from 'uuid';

// ✅ IMPORTS NECESSÁRIOS
import { ServicoCandidatura } from "../models/servicoCandidatura";
import { ServicoOferta } from "../models/servicoOfertaModels";
import { Pagamento } from "../models/PagamentoModel";
import { Category } from "../models/CategoryModels";
import { PagamentoTransacao } from "../models/PagamentoTransacaoModel";


const solicitacaoRepo = AppDataSource.getRepository(ServicoSolicitacao);
// const tipoRepo = AppDataSource.getRepository(ServicoTipo);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const ofertaRepo = AppDataSource.getRepository(ServicoCandidatura); // 👈 Resolvendo o 'Cannot find name'

const STATUS_SOLICITACAO_DISPONIVEL = ["BUSCANDO_PRESTADOR", "CANDIDATOS"] as const;
const STATUS_OFERTA_ATIVA = ["ACEITA", "EM_ANDAMENTO", "CONCLUIDA", "PAGA"];

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD") // remove acento
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}


async function garantirStore(prestadorId: string) {
  // 1. Verifica se já existe store
  const existing = await AppDataSource.query(
    `SELECT * FROM stores WHERE usuarioId = ? LIMIT 1`,
    [prestadorId]
  );

  if (existing.length > 0) {
    // ✅ UPDATE
    await AppDataSource.query(
      `UPDATE stores 
       SET name = ?, slug = ?
       WHERE usuarioId = ?`,
      [
        "Nome Atualizado",
        "slug-atualizado",
        prestadorId
      ]
    );

    return existing[0];
  }

  // 2. Criar nova store
  const id = uuidv4();
  const name = "Minha Loja";
  const slug = "minha-loja-" + Date.now();

  await AppDataSource.query(
    `INSERT INTO stores (id, usuarioId, name, slug, tipo)
     VALUES (?, ?, ?, ?, 'PRESTADOR')`,
    [id, prestadorId, name, slug]
  );

  return { id, usuarioId: prestadorId, name, slug };
}

export const ServicoSolicitacaoService = {
  /**
   * Morador cria uma solicitação de serviço.
   */
  async criarSolicitacao(data: {
    titulo: string;
    descricao: string;
    categoriaId: string | number;
    usuarioId: string;
    condominio_id?: string;
    valor_sugerido?: number;
    metadata?: any;
    prestadorId?: string; // ID do prestador escolhido
  }): Promise<ServicoSolicitacao> {

    // 1. Criamos o objeto da solicitação
    const dadosNovaSolicitacao: DeepPartial<ServicoSolicitacao> = {
      titulo: data.titulo,
      descricao: data.descricao,
      categoriaId: Number(data.categoriaId),
      usuarioId: data.usuarioId,
      condominio_id: data.condominio_id ?? null,
      valor_sugerido: data.valor_sugerido || 0,
      status: data.prestadorId ? "DIRECIONADO" : "BUSCANDO_PRESTADOR",
      progresso: 0,
      metadata: data.metadata || {},
      prestadorId: (data.prestadorId || null) as any
    };

    const novaSolicitacao = solicitacaoRepo.create(dadosNovaSolicitacao);
    const solicitacaoSalva = await solicitacaoRepo.save(novaSolicitacao);

    // 2. Criar a Oferta Automática se houver prestadorId
    if (data.prestadorId) {
      // Criamos a oferta usando os nomes que o TS sugeriu/confirmou
      const totalSessoesSolicitadas = Math.max(
        1,
        Number(
          data.metadata?.totalSessions ??
          data.metadata?.total_sessoes ??
          data.metadata?.catalogTotalSessions ??
          data.metadata?.catalog_total_sessions ??
          1
        ) || 1
      );

      const novaOferta = ofertaRepo.create({
        // 1. Verifique se aqui é 'solicitacao_id' ou 'solicitacao' (o objeto todo)
        // Se o erro diz que solicitacaoId não existe, tente:
        solicitacao: { id: solicitacaoSalva.id } as any,

        prestadorId: data.prestadorId,

        // 2. O TS avisou: o nome correto parece ser 'valor_proposto'
        valor_proposto: Number(data.valor_sugerido) || 0,

        status: "NEGOCIACAO" as any,
        mensagem: "Solicitação direta vinculada ao perfil do prestador.",

        // Mantém a quantidade comercial do pacote até a criação da ServicoOferta.
        total_sessoes: totalSessoesSolicitadas,
        totalSessoes: totalSessoesSolicitadas,
      } as any);

      await ofertaRepo.save(novaOferta);
    }
    return solicitacaoSalva;
  },

  /**
   * Lista todas as solicitações (Admin).
   */
  async listarTodas(): Promise<ServicoSolicitacao[]> {
    return await solicitacaoRepo.find({
      relations: ["morador", "category"],
      order: { createdAt: "DESC" },
    });
  },

  /**
   * Morador escolhe um prestador vencedor.
   */
  async escolherPrestador(
    solicitacaoId: string,
    usuarioId: string,
    prestadorId: string,
    valor_final: number
  ): Promise<ServicoSolicitacao> {
    const solicitacao = await solicitacaoRepo.findOne({ where: { id: solicitacaoId } });
    if (!solicitacao) throw new Error("SOLICITACAO_NAO_ENCONTRADA");
    if (solicitacao.usuarioId !== usuarioId) throw new Error("SEM_PERMISSAO");

    const prestador = await usuarioRepo.findOne({
      where: { id: prestadorId, tipo: "PRESTADOR" as any },
    });
    if (!prestador) throw new Error("PRESTADOR_NAO_ENCONTRADO");

    solicitacao.prestadorId = prestadorId;
    solicitacao.valor_final = valor_final;
    solicitacao.status = "PRESTADOR_ESCOLHIDO";

    return await solicitacaoRepo.save(solicitacao);
  },

  async atualizarProgresso(id: string, progresso: number) {
    const solicitacao = await solicitacaoRepo.findOneBy({ id } as any);
    if (!solicitacao) throw new Error("SOLICITACAO_NAO_ENCONTRADA");

    solicitacao.progresso = progresso;

    if (progresso > 0 && progresso < 100 && solicitacao.status === "PRESTADOR_ESCOLHIDO") {
      solicitacao.status = "EM_ANDAMENTO";
    }
    if (progresso === 100) {
      solicitacao.status = "CONCLUIDO";
    }

    return await solicitacaoRepo.save(solicitacao);
  },

  async atualizarStatus(id: string, status: string) {
    const solicitacao = await solicitacaoRepo.findOneBy({ id } as any);
    if (!solicitacao) throw new Error("SOLICITACAO_NAO_ENCONTRADA");

    solicitacao.status = status;
    return await solicitacaoRepo.save(solicitacao);
  },

  async listarDisponiveis(prestadorId?: string, tipoId?: string) {
    const query = solicitacaoRepo
      .createQueryBuilder("s")
      .leftJoinAndSelect("s.tipo", "category")
      .leftJoinAndSelect("s.morador", "morador")
      .where("s.status IN (:...status)", { status: [...STATUS_SOLICITACAO_DISPONIVEL] });

    if (tipoId) {
      query.andWhere("s.tipoId = :tipoId", { tipoId });
    }

    if (prestadorId) {
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("si.solicitacaoId")
            .from("servico_ignorado", "si")
            .where("si.prestadorId = :prestadorId")
            .getQuery();
          return "s.id NOT IN " + subQuery;
        })
        .setParameter("prestadorId", prestadorId);
    }

    query.orderBy("s.createdAt", "DESC");

    return await query.getMany();
  },

  async listarPorMorador(usuarioId: string): Promise<ServicoSolicitacao[]> {
    return await solicitacaoRepo.find({
      where: { usuarioId } as any,
      relations: ["tipo", "candidaturas", "candidaturas.prestador"],
      order: { createdAt: "DESC" },
    });
  },

  async buscarPorId(id: string): Promise<ServicoSolicitacao> {
    const solicitacao = await solicitacaoRepo.findOne({
      where: { id } as any,
      relations: ["morador",
        "morador.endereco",           // 👈 Traz os dados da tabela de endereços
        "morador.endereco.condominio",
        "category", "candidaturas", "candidaturas.prestador"],
    });
    if (!solicitacao) throw new Error("SOLICITACAO_NAO_ENCONTRADA");
    return solicitacao;
  },

  async getDashboardDados(prestadorId: string) {
    try {
      // 1. BUSCA O PERFIL UNIFICADO (Usuário + Store + Endereço)
      const perfilResult = await AppDataSource.query(
        `SELECT 
  u.id as usuario_id,
  u.name,
  u.email,
  u.foto_perfil_url,

  -- Mercado Pago
  u.gateway_conta_id,

  CASE
    WHEN u.gateway_conta_id IS NOT NULL
         AND u.gateway_conta_id <> ''
         AND u.mercadoPagoAccessToken IS NOT NULL
         AND u.mercadoPagoAccessToken <> ''
    THEN 1
    ELSE 0
  END AS mercadoPagoConectado,

  s.id as store_id,
  s.slug,
  s.tipo,
  s.categoria_tag,

  e.logradouro,
  e.bairro,
  e.cidade,
  e.uf,
  e.bloco_torre,
  e.unidade_apto,

  c.nome as condominio,
  sc.total_sessoes

FROM usuarios u
LEFT JOIN stores s ON s.usuarioId = u.id
LEFT JOIN enderecos e ON e.usuarioId = u.id
LEFT JOIN condominios c ON e.condominio_id = c.id
LEFT JOIN servico_candidatura sc ON sc.prestadorId = u.id
WHERE u.id = ?
LIMIT 1`,
        [prestadorId]
      );

      let perfil = perfilResult[0];

      if (perfil) {
        perfil.mercadoPagoConectado =
          Number(perfil.mercadoPagoConectado) === 1;
      }

      // 🔥 Se não encontrar store, cria automaticamente
      if (!perfil?.store_id) {
        const novaStore = await garantirStore(prestadorId);
        // Atualiza o objeto perfil para incluir os dados da nova store
        perfil = { ...perfil, store_id: novaStore.id, slug: novaStore.slug };
      }

      // 2. DESCOBRE A CATEGORIA REAL DO PRESTADOR
      // A fonte correta para o matching e perfil_prestador.categoriaid.
      // Nao usamos stores.categoria_tag, pois ela pode estar vazia.
      const perfilPrestadorResult = await AppDataSource.query(
        `SELECT
          pp.categoriaid,
          pp.ativo,
          pp.status,
          pp.status_aprovacao,
          pp.status_assinatura,
          pp.bloqueado_por_assinatura
        FROM perfil_prestador pp
        WHERE pp.usuarioId = ?
        LIMIT 1`,
        [prestadorId]
      );

      const perfilPrestador = perfilPrestadorResult[0];

      if (!perfilPrestador) {
        throw new Error("PERFIL_PRESTADOR_NAO_ENCONTRADO");
      }

      const categoriaId = Number(perfilPrestador.categoriaid);

      if (!categoriaId) {
        throw new Error("PRESTADOR_SEM_CATEGORIA");
      }

      // 3. OPORTUNIDADES - somente da mesma categoria do prestador
      const oportunidades = await AppDataSource.query(
        `SELECT
          s.id,
          s.titulo,
          s.valor_sugerido,
          s.categoriaId,
          u.name as morador_nome,
          u.foto_perfil_url,
          e.logradouro,
          e.bairro,
          e.cidade,
          e.uf,
          c.nome as condominio,
          e.bloco_torre,
          e.unidade_apto
        FROM servico_solicitacao s
        INNER JOIN usuarios u ON s.usuarioId = u.id
        LEFT JOIN enderecos e ON e.usuarioId = u.id
        LEFT JOIN condominios c ON e.condominio_id = c.id
        WHERE s.status IN ('BUSCANDO_PRESTADOR', 'CANDIDATOS')
          AND s.categoriaId = ?
          AND s.id NOT IN (
            SELECT solicitacaoId FROM servico_ignorado WHERE prestadorId = ?
          )
          AND s.id NOT IN (
            SELECT solicitacaoId FROM servico_candidatura WHERE prestadorId = ?
          )
        ORDER BY s.createdAt DESC`,
        [categoriaId, prestadorId, prestadorId]
      );

      // 4. PROPOSTAS
      const propostas = await AppDataSource.query(
        `SELECT
      c.id,
      c.valor_proposto,
      c.status,
      c.solicitacaoId AS solicitacao_id,

      s.titulo AS solicitacao_titulo,
      s.usuarioId AS usuarioId,
      s.valor_sugerido AS valor_original_morador,

      u.name AS morador_nome,

      COALESCE(
        p.foto_perfil_url,
        u.foto_perfil_url
      ) AS morador_foto,

      e.bloco_torre AS morador_bloco,
      e.unidade_apto AS morador_unidade,

      cond.nome AS condominio_nome

   FROM servico_candidatura c

   INNER JOIN servico_solicitacao s
     ON c.solicitacaoId = s.id

   INNER JOIN usuarios u
     ON s.usuarioId = u.id

   LEFT JOIN perfil_prestador p
     ON p.usuarioId = u.id

   LEFT JOIN enderecos e
     ON e.usuarioId = u.id

   LEFT JOIN condominios cond
     ON e.condominio_id = cond.id

   WHERE c.prestadorId = ?

   ORDER BY c.createdAt DESC`,
        [prestadorId]
      );

      return {
        perfil: {
          usuario_id: perfil.usuario_id,
          store_id: perfil.store_id,
          name: perfil.name,
          email: perfil.email,
          slug: perfil.slug,
          tipo: perfil.tipo,
          foto_perfil_url: perfil.foto_perfil_url,
          gateway_conta_id: perfil.gateway_conta_id || null,
          mercadoPagoConectado: Boolean(perfil.mercadoPagoConectado),

          logradouro: perfil.logradouro || "",
          bairro: perfil.bairro || "",
          cidade: perfil.cidade || "",
          condominio: perfil.condominio || "",
          bloco_torre: perfil.bloco_torre || "",
          unidade_apto: perfil.unidade_apto || ""
        },
        oportunidades: oportunidades || [],
        propostas: propostas || [],
      };
    } catch (error: any) {
      console.error("❌ ERRO NO SQL DASHBOARD:", error.message);
      throw error;
    }
  },

  async ListarMinhasSolicitacoesService(usuarioId: string, opts?: { page?: number; pageSize?: number }) {
    try {
      const page = Math.max(1, opts?.page ?? 1);
      const pageSize = Math.min(50, Math.max(1, opts?.pageSize ?? 20));
      const skip = (page - 1) * pageSize;

      // 1) Busca solicitações base
      const solicitacoes = await solicitacaoRepo
        .createQueryBuilder("s")
        .leftJoinAndSelect("s.candidaturas", "c")        // Traz as propostas dos prestadores
        .leftJoinAndSelect("c.prestador", "p")          // Traz os dados do prestador (nome, foto)
        .leftJoinAndSelect("c.negociacoes", "n")         // Traz o histórico da nova tabela
        .where("s.usuarioId = :uId", { uId: usuarioId })
        .orderBy("s.createdAt", "DESC")
        .addOrderBy("n.createdAt", "ASC")                // Ordena as mensagens da mais antiga para a nova
        .getMany();

      if (!solicitacoes || solicitacoes.length === 0) {
        return {
          items: [],
          page,
          pageSize,
          hasNext: false,
          total: 0
        };
      }

      const ids = solicitacoes.map((s) => s.id);

      if (!ids.length) {
        return { items: [], page, pageSize, hasNext: false };
      }

      // Carrega os dados visuais dos prestadores em lote.
      // Evita N+1 e permite devolver ao morador somente os campos seguros
      // necessários para identificar visualmente o profissional.
      const prestadorIds = Array.from(
        new Set(
          solicitacoes.flatMap((sol: any) =>
            (sol.candidaturas || [])
              .map((cand: any) => cand.prestadorId)
              .filter(Boolean)
          )
        )
      ) as string[];

      const perfilVisualByPrestadorId = new Map<string, any>();

      if (prestadorIds.length > 0) {
        const placeholders = prestadorIds.map(() => "?").join(",");

        const perfisVisuais = await AppDataSource.query(
          `SELECT
              u.id AS prestador_id,
              COALESCE(
                pp.foto_perfil_url,
                u.foto_perfil_url
              ) AS foto_perfil_url,
              pp.foto_hero_url AS foto_hero_url,
              st.logo_url AS logo_url,
              st.capa_url AS capa_url
           FROM usuarios u
           LEFT JOIN perfil_prestador pp
             ON pp.usuarioId = u.id
           LEFT JOIN stores st
             ON st.usuarioId = u.id
           WHERE u.id IN (${placeholders})`,
          prestadorIds
        );

        for (const perfil of perfisVisuais) {
          perfilVisualByPrestadorId.set(String(perfil.prestador_id), perfil);
        }
      }

      // 2) Contagem de propostas
      const candRows = await AppDataSource.getRepository(ServicoCandidatura)
        .createQueryBuilder("c")
        .select("c.solicitacaoId", "solicitacaoId")
        .addSelect("COUNT(*)", "total")
        .where("c.solicitacaoId IN (:...ids)", { ids })
        .groupBy("c.solicitacaoId")
        .getRawMany();

      const totalPropostasById = new Map<string, number>();
      candRows.forEach(r => totalPropostasById.set(r.solicitacaoId, Number(r.total)));

      // 3) Busca TODAS as ofertas das solicitações.
      //
      // Importante:
      // uma ServicoOferta recém-criada fica com status PENDENTE.
      // O código anterior filtrava apenas ofertas já ativas/pagas e, por isso,
      // o morador recebia a candidatura ACORDO_FECHADO sem ofertaId.
      const ofertasRepo = await AppDataSource.getRepository(ServicoOferta)
        .createQueryBuilder("o")
        .where("o.solicitacaoId IN (:...ids)", { ids })
        .leftJoinAndSelect("o.prestador", "p")
        .orderBy("o.createdAt", "DESC")
        .getMany();

      const ofertasBySolicId = new Map<string, any[]>();
      for (const o of ofertasRepo) {
        const lista = ofertasBySolicId.get(o.solicitacaoId) || [];
        lista.push(o);
        ofertasBySolicId.set(o.solicitacaoId, lista);
      }

      // Mantemos também o conceito antigo de "oferta ativa" para o fluxo
      // operacional já existente, sem considerar PENDENTE como serviço em execução.
      const ofertaAtivaBySolicId = new Map<string, any>();
      for (const o of ofertasRepo) {
        if (
          STATUS_OFERTA_ATIVA.includes(o.status as any) &&
          !ofertaAtivaBySolicId.has(o.solicitacaoId)
        ) {
          ofertaAtivaBySolicId.set(o.solicitacaoId, o);
        }
      }

      // 4) Busca TODOS os pagamentos ligados às ofertas.
      // Precisamos devolver também PENDENTE, pois é justamente esse pagamento
      // que o morador precisa continuar no checkout.
      const ofertaIds = ofertasRepo.map((o) => o.id);

      const pagamentoByOfertaId = new Map<string, any>();
      const transacoesByPagamentoId = new Map<string, PagamentoTransacao[]>();

      console.log("🔥 TESTE TRANSACOES NOVO SERVICE CARREGADO");

      if (ofertaIds.length > 0) {
        const pagamentos = await AppDataSource.getRepository(Pagamento)
          .createQueryBuilder("pg")
          .where("pg.ofertaId IN (:...ofertaIds)", { ofertaIds })
          .orderBy("pg.createdAt", "DESC")
          .getMany();

        pagamentos.forEach((p) => {
          if (p.ofertaId && !pagamentoByOfertaId.has(p.ofertaId)) {
            pagamentoByOfertaId.set(p.ofertaId, p);
          }
        });

        const pagamentoIds = pagamentos.map((p) => p.id);

        if (pagamentoIds.length > 0) {
          const transacoes = await AppDataSource
            .getRepository(PagamentoTransacao)
            .createQueryBuilder("pt")
            .where("pt.pagamentoId IN (:...pagamentoIds)", {
              pagamentoIds,
            })
            .orderBy("pt.createdAt", "ASC")
            .getMany();

          for (const transacao of transacoes) {
            const lista =
              transacoesByPagamentoId.get(transacao.pagamentoId) || [];

            lista.push(transacao);

            transacoesByPagamentoId.set(
              transacao.pagamentoId,
              lista
            );
          }
        }
      }

      // 5) Montagem final com mapeamento de herança para o Front-end
      const items = solicitacoes.map((sol) => {
        const ofertaAtiva = ofertaAtivaBySolicId.get(sol.id);
        const pagamentoOfertaAtiva = ofertaAtiva
          ? pagamentoByOfertaId.get(ofertaAtiva.id)
          : null;

        const pagamentoAtivoEstaPago = ["PAGO", "APPROVED"].includes(
          String(pagamentoOfertaAtiva?.status || "").toUpperCase()
        );

        let statusReal = sol.status;

        // Só considera o serviço em execução quando o pagamento da oferta ativa
        // estiver efetivamente aprovado/pago.
        if (ofertaAtiva && pagamentoAtivoEstaPago) {
          statusReal = "EM_EXECUCAO";
        }

        // Injeta em cada candidatura a oferta correspondente ao MESMO prestador
        // e o respectivo pagamento. Assim candidaturaId nunca é confundido com ofertaId.
        const ofertasDaSolicitacao = ofertasBySolicId.get(sol.id) || [];

        const candidaturasMapeadas = (sol.candidaturas || []).map((cand) => {
          const ofertaDaCandidatura =
            ofertasDaSolicitacao.find(
              (o: any) => String(o.prestadorId) === String(cand.prestadorId)
            ) || null;

          const pagamentoDaCandidatura = ofertaDaCandidatura
            ? pagamentoByOfertaId.get(ofertaDaCandidatura.id) || null
            : null;

          const pagamentoEstaPago = ["PAGO", "APPROVED"].includes(
            String(pagamentoDaCandidatura?.status || "").toUpperCase()
          );

          const visualPrestador =
            perfilVisualByPrestadorId.get(String(cand.prestadorId)) || {};

          const prestadorSeguro = cand.prestador
            ? {
              id: cand.prestador.id,
              name: cand.prestador.name,
              email: cand.prestador.email,
              tipo: cand.prestador.tipo,
              telefone: cand.prestador.telefone,
              foto_perfil_url: visualPrestador.foto_perfil_url || null,
              foto_hero_url: visualPrestador.foto_hero_url || null,
              logo_url: visualPrestador.logo_url || null,
              capa_url: visualPrestador.capa_url || null,
            }
            : null;

          return {
            ...cand,
            prestador: prestadorSeguro,
            ofertaId: ofertaDaCandidatura?.id || null,
            oferta: ofertaDaCandidatura
              ? {
                id: ofertaDaCandidatura.id,
                status: ofertaDaCandidatura.status,
                valor: ofertaDaCandidatura.valor,
                prestadorId: ofertaDaCandidatura.prestadorId,
              }
              : null,
            status: pagamentoEstaPago ? "PAGO" : cand.status,
            pagamento: pagamentoDaCandidatura
              ? {
                id: pagamentoDaCandidatura.id,
                ofertaId: pagamentoDaCandidatura.ofertaId,
                status: pagamentoDaCandidatura.status,
                valor: Number(pagamentoDaCandidatura.valor || 0),

                link_pagamento:
                  pagamentoDaCandidatura.link_pagamento || null,

                transacoes: (
                  transacoesByPagamentoId.get(
                    pagamentoDaCandidatura.id
                  ) || []
                ).map((transacao) => ({
                  id: transacao.id,
                  tipo: transacao.tipo,
                  meioPagamento: transacao.meioPagamento,
                  origem: transacao.origem,
                  valor: Number(transacao.valor || 0),
                  status: transacao.status,
                  linkPagamento: transacao.linkPagamento || null,
                })),
              }
              : null,
          };
        });

        const visualPrestadorContrato = ofertaAtiva
          ? perfilVisualByPrestadorId.get(String(ofertaAtiva.prestadorId)) || {}
          : {};

        const prestadorContratoSeguro = ofertaAtiva?.prestador
          ? {
            id: ofertaAtiva.prestador.id,
            name: ofertaAtiva.prestador.name,
            email: ofertaAtiva.prestador.email,
            tipo: ofertaAtiva.prestador.tipo,
            telefone: ofertaAtiva.prestador.telefone,
            foto_perfil_url: visualPrestadorContrato.foto_perfil_url || null,
            foto_hero_url: visualPrestadorContrato.foto_hero_url || null,
            logo_url: visualPrestadorContrato.logo_url || null,
            capa_url: visualPrestadorContrato.capa_url || null,
          }
          : null;

        return {
          ...sol,
          statusReal,
          status: statusReal, // Sincroniza a propriedade raiz
          contrato: ofertaAtiva ? {
            id: ofertaAtiva.id,
            prestador: prestadorContratoSeguro,
            valor: ofertaAtiva.valor,
            status: pagamentoAtivoEstaPago ? "PAGO" : ofertaAtiva.status,
            agenda_liberada: pagamentoAtivoEstaPago
          } : null,
          candidaturas: candidaturasMapeadas,
          total_propostas: totalPropostasById.get(sol.id) ?? 0,
        };
      });

      const result = { items, page, pageSize, hasNext: items.length === pageSize };
      console.log(`✅ Sucesso! Retornando ${items.length} solicitações amarradas com a tabela pagamentos.`);
      return result;

    } catch (error: any) {
      console.error("❌ ERRO NO SERVICE ListarMinhasSolicitacoes:", error.message);
      throw error;
    }
  },

  async buscarDetalhesCompletosParaMorador(solicitacaoId: string) {
    try {
      const result = await solicitacaoRepo
        .createQueryBuilder("s")

        // Oferta vinculada à solicitação
        .leftJoin(
          ServicoOferta,
          "o",
          "o.solicitacaoId = s.id"
        )

        // Prestador da oferta
        .leftJoin(
          "usuarios",
          "p",
          "p.id = o.prestadorId"
        )

        // Pagamento vinculado à oferta
        .leftJoin(
          "pagamentos",
          "pg",
          "pg.ofertaId = o.id"
        )

        .select([
          "s.id AS id",
          "s.usuarioId AS usuarioId",
          "s.titulo AS titulo",
          "s.progresso AS progresso",
          "s.metadata AS metadata",
          "s.status AS solicitacao_status",

          // ✅ IMPORTANTE:
          // O front precisa deste ID para localizar
          // a agenda/sessões vinculadas à oferta.
          "o.id AS ofertaId",

          "o.valor AS valor_final",
          "o.status AS oferta_status",

          // Prestador
          "o.prestadorId AS prestadorId",
          "p.name AS prestador_name",

          // Pagamento
          "pg.id AS pagamentoId",
          "pg.status AS pagamento_status",
          "pg.status_liberacao AS status_liberacao",
          "pg.valor_liberado AS valor_liberado",
          "pg.codigo_verificacao AS codigo_verificacao"
        ])

        .where("s.id = :id", {
          id: solicitacaoId
        })

        .getRawOne();

      return result;

    } catch (error: any) {
      console.error(
        "Erro na Query Manual buscarDetalhesCompletosParaMorador:",
        error.message
      );

      throw error;
    }
  }
};


export default ServicoSolicitacaoService;