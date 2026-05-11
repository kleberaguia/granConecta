"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const data_source_1 = require("../config/data-source");
const AgendaModel_1 = require("../models/AgendaModel");
const NotificationService_1 = require("../services/NotificationService");
const dayjs_1 = __importDefault(require("dayjs"));
const agendaRepo = data_source_1.AppDataSource.getRepository(AgendaModel_1.Agenda);
// RODA A CADA 5 MINUTOS
node_cron_1.default.schedule("*/5 * * * *", async () => {
    const agendas = await agendaRepo.find({
        where: { status: AgendaModel_1.StatusAgenda.CONFIRMADO },
        relations: ["morador", "prestador"]
    });
    for (const ag of agendas) {
        const dataHora = (0, dayjs_1.default)(`${ag.data} ${ag.hora}`, "YYYY-MM-DD HH:mm");
        const diffHoras = dataHora.diff((0, dayjs_1.default)(), "hour");
        if (diffHoras === 24) {
            await NotificationService_1.NotificationService.enviar(ag.morador.id, "Lembrete de compromisso", `Seu compromisso com o prestador será amanhã às ${ag.hora}.`);
            await NotificationService_1.NotificationService.enviar(ag.prestador.id, "Lembrete de compromisso", `Você tem um compromisso amanhã às ${ag.hora}.`);
        }
        if (diffHoras === 1) {
            await NotificationService_1.NotificationService.enviar(ag.morador.id, "Lembrete de compromisso", `Seu compromisso com o prestador será dentro de 1 hora.`);
            await NotificationService_1.NotificationService.enviar(ag.prestador.id, "Lembrete de compromisso", `Compromisso com o morador daqui a 1 hora.`);
        }
    }
});
