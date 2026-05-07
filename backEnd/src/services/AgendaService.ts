import { AppDataSource } from "../config/data-source";
import { Agenda, StatusAgenda } from "../models/AgendaModel";
import { ServicoSolicitacao } from "../models/servicoModel";
import { Usuario } from "../models/UserModels";
import { NotificationService } from "./NotificationService";

const agendaRepo = AppDataSource.getRepository(Agenda);
const servicoRepo = AppDataSource.getRepository(ServicoSolicitacao);
const usuarioRepo = AppDataSource.getRepository(Usuario);

const AgendaService = {
  async sugerirHorario(servicoId: string, usuarioId: string, data: string, hora: string) {
    const servico = await servicoRepo.findOne({ where: { id: servicoId } });
    const morador = await usuarioRepo.findOne({ where: { id: usuarioId } });

    if (!servico?.prestador)
      throw new Error("SERVICO_NAO_TEM_PRESTADOR");

    const prestador = await usuarioRepo.findOne({ where: { id: servico.prestador.id } });

    const ag = agendaRepo.create({
      servico,
      morador: morador!,
      prestador: prestador!,
      data,
      hora,
      status: StatusAgenda.SUGERIDO
    });

    await agendaRepo.save(ag);

    await NotificationService.enviar(
      prestador!.id,
      "Novo agendamento sugerido",
      `O morador sugeriu ${data} às ${hora} para o serviço ${servico.titulo}`
    );

    return ag;
  },

  async confirmar(agendaId: string, prestadorId: string) {
    const ag = await agendaRepo.findOne({ where: { id: agendaId }, relations: ["morador", "prestador", "servico"] });

    if (!ag) throw new Error("AGENDA_NAO_ENCONTRADA");
    if (ag.prestador.id !== prestadorId) throw new Error("SEM_PERMISSAO");

    ag.status = StatusAgenda.CONFIRMADO;
    await agendaRepo.save(ag);

    await NotificationService.enviar(
      ag.morador.id,
      "Agendamento confirmado",
      `O prestador confirmou o compromisso em ${ag.data} às ${ag.hora}.`
    );

    return ag;
  }
};

export default AgendaService;
