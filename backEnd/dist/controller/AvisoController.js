"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const AvisoModels_1 = require("../models/AvisoModels");
const AvisoTarget_1 = require("../models/AvisoTarget");
const AvisoView_1 = require("../models/AvisoView");
const crypto_1 = require("crypto");
class AvisoController {
    async store(req, res) {
        const avisoRepo = data_source_1.AppDataSource.getRepository(AvisoModels_1.Aviso);
        const targetRepo = data_source_1.AppDataSource.getRepository(AvisoTarget_1.AvisoTarget);
        const authReq = req;
        const { titulo, conteudo, tipo, prioridade, visibilidade, targets } = req.body;
        if (!authReq.user)
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        const role = authReq.user.role;
        const isAdmin = role === 'SINDICO' || role === 'ADMIN';
        const isSystemAdmin = role === 'ADMIN';
        // padroniza userId
        const userId = String(authReq.user.id ?? authReq.user.usuarioId);
        // regra: avisos oficiais só admin/síndico
        if (tipo !== AvisoModels_1.AvisoTipo.CLASSIFICADOS && !isAdmin) {
            return res.status(403).json({ error: 'Apenas a administração pode criar avisos oficiais.' });
        }
        const vis = visibilidade ?? AvisoModels_1.AvisoVisibilidade.CONDOMINIO;
        // regra de permissão para escopo
        if (vis === AvisoModels_1.AvisoVisibilidade.REDE && !isSystemAdmin) {
            return res.status(403).json({ error: 'Apenas ADMIN pode criar avisos para todos os condomínios.' });
        }
        if (vis === AvisoModels_1.AvisoVisibilidade.ALVO && !isSystemAdmin) {
            return res.status(403).json({ error: 'Apenas ADMIN pode criar avisos direcionados.' });
        }
        if (vis === AvisoModels_1.AvisoVisibilidade.ALVO && (!Array.isArray(targets) || targets.length === 0)) {
            return res.status(400).json({ error: 'TARGETS_OBRIGATORIOS' });
        }
        try {
            const aviso = avisoRepo.create({
                titulo: String(titulo),
                conteudo: String(conteudo),
                tipo: tipo ?? AvisoModels_1.AvisoTipo.CLASSIFICADOS,
                condominio_id: String(authReq.user.condominio_id),
                autor_id: userId,
                prioridade: !!prioridade,
                status: 'ATIVO',
                visibilidade: vis,
            });
            await data_source_1.AppDataSource.transaction(async (manager) => {
                const saved = await manager.getRepository(AvisoModels_1.Aviso).save(aviso);
                if (vis === AvisoModels_1.AvisoVisibilidade.ALVO) {
                    const rows = targets.map((cid) => manager.getRepository(AvisoTarget_1.AvisoTarget).create({
                        avisoId: saved.id,
                        condominio_id: String(cid),
                    }));
                    await manager.getRepository(AvisoTarget_1.AvisoTarget).save(rows);
                }
            });
            return res.status(201).json(aviso);
        }
        catch (err) {
            console.error('Erro ao salvar aviso:', err);
            return res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
        }
    }
    async index(req, res) {
        const avisoRepo = data_source_1.AppDataSource.getRepository(AvisoModels_1.Aviso);
        const authReq = req;
        if (!authReq.user)
            return res.status(401).json({ error: 'Não autorizado' });
        const role = authReq.user.role;
        const isAdmin = role === 'SINDICO' || role === 'ADMIN';
        // evite vazar avisos de outros condomínios
        const requestedCondo = typeof req.query.condominio_id === 'string' ? req.query.condominio_id : undefined;
        const condominioId = (isAdmin && requestedCondo) ? requestedCondo : String(authReq.user.condominio_id);
        const status = typeof req.query.status === 'string' ? req.query.status : 'ATIVO';
        // lista visíveis: CONDOMINIO (mesmo condo) OR REDE OR ALVO (target)
        const qb = avisoRepo.createQueryBuilder('a')
            .leftJoin('aviso_targets', 't', 't.aviso_id = a.id AND t.condominio_id = :condominio_id', { condominioId })
            .leftJoinAndSelect('a.autor', 'autor')
            .where('a.status = :status', { status })
            .andWhere(`
        (
          (a.visibilidade = 'CONDOMINIO' AND a.condominio_id = :condominio_id)
          OR (a.visibilidade = 'REDE')
          OR (a.visibilidade = 'ALVO' AND t.aviso_id IS NOT NULL)
        )
      `)
            .orderBy('a.prioridade', 'DESC')
            .addOrderBy('a.createdAt', 'DESC');
        const avisos = await qb.getMany();
        return res.json(avisos);
    }
    async updateStatus(req, res) {
        const repository = data_source_1.AppDataSource.getRepository(AvisoModels_1.Aviso);
        const authReq = req;
        const { id } = req.params;
        const { status } = req.body;
        if (!authReq.user)
            return res.status(401).json({ error: 'Não autenticado' });
        const userId = String(authReq.user.id ?? authReq.user.usuarioId);
        try {
            const aviso = await repository.findOneBy({ id: String(id) });
            if (!aviso)
                return res.status(404).json({ error: 'Aviso não encontrado.' });
            const isAdmin = authReq.user.role === 'SINDICO' || authReq.user.role === 'ADMIN';
            const isOwner = aviso.autor_id === userId;
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ error: 'Sem permissão para alterar este aviso.' });
            }
            aviso.status = String(status);
            await repository.save(aviso);
            return res.json(aviso);
        }
        catch (err) {
            return res.status(500).json({ error: 'Erro ao atualizar status.' });
        }
    }
    // ✅ NOVO: marcar aviso como visto
    async marcarVisto(req, res) {
        const authReq = req;
        if (!authReq.user)
            return res.status(401).json({ error: 'Não autenticado' });
        const userId = String(authReq.user.id ?? authReq.user.usuarioId);
        const { id } = req.params;
        const viewRepo = data_source_1.AppDataSource.getRepository(AvisoView_1.AvisoView);
        const existing = await viewRepo.findOneBy({ avisoId: String(id), usuarioId: userId });
        if (existing)
            return res.status(200).json(existing);
        const row = viewRepo.create({
            id: (0, crypto_1.randomUUID)(),
            avisoId: String(id),
            usuarioId: userId,
        });
        await viewRepo.save(row);
        return res.status(201).json(row);
    }
}
exports.default = new AvisoController();
