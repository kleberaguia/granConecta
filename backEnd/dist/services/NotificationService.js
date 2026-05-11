"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const data_source_1 = require("../config/data-source");
const NotificationModel_1 = require("../models/NotificationModel");
const UserModels_1 = require("../models/UserModels");
const EmailService_1 = require("./EmailService");
const notificacaoRepo = data_source_1.AppDataSource.getRepository(NotificationModel_1.Notificacao);
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
exports.NotificationService = {
    // ✅ Salva notificação no banco (Sineta do sistema)
    async enviar(usuarioId, titulo, mensagem) {
        // Tenta achar o usuário. Se não achar (transação bloqueando), ignora o salvamento no banco
        const usuario = await usuarioRepo.findOne({ where: { id: usuarioId }, relations: ["auth"] });
        if (!usuario) {
            console.warn(`[NotificationService] Usuário ${usuarioId} não encontrado. Notificação interna ignorada.`);
            return;
        }
        const notif = notificacaoRepo.create({
            usuario,
            usuarioId,
            titulo,
            mensagem,
            lido: false
        });
        return await notificacaoRepo.save(notif);
    },
    async listar(usuarioId) {
        return await notificacaoRepo.find({
            where: { usuarioId },
            order: { dataCriacao: "DESC" }
        });
    },
    // ✅ Método Híbrido: Aceita ID ou Email direto
    async enviarEmail(destinatario, titulo, mensagem) {
        let emailParaEnviar = destinatario;
        let usuarioIdParaSalvar = null;
        // 1. Verifica se o "destinatario" é um ID ou um Email
        const ehEmail = destinatario.includes("@");
        if (ehEmail) {
            // [CENÁRIO REGISTRO]: Recebemos o email direto.
            // Não buscamos no banco para evitar erro de transação.
            emailParaEnviar = destinatario;
            // Obs: Não definimos usuarioIdParaSalvar, então não vai salvar no histórico interno
            // (Geralmente código de verificação não precisa ficar no histórico da plataforma)
        }
        else {
            // [CENÁRIO NORMAL]: Recebemos um ID. Buscamos no banco.
            const usuario = await usuarioRepo.findOne({ where: { id: destinatario } });
            if (!usuario?.email) {
                throw new Error("USUARIO_SEM_EMAIL");
            }
            emailParaEnviar = usuario?.email;
            usuarioIdParaSalvar = destinatario;
        }
        await EmailService_1.EmailService.send(emailParaEnviar, titulo, mensagem);
        // 3. (Opcional) Se tivermos o ID confirmado, salvamos também no banco interno
        if (usuarioIdParaSalvar) {
            return await this.enviar(usuarioIdParaSalvar, titulo, mensagem);
        }
    },
};
