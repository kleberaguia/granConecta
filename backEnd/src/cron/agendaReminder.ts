// src/crons/agendaCron.ts
import cron from "node-cron";
import { AppDataSource } from "../config/data-source";
import { Agenda, StatusAgenda } from "../models/AgendaModels"; // 🚀 CORRIGIDO: Caminho do arquivo corrigido para minúsculas
import { NotificationService } from "../services/NotificationService";
import dayjs from "dayjs";

const agendaRepo = AppDataSource.getRepository(Agenda);

// RODA A CADA 5 MINUTOS
cron.schedule("*/5 * * * *", async () => {
  try {
    // 🚀 CORRIGIDO: Status alterado de CONFIRMADO para AGENDADO conforme nova regra
    const agendas = await agendaRepo.find({
      where: { status: StatusAgenda.AGENDADO },
      relations: ["morador", "prestador"]
    });

    const agora = dayjs();

    for (const ag of agendas) {
      // Une a data e a hora do agendamento para comparação
      const dataHoraCompromisso = dayjs(`${ag.data} ${ag.hora}`);

      // Diferença em minutos para garantir maior precisão na janela do cron
      const diffMinutos = dataHoraCompromisso.diff(agora, "minute");

      // 1. LEMBRETE DE 24 HORAS (Amanhã): Dispara se estiver na janela de 23h55 a 24h00
      if (diffMinutos <= 1440 && diffMinutos > 1435) {
        if (ag.morador?.id) {
          await NotificationService.enviar(
            ag.morador.id,
            "⏰ Seu compromisso é amanhã!",
            `Lembrete: Você tem "${ag.descricao}" agendada para amanhã às ${ag.hora}.`
          );
        }
        if (ag.prestador?.id) {
          await NotificationService.enviar(
            ag.prestador.id,
            "⏰ Compromisso amanhã!",
            `Lembrete: Você tem um atendimento marcado para amanhã às ${ag.hora}.`
          );
        }
      }

      // 2. LEMBRETE DE 1 HORA (Daqui a pouco): Dispara se estiver na janela de 55 a 60 minutos
      if (diffMinutos <= 60 && diffMinutos > 55) {
        if (ag.morador?.id) {
          await NotificationService.enviar(
            ag.morador.id,
            "⚡ Seu atendimento começa em 1 hora!",
            `O profissional iniciará "${ag.descricao}" daqui a 1 hora (${ag.hora}). Prepare o check-in!`
          );
        }
        if (ag.prestador?.id) {
          await NotificationService.enviar(
            ag.prestador.id,
            "⚡ Atendimento em 1 hora!",
            `Você tem um compromisso agendado com o morador daqui a 1 hora às ${ag.hora}.`
          );
        }
      }

      if (
        diffMinutos <= -120 &&
        diffMinutos > -125 &&
        ag.status === StatusAgenda.AGENDADO
      ) {
        console.log(`⚠️ [Cron] Atenção: Atendimento ${ag.id} está com horário vencido e não foi encerrado.`);
        // Opcional: Notificar o prestador para ele encerrar manualmente
        if (ag.prestador?.id) {
          await NotificationService.enviar(
            ag.prestador.id,
            "❗ Atendimento Pendente",
            `O atendimento "${ag.descricao}" passou do horário e ainda não foi encerrado. Por favor, finalize-o para liberar o pagamento.`
          );
        }
      }
    }
  } catch (error: any) {
    console.error("❌ [Cron Error] Falha ao processar rotina de lembretes da agenda:", error.message);
  }
});