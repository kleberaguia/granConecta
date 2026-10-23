import cron from "node-cron";
import {
  IsNull,
  LessThanOrEqual,
  MoreThan,
} from "typeorm";

import { AppDataSource } from "../config/data-source";
import { LojaInteracao } from "../models/LojaInteracao";
import {
  MarketingAgendamento,
  MarketingStatus,
  MarketingTipo,
} from "../models/MarketingAgendamentoModels";
import { NotificationService } from "../services/NotificationService";

let tarefa:
  | ReturnType<typeof cron.schedule>
  | null = null;

let executando = false;

async function executarMarketingInteracao() {
  if (executando) {
    console.warn(
      "[MarketingInteracaoCron] Ciclo anterior ainda está em execução.",
    );
    return;
  }

  executando = true;

  try {
    console.log(
      "[MarketingInteracaoCron] Iniciando recuperação de interações.",
    );

    const interacoesRepo =
      AppDataSource.getRepository(
        LojaInteracao,
      );

    const agendamentoRepo =
      AppDataSource.getRepository(
        MarketingAgendamento,
      );

    const agora = new Date();

    const vinteEQuatroHorasAtras =
      new Date(
        agora.getTime() -
          24 * 60 * 60 * 1000,
      );

    const inicioDoDia =
      new Date(agora);

    inicioDoDia.setHours(
      0,
      0,
      0,
      0,
    );

    /*
     * 1. Cria agendamentos a partir de
     * interações recentes com lojas.
     */
    const interacoesRecentes =
      await interacoesRepo.find({
        where: {
          createdAt: MoreThan(
            vinteEQuatroHorasAtras,
          ),
        },
      });

    let criados = 0;

    for (
      const interacao of
      interacoesRecentes
    ) {
      const usuarioId =
        interacao.usuarioId;

      if (!usuarioId) {
        continue;
      }

      const notificacoesHoje =
        await agendamentoRepo.count({
          where: {
            usuario_id: usuarioId,
            createdAt:
              MoreThan(inicioDoDia),
          },
        });

      if (notificacoesHoje >= 2) {
        continue;
      }

      const jaAgendado =
        await agendamentoRepo.findOne({
          where: {
            campanha_id: IsNull(),
            usuario_id: usuarioId,
            loja_id:
              interacao.lojaId,
            tipo:
              MarketingTipo.RECUPERACAO_INTERACAO,
            status:
              MarketingStatus.PENDENTE,
          },
        });

      if (jaAgendado) {
        continue;
      }

      const agendamento =
        agendamentoRepo.create({
          campanha_id: null,
          usuario_id: usuarioId,
          loja_id:
            interacao.lojaId,
          tipo:
            MarketingTipo.RECUPERACAO_INTERACAO,
          status:
            MarketingStatus.PENDENTE,
          data_execucao:
            new Date(
              Date.now() +
                12 *
                  60 *
                  60 *
                  1000,
            ),
          metadata: {
            motivo:
              "Interesse via clique",
            origin:
              "loja_interacoes",
          },
        });

      await agendamentoRepo.save(
        agendamento,
      );

      criados += 1;
    }

    /*
     * 2. Processa somente recuperações de
     * interação sem campanha.
     *
     * Campanhas pagas continuam sendo
     * processadas pelo MarketingDisparoService.
     */
    const agendamentosParaEnviar =
      await agendamentoRepo.find({
        where: {
          campanha_id: IsNull(),
          tipo:
            MarketingTipo.RECUPERACAO_INTERACAO,
          status:
            MarketingStatus.PENDENTE,
          data_execucao:
            LessThanOrEqual(agora),
        },
        relations: [
          "usuario",
          "store",
        ],
      });

    let enviados = 0;
    let falhas = 0;

    for (
      const task of
      agendamentosParaEnviar
    ) {
      const usuarioId =
        task.usuario_id;

      if (
        !usuarioId ||
        !task.usuario
      ) {
        task.status =
          MarketingStatus.FALHA;
        task.tentativas += 1;
        task.ultimo_erro =
          "Agendamento sem usuário vinculado.";
        task.falhou_em =
          new Date();

        await agendamentoRepo.save(
          task,
        );

        falhas += 1;
        continue;
      }

      const nomeCliente =
        task.usuario.name ||
        "vizinho";

      const nomeLoja =
        task.store?.name ||
        "loja parceira";

      const titulo =
        "Novidade na vizinhança!";

      const mensagem =
        `Olá ${nomeCliente}! Vimos que você se interessou pela loja ${nomeLoja}. Temos novidades hoje. Quer conferir?`;

      /*
       * A sineta é salva uma única vez.
       * O WhatsApp é classificado como MARKETING
       * e será bloqueado sem consentimento.
       */
      await NotificationService
        .enviarSomenteInterna(
          usuarioId,
          titulo,
          mensagem,
        );

      const enviado =
        await NotificationService
          .enviarWhatsApp(
            usuarioId,
            mensagem,
            titulo,
            "MARKETING",
          );

      task.tentativas += 1;

      if (enviado) {
        task.status =
          MarketingStatus.ENVIADO;
        task.enviado_em =
          new Date();
        task.falhou_em = null;
        task.ultimo_erro = null;
        enviados += 1;
      } else {
        task.status =
          MarketingStatus.FALHA;
        task.falhou_em =
          new Date();
        task.ultimo_erro =
          "WhatsApp não enviado. Verifique consentimento, telefone e template.";
        falhas += 1;
      }

      await agendamentoRepo.save(
        task,
      );
    }

    console.log(
      "[MarketingInteracaoCron] Ciclo concluído.",
      {
        interacoes:
          interacoesRecentes.length,
        criados,
        avaliados:
          agendamentosParaEnviar.length,
        enviados,
        falhas,
      },
    );
  } catch (error) {
    console.error(
      "[MarketingInteracaoCron] Falha no ciclo.",
      error,
    );
  } finally {
    executando = false;
  }
}

export function initMarketingCron() {
  if (tarefa) {
    return tarefa;
  }

  tarefa = cron.schedule(
    "0 10 * * *",
    () => {
      void executarMarketingInteracao();
    },
    {
      timezone:
        process.env
          .MARKETING_CRON_TIMEZONE ||
        "America/Sao_Paulo",
    },
  );

  console.log(
    "[MarketingInteracaoCron] Registrado para 10:00.",
  );

  return tarefa;
}

export function pararMarketingInteracaoCron() {
  if (!tarefa) {
    return false;
  }

  tarefa.stop();
  tarefa = null;
  return true;
}

export {
  executarMarketingInteracao,
};
