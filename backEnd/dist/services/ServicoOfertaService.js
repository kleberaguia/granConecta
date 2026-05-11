"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const servicoOfertaModels_1 = require("../models/servicoOfertaModels");
const servicoSolicitacaoModels_1 = require("../models/servicoSolicitacaoModels");
const servicoCandidatura_1 = require("../models/servicoCandidatura");
const UserModels_1 = require("../models/UserModels");
const NotificationService_1 = require("./NotificationService");
const PagamentoService_1 = __importDefault(require("./PagamentoService"));
const ofertaRepo = data_source_1.AppDataSource.getRepository(servicoOfertaModels_1.ServicoOferta);
const solicitacaoRepo = data_source_1.AppDataSource.getRepository(servicoSolicitacaoModels_1.ServicoSolicitacao);
const candidaturaRepo = data_source_1.AppDataSource.getRepository(servicoCandidatura_1.ServicoCandidatura);
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
const ServicoOfertaService = {
    /**
     * Morador escolhe uma candidatura e gera uma OFERTA para o prestador.
     */
    async criarOfertaPorCandidatura(candidaturaId, usuarioId, valorNegociado) {
        const candidatura = await candidaturaRepo.findOne({
            where: { id: candidaturaId },
            relations: ['solicitacao', 'prestador'],
        });
        if (!candidatura)
            throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        const solicitacao = candidatura.solicitacao;
        if (!solicitacao)
            throw new Error('SOLICITACAO_RELACIONADA_NAO_ENCONTRADA');
        if (solicitacao.usuarioId !== usuarioId)
            throw new Error('SEM_PERMISSAO');
        // cria oferta — preencher moradorId (FK!)
        const oferta = ofertaRepo.create();
        oferta.solicitacaoId = candidatura.solicitacaoId;
        oferta.prestadorId = candidatura.prestadorId;
        oferta.usuarioId = solicitacao.usuarioId;
        oferta.mensagem = candidatura.mensagem ?? '';
        oferta.valor = Number(valorNegociado ?? candidatura.valor_proposto ?? 0);
        oferta.status = "PENDENTE";
        const saved = await ofertaRepo.save(oferta);
        // atualiza status da solicitacao (opção: PRESTADOR_ESCOLHIDO ou OFERTA_FEITA)
        solicitacao.status = 'PRESTADOR_ESCOLHIDO';
        await solicitacaoRepo.save(solicitacao);
        // envia notif ao prestador
        await NotificationService_1.NotificationService.enviar(candidatura.prestadorId, 'Você foi selecionado!', `Sua candidatura foi escolhida para o serviço: "${solicitacao.titulo}".`);
        return saved;
    },
    /** Prestador aceita a oferta */
    async aceitarOferta(ofertaId, prestadorId) {
        const oferta = await ofertaRepo.findOne({
            where: { id: ofertaId },
            relations: ['solicitacao', 'prestador'],
        });
        if (!oferta)
            throw new Error('OFERTA_NAO_ENCONTRADA');
        if (oferta.prestadorId !== prestadorId)
            throw new Error('SEM_PERMISSAO');
        if (oferta.status !== 'PENDENTE')
            throw new Error('STATUS_INVALIDO_PARA_ACEITAR');
        oferta.status = 'ACEITA';
        await ofertaRepo.save(oferta);
        // Notifica morador
        await NotificationService_1.NotificationService.enviar(oferta.solicitacao.usuarioId, 'Oferta aceita!', `O prestador aceitou realizar o serviço "${oferta.solicitacao.titulo}".`);
        return oferta;
    },
    /** Prestador marca como em andamento */
    async marcarEmAndamento(ofertaId, prestadorId) {
        const oferta = await ofertaRepo.findOne({ where: { id: ofertaId } });
        if (!oferta)
            throw new Error('OFERTA_NAO_ENCONTRADA');
        if (oferta.prestadorId !== prestadorId)
            throw new Error('SEM_PERMISSAO');
        if (oferta.status !== 'ACEITA')
            throw new Error('OFERTA_NAO_PODE_INICIAR_SE_NAO_FOR_ACEITA');
        oferta.status = 'EM_ANDAMENTO';
        const saved = await ofertaRepo.save(oferta);
        // opcional: notificar morador que iniciou
        await NotificationService_1.NotificationService.enviar(oferta.usuarioId, 'Prestador iniciou o serviço', `O prestador iniciou o serviço: "${oferta.solicitacaoId}".`);
        return saved;
    },
    /** Prestador conclui o serviço -> cria pagamento automaticamente */
    async concluirOferta(ofertaId, prestadorId) {
        const oferta = await ofertaRepo.findOne({
            where: { id: ofertaId },
            relations: ['solicitacao'],
        });
        if (!oferta)
            throw new Error('OFERTA_NAO_ENCONTRADA');
        if (oferta.prestadorId !== prestadorId)
            throw new Error('VOCE_NAO_E_O_PRESTADOR_DESTA_OFERTA');
        if (oferta.status !== 'EM_ANDAMENTO')
            throw new Error('OFERTA_NAO_ESTA_EM_ANDAMENTO');
        // marca oferta como concluída (atenção ao enum na entidade: CONCLUIDA)
        oferta.status = 'CONCLUIDA';
        await ofertaRepo.save(oferta);
        // gerar pagamento para o morador (mesmo que vocês não queiram gerenciar, esse é o registro)
        const pagamento = await PagamentoService_1.default.criarPagamentoPorOferta(oferta.id, oferta.solicitacao.usuarioId);
        // notifica morador sobre cobrança
        await NotificationService_1.NotificationService.enviar(oferta.solicitacao.usuarioId, 'Serviço concluído — Pagamento pendente', `O prestador concluiu o serviço "${oferta.solicitacao.titulo}". Por favor, realize o pagamento.`);
        return { oferta, pagamento };
    },
    async listarPorPrestador(prestadorId) {
        return await ofertaRepo.find({
            where: { prestadorId },
            order: { createdAt: 'DESC' },
        });
    },
    async getById(id) {
        return await ofertaRepo.findOne({ where: { id } });
    },
    // Exemplo usando Knex (comum em Node.js)
    async listarMinhasOfertas(prestadorId) {
        try {
            const query = ofertaRepo.createQueryBuilder('o')
                // 1. Liga a Oferta à Solicitação
                .innerJoin('o.solicitacao', 's')
                // 2. Liga a Solicitação ao Morador (Usuário)
                .innerJoin('s.morador', 'u')
                // 3. Liga o Usuário ao seu Perfil (para pegar a foto)
                // Ajuste 'u.perfil' para o nome da relação definida no seu Model de Usuário
                .leftJoin('u.perfil', 'p')
                // 4. Liga o Usuário ao seu Endereço (para pegar a unidade)
                // Ajuste 'u.endereco' para o nome da relação definida no seu Model de Usuário
                .leftJoin('u.endereco', 'e')
                .select([
                'o.id AS id',
                'o.status AS status',
                'o.valor AS valor',
                'o.createdAt AS createdAt',
                's.titulo AS solicitacao_titulo',
                'u.name AS cliente_nome',
                // Agora pegamos da tabela de perfil (aliada como 'p')
                'p.foto_perfil_url AS cliente_foto',
                // Agora pegamos da tabela de endereço (aliada como 'e')
                'e.unidade_apto AS cliente_unidade'
            ])
                .where('o.prestadorId = :prestadorId', { prestadorId })
                .orderBy('o.createdAt', 'DESC');
            const result = await query.getRawMany();
            return result;
        }
        catch (error) {
            console.error('ERRO NO QUERY BUILDER:', error.message);
            throw new Error('Erro ao buscar ofertas: ' + error.message);
        }
    }
};
exports.default = ServicoOfertaService;
