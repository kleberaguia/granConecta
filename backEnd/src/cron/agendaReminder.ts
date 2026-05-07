import cron from "node-cron";
import { AppDataSource } from "../config/data-source";
import { Agenda, StatusAgenda } from "../models/AgendaModel";
import { NotificationService } from "../services/NotificationService";
import dayjs from "dayjs";

const agendaRepo = AppDataSource.getRepository(Agenda);

// RODA A CADA 5 MINUTOS
cron.schedule("*/5 * * * *", async () => {
  const agendas = await agendaRepo.find({
    where: { status: StatusAgenda.CONFIRMADO },
    relations: ["morador", "prestador"]
  });

  for (const ag of agendas) {
    const dataHora = dayjs(`${ag.data} ${ag.hora}`, "YYYY-MM-DD HH:mm");
    const diffHoras = dataHora.diff(dayjs(), "hour");

    if (diffHoras === 24) {
      await NotificationService.enviar(
        ag.morador.id,
        "Lembrete de compromisso",
        `Seu compromisso com o prestador será amanhã às ${ag.hora}.`
      );
      await NotificationService.enviar(
        ag.prestador.id,
        "Lembrete de compromisso",
        `Você tem um compromisso amanhã às ${ag.hora}.`
      );
    }

    if (diffHoras === 1) {
      await NotificationService.enviar(
        ag.morador.id,
        "Lembrete de compromisso",
        `Seu compromisso com o prestador será dentro de 1 hora.`
      );
      await NotificationService.enviar(
        ag.prestador.id,
        "Lembrete de compromisso",
        `Compromisso com o morador daqui a 1 hora.`
      );
    }
  }
});
