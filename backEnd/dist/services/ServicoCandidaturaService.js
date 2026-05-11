"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/ServicoCandidaturaService.ts
const data_source_1 = require("../config/data-source");
const servicoCandidatura_1 = require("../models/servicoCandidatura");
const UserModels_1 = require("../models/UserModels");
const servicoSolicitacaoModels_1 = require("../models/servicoSolicitacaoModels");
const NotificationService_1 = require("./NotificationService");
const servicoOfertaModels_1 = require("../models/servicoOfertaModels");
const candRepo = data_source_1.AppDataSource.getRepository(servicoCandidatura_1.ServicoCandidatura);
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
const solicitacaoRepo = data_source_1.AppDataSource.getRepository(servicoSolicitacaoModels_1.ServicoSolicitacao);
const ofertaRepo = data_source_1.AppDataSource.getRepository(servicoOfertaModels_1.ServicoOferta);
const ServicoCandidaturaService = {
    async listarMinhas(prestadorId) {
        try {
            const sql = `
        SELECT 
        c.id AS id,
        c.status AS candidatura_status,
        c.valor_proposto AS valor_proposto,
        c.mensagem AS candidatura_mensagem,
        c.solicitacaoId AS solicitacao_id,
        c.createdAt AS createdAt,
        s.id AS solicitacao_id_orig,
        s.titulo AS solicitacao_titulo,
        u.name AS morador_nome,
        pt.foto_perfil_url AS morador_foto,
        e.bloco AS morador_bloco,
        e.unidade_apto AS morador_unidade,
        cond.nome AS condominio_nome
        FROM servico_candidatura c
        INNER JOIN servico_solicitacao s ON c.solicitacaoId = s.id
        INNER JOIN usuarios u ON s.usuarioId = u.id
        LEFT JOIN endereco e ON u.id = e.usuarioId 
        LEFT JOIN perfil_prestador pt ON u.id = pt.usuarioId
        LEFT JOIN condominios cond ON u.condominio_id = cond.id
        WHERE c.prestadorId = ?
        ORDER BY c.createdAt DESC;
    `;
            const rows = await data_source_1.AppDataSource.query(sql, [prestadorId]);
            return rows.map((row) => {
                // Pega o ID da solicitação de qualquer lugar possível
                const sId = row.solicitacao_id_raw || row.solicitacaoidraw || row.solicitacao_id_orig;
                return {
                    id: row.id,
                    solicitacaoId: sId, // <--- O Modal precisa deste campo!
                    status: row.candidatura_status,
                    valor_proposto: row.valor_proposto,
                    mensagem: row.candidatura_mensagem,
                    createdAt: row.createdAt,
                    // Mantemos campos flat para compatibilidade
                    solicitacao_titulo: row.solicitacao_titulo,
                    solicitacao: {
                        id: sId,
                        titulo: row.solicitacao_titulo,
                        morador: {
                            nome: row.morador_nome,
                            foto_perfil_url: row.morador_foto,
                            bloco: row.morador_bloco,
                            unidade: row.morador_unidade
                        },
                        condominio: {
                            nome: row.condominio_nome
                        }
                    }
                };
            });
        }
        catch (error) {
            console.error("Erro no Service listarMinhas:", error);
            throw error;
        }
    },
    // ✅ PRESTADOR SE CANDIDATA
    async candidatar(data) {
        const solicitacao = await solicitacaoRepo.findOne({
            where: { id: data.solicitacaoId }
        });
        if (!solicitacao)
            throw new Error('SOLICITACAO_NAO_ENCONTRADA');
        // Validação extra: O prestador já se candidatou?
        const jaCandidatado = await candRepo.findOne({
            where: { solicitacaoId: data.solicitacaoId, prestadorId: data.prestadorId }
        });
        if (jaCandidatado)
            throw new Error('VOCE_JA_SE_CANDIDATOU');
        const prestador = await usuarioRepo.findOne({ where: { id: data.prestadorId } });
        if (!prestador || prestador.tipo !== 'PRESTADOR')
            throw new Error('PRESTADOR_NAO_ENCONTRADO');
        const cand = candRepo.create({
            solicitacaoId: solicitacao.id,
            prestadorId: prestador.id,
            mensagem: data.mensagem || '',
            valor_proposto: data.proposta_valor ?? solicitacao.valor_sugerido ?? 0,
            status: 'PENDENTE'
        });
        const saved = await candRepo.save(cand);
        // Notificar Morador
        await NotificationService_1.NotificationService.enviar(solicitacao.usuarioId, 'Nova candidatura recebida', `O prestador ${prestador.name} se candidatou ao serviço ${solicitacao.titulo}.`);
        // MANTEMOS O STATUS 'CANDIDATOS', mas o mercado deve continuar exibindo-o
        solicitacao.status = 'CANDIDATOS';
        await solicitacaoRepo.save(solicitacao);
        return saved;
    },
    // ✅ LISTAR CANDIDATURAS POR SOLICITAÇÃO
    async listarPorSolicitacao(solicitacaoId) {
        const candRepo = data_source_1.AppDataSource.getRepository(servicoCandidatura_1.ServicoCandidatura);
        return await candRepo.createQueryBuilder('candidatura')
            .leftJoinAndSelect('candidatura.solicitacao', 'solicitacao')
            // Se a candidatura tem um campo 'usuario' ou 'prestador' que aponta para Usuario
            .leftJoinAndSelect('candidatura.prestador', 'prestador')
            .where('candidatura.solicitacaoId = :solicitacaoId', { solicitacaoId })
            .orderBy('candidatura.createdAt', 'DESC')
            .getMany();
    },
    // ✅ PRESTADOR RETIRA CANDIDATURA
    async retirarCandidatura(candidaturaId, prestadorId) {
        const c = await candRepo.findOne({ where: { id: candidaturaId } });
        if (!c)
            throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        if (c.prestadorId !== prestadorId)
            throw new Error('SEM_PERMISSAO');
        c.status = 'CANCELADA';
        return await candRepo.save(c);
    },
    // ✅ MORADOR OU PRESTADOR ENVIA PROPOSTA
    async enviarProposta(data) {
        const candidatura = await candRepo.findOne({
            where: { id: data.candidaturaId },
            relations: ['solicitacao']
        });
        if (!candidatura)
            throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        const isMorador = candidatura.solicitacao.usuarioId === data.usuarioId;
        const isPrestador = candidatura.prestadorId === data.usuarioId;
        if (!isMorador && !isPrestador) {
            throw new Error('SEM_PERMISSAO');
        }
        candidatura.valor_proposto = data.valor;
        candidatura.mensagem = data.mensagem;
        candidatura.status = isMorador
            ? 'PROPOSTA_MORADOR'
            : 'PROPOSTA_PRESTADOR';
        const saved = await candRepo.save(candidatura);
        const destinatario = isMorador
            ? candidatura.prestadorId
            : candidatura.solicitacao.usuarioId;
        await NotificationService_1.NotificationService.enviar(destinatario, 'Nova proposta recebida', `Nova proposta de valor: R$ ${data.valor}`);
        return saved;
    },
    // ✅ ACEITAR PROPOSTA → CRIA REGISTRO EM servico_oferta AUTOMATICAMENTE
    async aceitarProposta(candidaturaId, usuarioId) {
        const candidatura = await candRepo.findOne({
            where: { id: candidaturaId },
            relations: ['solicitacao']
        });
        if (!candidatura)
            throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        const isMorador = candidatura.solicitacao.usuarioId === usuarioId;
        const isPrestador = candidatura.prestadorId === usuarioId;
        // CENÁRIO: PRESTADOR ACEITA PROPOSTA DO MORADOR
        if (isPrestador && candidatura.status === 'PROPOSTA_MORADOR') {
            candidatura.status = 'ACEITO_PRESTADOR';
            return await candRepo.save(candidatura);
        }
        // CENÁRIO FINAL: MORADOR ACEITA (FECHA O NEGÓCIO)
        // Se o morador aceita uma Proposta do Prestador OU um aceite prévio do prestador
        if (isMorador && (candidatura.status === 'PROPOSTA_PRESTADOR' || candidatura.status === 'ACEITO_PRESTADOR' || candidatura.status === 'PENDENTE')) {
            // 1. Atualiza a Candidatura
            candidatura.status = 'ACORDO_FECHADO';
            await candRepo.save(candidatura);
            // 2. ATUALIZA A SOLICITAÇÃO (Isso faz sumir para os outros!)
            await solicitacaoRepo.update(candidatura.solicitacaoId, {
                status: 'FECHADO',
                prestadorId: candidatura.prestadorId,
                // Garantimos que seja um número. Se for undefined/null, vira 0 ou o valor original
                valor_final: Number(candidatura.valor_proposto) || 0
            });
            // 3. RECUSA AS OUTRAS (Limpa o mercado)
            await candRepo.query("UPDATE servico_candidatura SET status = 'ENCERRADA' WHERE solicitacaoId = ? AND id != ?", [candidatura.solicitacaoId, candidaturaId]);
            // 4. Cria a Oferta/Serviço em execução
            const oferta = ofertaRepo.create({
                solicitacaoId: candidatura.solicitacaoId,
                prestadorId: candidatura.prestadorId,
                usuarioId: candidatura.solicitacao.usuarioId,
                valor: Number(candidatura.valor_proposto),
                status: "PENDENTE"
            });
            await ofertaRepo.save(oferta);
            return { status: 'ACORDO_FECHADO' };
        }
    },
    // ✅ RECUSAR PROPOSTA
    async recusarProposta(candidaturaId, usuarioId) {
        const candidatura = await candRepo.findOne({
            where: { id: candidaturaId },
            relations: ['solicitacao']
        });
        if (!candidatura)
            throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        const isMorador = candidatura.solicitacao.usuarioId === usuarioId;
        const isPrestador = candidatura.prestadorId === usuarioId;
        if (!isMorador && !isPrestador) {
            throw new Error('SEM_PERMISSAO');
        }
        candidatura.status = 'RECUSADA';
        const saved = await candRepo.save(candidatura);
        const destinatario = isMorador
            ? candidatura.prestadorId
            : candidatura.solicitacao.usuarioId;
        await NotificationService_1.NotificationService.enviar(destinatario, 'Proposta recusada', 'A proposta foi recusada.');
        return saved;
    }
};
exports.default = ServicoCandidaturaService;
