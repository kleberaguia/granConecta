"use strict";
// src/services/ServicoSolicitacaoService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicoSolicitacaoService = void 0;
const data_source_1 = require("../config/data-source");
const servicoSolicitacaoModels_1 = require("../models/servicoSolicitacaoModels");
const ServicoTipoModels_1 = require("../models/ServicoTipoModels");
const UserModels_1 = require("../models/UserModels");
const uuid_1 = require("uuid");
// ✅ IMPORTS NECESSÁRIOS
const servicoCandidatura_1 = require("../models/servicoCandidatura");
const servicoOfertaModels_1 = require("../models/servicoOfertaModels");
const PagamentoModel_1 = require("../models/PagamentoModel");
const solicitacaoRepo = data_source_1.AppDataSource.getRepository(servicoSolicitacaoModels_1.ServicoSolicitacao);
const tipoRepo = data_source_1.AppDataSource.getRepository(ServicoTipoModels_1.ServicoTipo);
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
const STATUS_SOLICITACAO_DISPONIVEL = ["BUSCANDO_PRESTADOR", "CANDIDATOS"];
const STATUS_OFERTA_ATIVA = ["ACEITA", "EM_ANDAMENTO", "CONCLUIDA", "PAGA"];
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize("NFD") // remove acento
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}
async function garantirStore(prestadorId) {
    // 1. Verifica se já existe store
    const existing = await data_source_1.AppDataSource.query(`SELECT * FROM stores WHERE usuarioId = ? LIMIT 1`, [prestadorId]);
    if (existing.length > 0) {
        // ✅ UPDATE
        await data_source_1.AppDataSource.query(`UPDATE stores 
       SET name = ?, slug = ?
       WHERE usuarioId = ?`, [
            "Nome Atualizado",
            "slug-atualizado",
            prestadorId
        ]);
        return existing[0];
    }
    // 2. Criar nova store
    const id = (0, uuid_1.v4)();
    const name = "Minha Loja";
    const slug = "minha-loja-" + Date.now();
    await data_source_1.AppDataSource.query(`INSERT INTO stores (id, usuarioId, name, slug, tipo)
     VALUES (?, ?, ?, ?, 'PRESTADOR')`, [id, prestadorId, name, slug]);
    return { id, usuarioId: prestadorId, name, slug };
}
exports.ServicoSolicitacaoService = {
    /**
     * Morador cria uma solicitação de serviço.
     */
    async criarSolicitacao(data) {
        // Criamos o objeto explicitando o que ele é
        const dadosNovaSolicitacao = {
            titulo: data.titulo,
            descricao: data.descricao,
            categoriaId: Number(data.categoriaId),
            usuarioId: data.usuarioId,
            // Usamos null para campos opcionais no banco
            condominio_id: data.condominio_id ?? null,
            valor_sugerido: data.valor_sugerido || 0,
            status: "BUSCANDO_PRESTADOR",
            progresso: 0,
            metadata: data.metadata || {}
        };
        console.log('dadosNovaSolicitacaoooooooooooooooooooooooooo ', dadosNovaSolicitacao);
        // Agora o .create() saberá exatamente qual overload usar
        const novaSolicitacao = solicitacaoRepo.create(dadosNovaSolicitacao);
        return await solicitacaoRepo.save(novaSolicitacao);
    },
    /**
     * Lista todas as solicitações (Admin).
     */
    async listarTodas() {
        return await solicitacaoRepo.find({
            relations: ["morador", "tipo"],
            order: { createdAt: "DESC" },
        });
    },
    /**
     * Morador escolhe um prestador vencedor.
     */
    async escolherPrestador(solicitacaoId, usuarioId, prestadorId, valor_final) {
        const solicitacao = await solicitacaoRepo.findOne({ where: { id: solicitacaoId } });
        if (!solicitacao)
            throw new Error("SOLICITACAO_NAO_ENCONTRADA");
        if (solicitacao.usuarioId !== usuarioId)
            throw new Error("SEM_PERMISSAO");
        const prestador = await usuarioRepo.findOne({
            where: { id: prestadorId, tipo: "PRESTADOR" },
        });
        if (!prestador)
            throw new Error("PRESTADOR_NAO_ENCONTRADO");
        solicitacao.prestadorId = prestadorId;
        solicitacao.valor_final = valor_final;
        solicitacao.status = "PRESTADOR_ESCOLHIDO";
        return await solicitacaoRepo.save(solicitacao);
    },
    async atualizarProgresso(id, progresso) {
        const solicitacao = await solicitacaoRepo.findOneBy({ id });
        if (!solicitacao)
            throw new Error("SOLICITACAO_NAO_ENCONTRADA");
        solicitacao.progresso = progresso;
        if (progresso > 0 && progresso < 100 && solicitacao.status === "PRESTADOR_ESCOLHIDO") {
            solicitacao.status = "EM_ANDAMENTO";
        }
        if (progresso === 100) {
            solicitacao.status = "CONCLUIDO";
        }
        return await solicitacaoRepo.save(solicitacao);
    },
    async atualizarStatus(id, status) {
        const solicitacao = await solicitacaoRepo.findOneBy({ id });
        if (!solicitacao)
            throw new Error("SOLICITACAO_NAO_ENCONTRADA");
        solicitacao.status = status;
        return await solicitacaoRepo.save(solicitacao);
    },
    async listarDisponiveis(prestadorId, tipoId) {
        const query = solicitacaoRepo
            .createQueryBuilder("s")
            .leftJoinAndSelect("s.tipo", "tipo")
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
    async listarPorMorador(usuarioId) {
        return await solicitacaoRepo.find({
            where: { usuarioId },
            relations: ["tipo", "candidaturas", "candidaturas.prestador"],
            order: { createdAt: "DESC" },
        });
    },
    async buscarPorId(id) {
        const solicitacao = await solicitacaoRepo.findOne({
            where: { id },
            relations: ["morador", "tipo", "candidaturas", "candidaturas.prestador"],
        });
        if (!solicitacao)
            throw new Error("SOLICITACAO_NAO_ENCONTRADA");
        return solicitacao;
    },
    async getDashboardDados(prestadorId) {
        try {
            // 1. BUSCA O PERFIL UNIFICADO (Usuário + Store)
            // Aqui pegamos o s.id (ID da Loja) que é o que o seu front precisa!
            const perfilResult = await data_source_1.AppDataSource.query(`SELECT 
          u.id as usuario_id,
          u.name, 
          u.email, 
          s.id as store_id, 
          s.slug, 
          s.tipo,
          s.categoria_tag,
          u.foto_perfil_url as foto_perfil_url
        FROM usuarios u
        LEFT JOIN stores s ON s.usuarioId = u.id
        WHERE u.id = ? LIMIT 1`, [prestadorId]);
            // Se não encontrar store, o id virá null, mas o objeto perfil existirá
            const perfil = perfilResult[0];
            // 2. OPORTUNIDADES (Mantido, mas certifique-se dos nomes das tabelas)
            const oportunidades = await data_source_1.AppDataSource.query(`SELECT s.id, s.titulo, s.valor_sugerido, u.name as morador_nome, u.foto_perfil_url,
        e.logradouro, e.bairro,e.cidade, e.uf, c.nome as condominio, e.bloco_torre, e.unidade_apto
       FROM servico_solicitacao s
       INNER JOIN usuarios u ON s.usuarioId = u.id
       left JOIN enderecos e ON e.usuarioId = u.id
       left JOIN condominios c ON e.condominio_id = c.id
       WHERE s.status IN ('BUSCANDO_PRESTADOR', 'CANDIDATOS')
         AND s.id NOT IN (SELECT solicitacaoId FROM servico_ignorado WHERE prestadorId = ?)
         AND s.id NOT IN (SELECT solicitacaoId FROM servico_candidatura WHERE prestadorId = ?)`, [prestadorId, prestadorId]);
            console.log('oportunidades ', oportunidades);
            // 3. PROPOSTAS (Mantido)
            const propostas = await data_source_1.AppDataSource.query(`SELECT c.id, c.valor_proposto, c.status, c.solicitacaoId AS solicitacao_id,
              s.titulo as solicitacao_titulo, s.usuarioId, s.valor_sugerido as valor_original_morador
       FROM servico_candidatura c
       INNER JOIN servico_solicitacao s ON c.solicitacaoId = s.id
       WHERE c.prestadorId = ?`, [prestadorId]);
            // 🔥 Se não existir store, cria automaticamente
            if (!perfil?.store_id) {
                const dbName = await data_source_1.AppDataSource.query(`SELECT DATABASE() as db`);
                console.log("BANCO ATUAL:", dbName);
                const novaStore = await garantirStore(prestadorId);
                perfil.store_id = novaStore.id;
                perfil.slug = novaStore.slug;
            }
            return {
                // Retornamos o perfil com o ID da loja agora incluso
                perfil: {
                    usuario_id: perfil.usuario_id,
                    store_id: perfil.store_id,
                    name: perfil.name,
                    email: perfil.email,
                    slug: perfil.slug,
                    tipo: perfil.tipo,
                    foto_perfil_url: perfil.foto_perfil_url,
                    logradouro: perfil.logradouro,
                    bairro: perfil.bairro,
                    cidade: perfil.cidade,
                    condominio: perfil.condominio,
                    bloco_torre: perfil.bloco_torre,
                    unidade_apto: perfil.unidade_apto
                },
                oportunidades: oportunidades || [],
                propostas: propostas || [],
            };
        }
        catch (error) {
            console.error("❌ ERRO NO SQL DASHBOARD:", error.message);
            throw error;
        }
    },
    async ListarMinhasSolicitacoesService(usuarioId, opts) {
        try {
            const page = Math.max(1, opts?.page ?? 1);
            const pageSize = Math.min(50, Math.max(1, opts?.pageSize ?? 20));
            const skip = (page - 1) * pageSize;
            // 1) Busca solicitações base
            const solicitacoes = await solicitacaoRepo
                .createQueryBuilder("s")
                .where("s.usuarioId = :uId", { uId: String(usuarioId).trim() }) // Garante que é string e sem espaços
                .printSql()
                .getMany(); // Remova o .select() temporariamente para testar se ele traz tudo
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
            // 2) Contagem de propostas
            const candRows = await data_source_1.AppDataSource.getRepository(servicoCandidatura_1.ServicoCandidatura)
                .createQueryBuilder("c")
                .select("c.solicitacaoId", "solicitacaoId")
                .addSelect("COUNT(*)", "total")
                .where("c.solicitacaoId IN (:...ids)", { ids })
                .groupBy("c.solicitacaoId")
                .getRawMany();
            const totalPropostasById = new Map();
            candRows.forEach(r => totalPropostasById.set(r.solicitacaoId, Number(r.total)));
            // 3) Busca Ofertas Ativas
            const ofertasAtivasRepo = await data_source_1.AppDataSource.getRepository(servicoOfertaModels_1.ServicoOferta)
                .createQueryBuilder("o")
                .where("o.solicitacaoId IN (:...ids)", { ids })
                .andWhere("o.status IN (:...st)", { st: STATUS_OFERTA_ATIVA })
                .leftJoinAndSelect("o.prestador", "p")
                .getMany();
            const ofertaAtivaBySolicId = new Map();
            for (const o of ofertasAtivasRepo) {
                if (!ofertaAtivaBySolicId.has(o.solicitacaoId)) {
                    ofertaAtivaBySolicId.set(o.solicitacaoId, o);
                }
            }
            // 4) Busca Pagamentos
            const ofertaIds = Array.from(ofertaAtivaBySolicId.values()).map(o => o.id);
            const pagosByOfertaId = new Set();
            if (ofertaIds.length > 0) {
                const pagos = await data_source_1.AppDataSource.getRepository(PagamentoModel_1.Pagamento)
                    .createQueryBuilder("pg")
                    .where("pg.ofertaId IN (:...ofertaIds)", { ofertaIds })
                    .andWhere("pg.status = :st", { st: "PAGO" })
                    .getMany();
                pagos.forEach(p => pagosByOfertaId.add(p.ofertaId));
            }
            // 5) Montagem final
            const items = solicitacoes.map((sol) => {
                const ofertaAtiva = ofertaAtivaBySolicId.get(sol.id);
                let statusReal = sol.status;
                if (ofertaAtiva) {
                    statusReal = ofertaAtiva.status === "CONCLUIDA" ? "AGUARDANDO_PAGAMENTO" : ofertaAtiva.status;
                    if (pagosByOfertaId.has(ofertaAtiva.id)) {
                        statusReal = "FINALIZADO_E_PAGO";
                    }
                }
                return {
                    ...sol,
                    statusReal,
                    contrato: ofertaAtiva ? {
                        id: ofertaAtiva.id,
                        prestador: ofertaAtiva.prestador,
                        valor: ofertaAtiva.valor,
                        status: ofertaAtiva.status,
                    } : null,
                    total_propostas: totalPropostasById.get(sol.id) ?? 0,
                };
            });
            //  return { items, page, pageSize, hasNext: items.length === pageSize };
            const result = { items, page, pageSize, hasNext: items.length === pageSize };
            // LOG DE SUCESSO NO TERMINAL (Backend)
            console.log(`✅ Sucesso! Retornando ${items.length} solicitações para o usuário ${usuarioId}`);
            return result;
        }
        catch (error) {
            // LOG DE ERRO DETALHADO
            console.error("❌ ERRO NO SERVICE ListarMinhasSolicitacoes:");
            console.error("Mensagem:", error.message);
            if (error.query)
                console.error("Query que falhou:", error.query);
            throw error;
        }
    }
};
exports.default = exports.ServicoSolicitacaoService;
