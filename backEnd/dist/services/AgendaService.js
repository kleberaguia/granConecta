"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const AgendaModel_1 = require("../models/AgendaModel");
const servicoModel_1 = require("../models/servicoModel");
const UserModels_1 = require("../models/UserModels");
const NotificationService_1 = require("./NotificationService");
const agendaRepo = data_source_1.AppDataSource.getRepository(AgendaModel_1.Agenda);
const servicoRepo = data_source_1.AppDataSource.getRepository(servicoModel_1.ServicoSolicitacao);
const usuarioRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
const AgendaService = {
    async sugerirHorario(servicoId, usuarioId, data, hora) {
        const servico = await servicoRepo.findOne({ where: { id: servicoId } });
        const morador = await usuarioRepo.findOne({ where: { id: usuarioId } });
        if (!servico?.prestador)
            throw new Error("SERVICO_NAO_TEM_PRESTADOR");
        const prestador = await usuarioRepo.findOne({ where: { id: servico.prestador.id } });
        const ag = agendaRepo.create({
            servico,
            morador: morador,
            prestador: prestador,
            data,
            hora,
            status: AgendaModel_1.StatusAgenda.SUGERIDO
        });
        await agendaRepo.save(ag);
        await NotificationService_1.NotificationService.enviar(prestador.id, "Novo agendamento sugerido", `O morador sugeriu ${data} às ${hora} para o serviço ${servico.titulo}`);
        return ag;
    },
    async confirmar(agendaId, prestadorId) {
        const ag = await agendaRepo.findOne({ where: { id: agendaId }, relations: ["morador", "prestador", "servico"] });
        if (!ag)
            throw new Error("AGENDA_NAO_ENCONTRADA");
        if (ag.prestador.id !== prestadorId)
            throw new Error("SEM_PERMISSAO");
        ag.status = AgendaModel_1.StatusAgenda.CONFIRMADO;
        await agendaRepo.save(ag);
        await NotificationService_1.NotificationService.enviar(ag.morador.id, "Agendamento confirmado", `O prestador confirmou o compromisso em ${ag.data} às ${ag.hora}.`);
        return ag;
    }
};
exports.default = AgendaService;
