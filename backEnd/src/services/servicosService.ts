import { AppDataSource } from "../config/data-source";
import { ServicoSolicitacao } from "../models/servicoSolicitacaoModels";
import { Usuario } from "../models/UserModels";
import { ServicoTipo } from "../models/ServicoCategoriaModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel"; // ✅ Import necessário
import { UserStatus } from "../models/enums";

// Repositórios
const servicoRepo = AppDataSource.getRepository(ServicoSolicitacao);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const tipoRepo = AppDataSource.getRepository(ServicoTipo);
const perfilRepo = AppDataSource.getRepository(PerfilPrestador); // ✅ Repositório de Perfil

const servicoService = {

  // =================================================================
  // 1) Morador cria serviço
  // =================================================================
  async criarServico(params: {
    usuarioId: string;
    categoria_slug: string;
    titulo: string;
    descricao: string;
    valor_sugerido?: number;
    bloco?: string;
    apartamento?: string;
    observacoes?: string;
  }): Promise<ServicoSolicitacao> {

    // Validar Morador (Buscando o perfil para checar status se necessário)
    const morador = await usuarioRepo.findOne({
      where: { id: params.usuarioId },
      relations: ["perfil"]
    });

    if (!morador) throw new Error("MORADOR_NAO_ENCONTRADO");
    if (morador.tipo !== "MORADOR") throw new Error("USUARIO_NAO_E_MORADOR");

    // Se o status estiver no Perfil:
    if (morador.perfil?.status !== UserStatus.APROVADO) {
      throw new Error("MORADOR_NAO_APROVADO");
    }

    const tipoServico = await tipoRepo.findOne({ where: { slug: params.categoria_slug } });
    if (!tipoServico) throw new Error("CATEGORIA_NAO_ENCONTRADA");

    let descricaoCompleta = params.descricao;
    if (params.bloco || params.apartamento) {
      descricaoCompleta += `\n\nLocal: Bloco ${params.bloco || '-'}, Apto ${params.apartamento || '-'}`;
    }
    if (params.observacoes) {
      descricaoCompleta += `\nObs: ${params.observacoes}`;
    }

    const servico = servicoRepo.create({
      morador: morador,
      tipo: tipoServico,
      titulo: params.titulo,
      descricao: descricaoCompleta,
      status: "BUSCANDO_PRESTADOR",
      valor_sugerido: params.valor_sugerido || null,
    } as any) as unknown as ServicoSolicitacao;

    return await servicoRepo.save(servico);
  },

  // =================================================================
  // 4) Detalhes do Prestador (Ajustado para Perfil)
  // =================================================================
  async buscarPrestadorPorId(id: string) {
    const prestador = await usuarioRepo.findOne({
      where: { id, tipo: "PRESTADOR" },
      relations: ["auth", "perfil"] // ✅ Trazemos as tabelas onde os dados realmente estão
    });

    if (!prestador) throw new Error("PRESTADOR_NAO_ENCONTRADO");

    // Formatamos o retorno para o Controller não receber 'null'
    return {
      id: prestador.id,
      name: prestador.name,
      email: prestador.auth?.email, // ✅ Vem da tabela auth
      foto_perfil_url: prestador.perfil?.foto_perfil_url, // ✅ Vem do perfil
      descricao_bio: prestador.perfil?.descricao_bio,
      status: prestador.perfil?.status,
      disponivel: prestador.perfil?.disponivel
    };
  },


  

  async listarTodosServicosAdmin(filtros: {
    status?: string;
    usuarioId?: string;
    prestadorId?: string;
    categoria_slug?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<ServicoSolicitacao[]> {
    const qb = servicoRepo
      .createQueryBuilder("servico")
      // Trazemos as relações para o admin ver quem é quem
      .leftJoinAndSelect("servico.morador", "morador")
      .leftJoinAndSelect("servico.prestador", "prestador")
      .leftJoinAndSelect("servico.tipo", "tipo")
      .leftJoinAndSelect("servico.avaliacao", "avaliacao");

    // Filtros Dinâmicos
    if (filtros.status) {
      qb.andWhere("servico.status = :status", { status: filtros.status });
    }

    if (filtros.usuarioId) {
      qb.andWhere("servico.usuarioId = :usuarioId", { usuarioId: filtros.usuarioId });
    }

    if (filtros.prestadorId) {
      qb.andWhere("servico.prestadorId = :prestadorId", { prestadorId: filtros.prestadorId });
    }

    if (filtros.categoria_slug) {
      // Filtro baseado no slug da tabela relacionada 'tipo'
      qb.andWhere("tipo.slug = :slug", { slug: filtros.categoria_slug });
    }

    // Filtro de Datas (Tratando o período)
    if (filtros.dataInicio) {
      qb.andWhere("servico.createdAt >= :dataInicio", { dataInicio: filtros.dataInicio });
    }

    if (filtros.dataFim) {
      // Dica: Se enviar apenas a data (YYYY-MM-DD), o banco considera 00:00:00. 
      // Para pegar o dia todo, idealmente somar um dia ou tratar a string.
      qb.andWhere("servico.createdAt <= :dataFim", { dataFim: filtros.dataFim });
    }

    // Ordenação: Mais recentes primeiro
    qb.orderBy("servico.createdAt", "DESC");

    return await qb.getMany();
  },

  async getServicoDetalheAdmin(id: string): Promise<ServicoSolicitacao | null> {
    return await servicoRepo.findOne({
      where: { id },
      relations: [
        "morador",           // Dados do morador que solicitou
        "morador.perfil",    // Perfil do morador (apartamento/bloco se houver)
        "prestador",         // Dados do prestador (se já tiver um)
        "prestador.perfil",  // Perfil profissional do prestador
        "tipo",              // Categoria do serviço (Limpeza, Elétrica, etc)
        "avaliacao"          // Nota e comentário caso o serviço já tenha sido concluído
      ],
    });
  },

  // =================================================================
  // ✅ ÁREA DO ADMIN: GESTÃO DE PRESTADORES (Ajustado para Perfil)
  // =================================================================

  async listarPrestadoresPendentes() {
    // Buscamos no PerfilRepo porque o Status PENDENTE mora lá
    return await perfilRepo.find({
      where: {
        status: UserStatus.PENDENTE
      },
      relations: ["usuario", "usuario.auth"] // ✅ Join para pegar nome e email
    });
  },

  async aprovarPrestador(id: string) {
    // Buscamos o perfil pelo usuarioId padronizado
    const perfil = await perfilRepo.findOne({
      where: { usuarioId: id }
    });

    if (!perfil) throw new Error("PERFIL_NAO_ENCONTRADO");

    perfil.status = UserStatus.APROVADO;
    perfil.disponivel = true;

    return await perfilRepo.save(perfil);
  },

  async reprovarPrestador(id: string) {
    const perfil = await perfilRepo.findOne({
      where: { usuarioId: id }
    });

    if (!perfil) throw new Error("PERFIL_NAO_ENCONTRADO");

    perfil.status = UserStatus.REJEITADO;
    perfil.disponivel = false;

    return await perfilRepo.save(perfil);
  },

  // Mantendo os outros métodos que já estavam corretos
  async listarServicosDoMorador(usuarioId: string) {
    return servicoRepo.find({
      where: { usuarioId },
      order: { createdAt: "DESC" },
      relations: ["prestador", "tipo", "avaliacao"],
    });
  },

  async listarServicosDisponiveis(categoria_slug?: string) {
    const qb = servicoRepo.createQueryBuilder("servico")
      .leftJoinAndSelect("servico.morador", "morador")
      .leftJoinAndSelect("servico.tipo", "tipo")
      .where("servico.status = :status", { status: "BUSCANDO_PRESTADOR" });

    if (categoria_slug) qb.andWhere("tipo.slug = :slug", { slug: categoria_slug });
    qb.orderBy("servico.createdAt", "DESC");
    return await qb.getMany();
  },

  async getById(id: string) {
    return servicoRepo.findOne({
      where: { id },
      relations: ["morador", "prestador", "tipo", "avaliacao"],
    });
  }
};

export default servicoService;