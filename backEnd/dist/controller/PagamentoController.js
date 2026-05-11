"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PagamentoService_1 = __importDefault(require("../services/PagamentoService"));
const data_source_1 = require("../config/data-source");
const UserModels_1 = require("../models/UserModels");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
class PagamentoController {
    // cria cobrança e retorna link de pagamento
    async criar(req, res) {
        try {
            const { ofertaId } = req.body;
            const user = req.user;
            if (!user?.usuarioId)
                return res.status(401).json({ error: "Não autenticado" });
            const registro = await PagamentoService_1.default.criarPagamentoPorOferta(ofertaId, user.usuarioId);
            return res.status(201).json({
                id: registro.id,
                link_pagamento: registro.link_pagamento,
                status: registro.status,
            });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message || "Erro ao criar pagamento" });
        }
    }
    // consulta pagamento por id
    async listarMeusPagamentos(req, res) {
        try {
            const usuarioId = req.user?.usuarioId;
            if (!usuarioId)
                return res.status(401).json({ error: "ID ausente" });
            const pagamentos = await PagamentoService_1.default.listarPorUsuario(usuarioId);
            // Garante que sempre retorne um array, mesmo que vazio
            return res.status(200).json(Array.isArray(pagamentos) ? pagamentos : []);
        }
        catch (err) {
            console.error("Erro ao listar pagamentos:", err);
            return res.status(500).json({ error: "Erro interno no extrato" });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            // Validação básica de presença do ID
            if (!id || id === 'undefined' || id === 'meus') {
                return res.status(400).json({ error: 'ID de pagamento inválido ou ausente.' });
            }
            const registro = await PagamentoService_1.default.getById(id);
            if (!registro) {
                return res.status(404).json({
                    erro: "NOT_FOUND",
                    mensagem: "O pagamento solicitado não foi encontrado."
                });
            }
            return res.json(registro);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao buscar pagamento" });
        }
    }
    async updatePixKey(req, res) {
        try {
            const userId = req.user?.usuarioId; // Use o nome que o seu middleware injeta (usuarioId ou id)
            const file = req.file;
            const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
            if (!userId) {
                return res.status(401).json({ error: "ID do usuário não encontrado na sessão." });
            }
            const { chave_pix } = req.body;
            const userRepository = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario); // Verifique se é 'Usuario' ou 'User'
            const user = await userRepository.findOneBy({ id: userId });
            let perfil = await perfilRepo.findOne({ where: { usuarioId: userId } });
            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado no banco." });
            }
            if (!perfil) {
                return res.status(404).json({ message: "Perfil profissional não encontrado." });
            }
            // 1. Atualiza a Chave PIX
            if (chave_pix)
                perfil.chavePix = chave_pix;
            // 2. Atualiza o QR Code (se houver arquivo)
            if (file)
                perfil.qrCodePixUrl = file.filename;
            await userRepository.save(user);
            return res.json({ message: "Chave PIX atualizada!", chave_pix: perfil.chavePix });
        }
        catch (error) {
            console.error("ERRO NO BACKEND:", error); // Isso vai aparecer no seu terminal
            return res.status(500).json({ error: "Erro interno ao salvar chave PIX." });
        }
    }
    // 2. Upload do QR Code (Arquivo via Multer)
    async uploadQRCode(req, res) {
        try {
            const perfilRepo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
            const userId = req.user?.usuarioId;
            const file = req.file; // Processado pelo seu arquivo de upload.ts
            if (!file) {
                return res.status(400).json({ error: "Arquivo de QR Code não enviado." });
            }
            const userRepository = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
            if (!userId) {
                return res.status(401).json({ error: "Usuário não autenticado ou ID inválido." });
            }
            const user = await userRepository.findOneBy({ id: userId });
            if (!user)
                return res.status(404).json({ error: "Usuário não encontrado." });
            let perfil = await perfilRepo.findOne({ where: { usuarioId: userId } });
            if (!perfil) {
                return res.status(404).json({ message: "Perfil não encontrado." });
            }
            // Salva apenas o nome do arquivo gerado pelo seu Multer
            if (file)
                perfil.qrCodePixUrl = file.filename;
            //await userRepository.save(user);
            await perfilRepo.save(perfil);
            return res.json({
                message: "QR Code atualizado com sucesso!",
                url: file.filename
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao processar upload do QR Code." });
        }
    }
}
exports.default = new PagamentoController();
