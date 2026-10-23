import { AppDataSource } from '../config/data-source';
import { ServicoOferta } from '../models/servicoOfertaModels';
import { ServicoSolicitacao } from '../models/servicoSolicitacaoModels';
import { ServicoCandidatura } from '../models/servicoCandidatura';
import { Usuario } from '../models/UserModels';

import { NotificationService } from './NotificationService';
import PagamentoService from './PagamentoService';

const ofertaRepo = AppDataSource.getRepository(ServicoOferta);
const solicitacaoRepo = AppDataSource.getRepository(ServicoSolicitacao);
const candidaturaRepo = AppDataSource.getRepository(ServicoCandidatura);
const usuarioRepo = AppDataSource.getRepository(Usuario);

const ServicoOfertaService = {

  /**
   * Morador escolhe candidatura
   * e gera oferta para o prestador
   */
  async criarOfertaPorCandidatura(
    candidaturaId: string,
    usuarioId: string,
    valorNegociado?: number
  ) {

    // 🚀 CORREÇÃO 1: Garante que as propriedades brutas da candidatura sejam lidas do repositório
    const candidatura = await candidaturaRepo.findOne({
      where: { id: candidaturaId },
      relations: ['solicitacao', 'prestador'],
    });

    if (!candidatura) {
      throw new Error('CANDIDATURA_NAO_ENCONTRADA');
    }

    const solicitacao = candidatura.solicitacao;

    if (!solicitacao) {
      throw new Error('SOLICITACAO_RELACIONADA_NAO_ENCONTRADA');
    }

    if (solicitacao.usuarioId !== usuarioId) {
      throw new Error('SEM_PERMISSAO');
    }

    // cria oferta
    const oferta = ofertaRepo.create();

    oferta.solicitacaoId = candidatura.solicitacaoId;
    oferta.prestadorId = candidatura.prestadorId;
    oferta.usuarioId = solicitacao.usuarioId;
    oferta.mensagem = candidatura.mensagem ?? '';

    oferta.valor = Number(
      valorNegociado ??
      candidatura.valor_proposto ??
      0
    );

    oferta.status = 'PENDENTE';

    // 🚀 CORREÇÃO 2: Captura com precisão matemática todas as variações de escrita possíveis (Snake e Camel Case)
    const solicitacaoMetadata =
      (solicitacao as any).metadata &&
        typeof (solicitacao as any).metadata === 'object'
        ? (solicitacao as any).metadata
        : {};

    const sessoesAcordadas = Math.max(
      1,
      Number(
        (candidatura as any).total_sessoes ??
        (candidatura as any).totalSessoes ??
        (solicitacao as any).total_sessoes ??
        (solicitacao as any).totalSessoes ??
        solicitacaoMetadata.totalSessions ??
        solicitacaoMetadata.total_sessoes ??
        solicitacaoMetadata.catalogTotalSessions ??
        solicitacaoMetadata.catalog_total_sessions ??
        1
      ) || 1
    );

    console.log(
      `[Oferta Backend] Gerando contrato. ID Candidatura: ${candidaturaId} | Quantidade de Sessões herdadas: ${sessoesAcordadas}`,
      {
        candidaturaTotalSessoes:
          (candidatura as any).total_sessoes ??
          (candidatura as any).totalSessoes ??
          null,
        solicitacaoTotalSessoes:
          (solicitacao as any).total_sessoes ??
          (solicitacao as any).totalSessoes ??
          null,
        metadataTotalSessions:
          solicitacaoMetadata.totalSessions ??
          solicitacaoMetadata.total_sessoes ??
          solicitacaoMetadata.catalogTotalSessions ??
          solicitacaoMetadata.catalog_total_sessions ??
          null,
      }
    );

    oferta.tipo_fluxo = (solicitacao as any).tipo_fluxo || 'SERVICO';

    // Alimenta tanto a coluna física da model quanto a variação usada pelo banco
    (oferta as any).total_sessoes = sessoesAcordadas;
    (oferta as any).totalSessoes = sessoesAcordadas;

    oferta.sessoes_concluidas = 0;
    oferta.agenda_liberada = false;
    oferta.total_sessoes = sessoesAcordadas;


    const saved = await ofertaRepo.save(oferta);

    // atualiza status da solicitação
    solicitacao.status = 'PRESTADOR_ESCOLHIDO';
    await solicitacaoRepo.save(solicitacao);

    // notificação ao prestador
    await NotificationService.enviar(
      candidatura.prestadorId,
      'Você foi selecionado!',
      `Sua candidatura foi escolhida para o serviço: "${solicitacao.titulo}".`
    );

    return saved;
  },

  /**
   * Prestador aceita oferta
   * -> cria checkout Mercado Pago
   */
  async aceitarOferta(
    ofertaId: string,
    prestadorId: string
  ) {

    const oferta = await ofertaRepo.findOne({
      where: { id: ofertaId },
      relations: ['solicitacao', 'prestador'],
    });

    if (!oferta) {
      throw new Error('OFERTA_NAO_ENCONTRADA');
    }

    if (oferta.prestadorId !== prestadorId) {
      throw new Error('SEM_PERMISSAO');
    }

    if (oferta.status !== 'PENDENTE') {
      throw new Error('STATUS_INVALIDO_PARA_ACEITAR');
    }

    // altera status
    oferta.status = 'ACEITA';

    await ofertaRepo.save(oferta);

    let pagamento = null;

    try {
      pagamento = await PagamentoService.criarCheckoutMercadoPago({
        ofertaId: oferta.id,
        titulo: oferta.solicitacao.titulo,
        valor: Number(oferta.valor),
        pagadorId: oferta.usuarioId,
      });
    } catch (error: any) {
      console.error('ERRO_AO_CRIAR_CHECKOUT_MP:', error?.message);
      pagamento = null;
    }

    // notifica cliente
    await NotificationService.enviar(
      oferta.solicitacao.usuarioId,
      'Oferta aceita!',
      `O prestador aceitou realizar o serviço "${oferta.solicitacao.titulo}".`
    );

    return {
      oferta,
      pagamento,
    };
  },

  /**
   * Prestador inicia serviço / Produção do Pedido
   * -> valida pagamento e gerencia gatilho de agenda compartilhada
   */
  async marcarEmAndamento(
    ofertaId: string,
    prestadorId: string
  ) {
    const oferta = await ofertaRepo.findOne({
      where: { id: ofertaId },
    });

    if (!oferta) {
      throw new Error('OFERTA_NAO_ENCONTRADA');
    }

    if (String(oferta.prestadorId) !== String(prestadorId)) {
      throw new Error('SEM_PERMISSAO');
    }

    const statusOferta = String(oferta.status || '').toUpperCase();

    // Idempotência:
    // se a primeira chamada já iniciou a oferta, uma repetição não deve falhar.
    if (statusOferta === 'EM_ANDAMENTO') {
      return oferta;
    }

    // No fluxo atual, o acordo pode gerar uma oferta PENDENTE e o morador
    // realizar o pagamento antes do início operacional do serviço.
    if (!['PENDENTE', 'ACEITA'].includes(statusOferta)) {
      throw new Error('OFERTA_NAO_PODE_INICIAR_NESTE_STATUS');
    }

    const pagamento = await PagamentoService.buscarPorOferta(oferta.id);

    if (!pagamento) {
      throw new Error('PAGAMENTO_NAO_ENCONTRADO');
    }

    const statusPagamento = String(
      (pagamento as any).status || ''
    ).toUpperCase();

    if (
      ![
        'PAGO',
        'APROVADO',
        'APPROVED',
        'PARCIALMENTE_PAGO',
      ].includes(statusPagamento)
    ) {
      throw new Error('PAGAMENTO_PENDENTE');
    }

    // Iniciar o serviço NÃO libera o dinheiro.
    // O pagamento permanece PAGO + RETIDO até o fluxo próprio
    // de conclusão/check-in/liberação.
    oferta.status = 'EM_ANDAMENTO';

    if (oferta.tipo_fluxo === 'SERVICO') {
      oferta.agenda_liberada = true;
    }

    const saved = await ofertaRepo.save(oferta);

    // IMPORTANTE:
    // servico_solicitacao não possui EM_ANDAMENTO no ENUM.
    // Ela permanece FECHADO após o acordo.
    // O estado operacional da execução pertence à servico_oferta.

    await NotificationService.enviar(
      oferta.usuarioId,
      'Trabalho Iniciado!',
      oferta.tipo_fluxo === 'DELIVERY'
        ? 'Seu pedido entrou em produção!'
        : 'O prestador iniciou o andamento da sua solicitação.'
    );

    return saved;
  },

  /**
   * Prestador conclui serviço / Pronto para Entrega
   */
  async concluirOferta(
    ofertaId: string,
    prestadorId: string
  ) {

    const oferta = await ofertaRepo.findOne({
      where: { id: ofertaId },
      relations: ['solicitacao'],
    });

    if (!oferta) {
      throw new Error('OFERTA_NAO_ENCONTRADA');
    }

    if (oferta.prestadorId !== prestadorId) {
      throw new Error('VOCE_NAO_E_O_PRESTADOR_DESTA_OFERTA');
    }

    if (oferta.status !== 'EM_ANDAMENTO') {
      throw new Error('OFERTA_NAO_ESTA_EM_ANDAMENTO');
    }

    // 🚀 LÓGICA DE TRANSIÇÃO BASEADA NO MODELO DE NEGÓCIO
    // Se for Produto ou Delivery, avança para "PRONTO" (Expedição/Bancada). 
    // Serviços avançam direto para "CONCLUIDA".
    if (oferta.tipo_fluxo === 'DELIVERY' || oferta.tipo_fluxo === 'PRODUTO') {
      oferta.status = 'PRONTO';
    } else {
      oferta.status = 'CONCLUIDA';
    }

    await ofertaRepo.save(oferta);

    let pagamento = null;

    // Só encerra o pagamento sistêmico imediatamente se for serviço direto sem rota de entrega
    if (oferta.status === 'CONCLUIDA') {
      try {
        pagamento = await PagamentoService.finalizarPagamentoPorOferta(oferta.id);
      } catch (error: any) {
        console.warn('FINALIZACAO_PAGAMENTO_NAO_DISPONIVEL:', error?.message);
        pagamento = null;
      }
    }

    // notifica cliente
    await NotificationService.enviar(
      oferta.solicitacao.usuarioId,
      oferta.status === 'PRONTO' ? 'Pedido Pronto!' : 'Serviço Concluído',
      `O estabelecimento atualizou o status de "${oferta.solicitacao.titulo}".`
    );

    return {
      oferta,
      pagamento,
    };
  },

  /**
   * 🚀 NOVO MÉTODO: Despacha o motoboy / Finaliza retirada física
   */
  async despacharOferta(ofertaId: string, prestadorId: string) {
    const oferta = await ofertaRepo.findOne({
      where: { id: ofertaId },
      relations: ['solicitacao'],
    });

    if (!oferta) throw new Error('OFERTA_NAO_ENCONTRADA');
    if (oferta.prestadorId !== prestadorId) throw new Error('SEM_PERMISSAO');
    if (oferta.status !== 'PRONTO') throw new Error('OFERTA_NAO_ESTA_PRONTA_PARA_ENVIO');

    oferta.status = 'CONCLUIDA';
    await ofertaRepo.save(oferta);

    let pagamento = null;
    try {
      pagamento = await PagamentoService.finalizarPagamentoPorOferta(oferta.id);
    } catch (e) {
      pagamento = null;
    }

    await NotificationService.enviar(
      oferta.solicitacao.usuarioId,
      'Saiu para entrega!',
      `Seu pedido/produto de "${oferta.solicitacao.titulo}" saiu para rota de entrega.`
    );

    return { oferta, pagamento };
  },

  /**
   * Lista ofertas do prestador
   */
  async listarPorPrestador(
    prestadorId: string
  ) {
    return await ofertaRepo.find({
      where: { prestadorId },
      order: { createdAt: 'DESC' },
    });
  },

  /**
   * Busca oferta por ID
   */
  async getById(id: string) {
    return await ofertaRepo.findOne({
      where: { id },
    });
  },

  /**
   * Lista minhas ofertas (Query Builder Otimizado para Larga Escala e Kanban)
   */
  async listarMinhasOfertas(
    usuarioId: string
  ) {
    try {
      const query = ofertaRepo
        .createQueryBuilder('o')
        .innerJoin('o.solicitacao', 's')
        .innerJoin('s.morador', 'u')
        .leftJoin('u.perfil', 'p')
        .leftJoin('u.endereco', 'e')
        .leftJoin('o.pagamento', 'pg')
        .select([
          'o.id AS id',
          'o.status AS status',
          'o.valor AS valor',
          'o.createdAt AS createdAt',
          'o.tipo_fluxo AS tipo_fluxo',

          // 🚀 AQUI ESTÁ O TRATAMENTO: Enviamos das duas formas! 
          // O drive do banco pode minúsculizar, mas o mapeamento garante a entrega limpa.
          'o.total_sessoes AS totalSessoes',
          'o.total_sessoes AS totalsessoes', // Duplicado em minúsculo

          'o.sessoes_concluidas AS sessoesConcluidas',
          'o.sessoes_concluidas AS sessoesconcluidas', // Duplicado em minúsculo

          'o.agenda_liberada AS agenda_liberada',
          's.titulo AS solicitacao_titulo',
          'u.name AS cliente_nome',
          'p.foto_perfil_url AS cliente_foto',
          'e.unidade_apto AS cliente_unidade',
          'pg.codigo_verificacao AS codigo_verificacao',
          'pg.status AS pagamento_status',
        ])
        .where('o.prestadorId = :prestadorId', { prestadorId: usuarioId })
        .orderBy('o.createdAt', 'DESC');

      const result = await query.getRawMany();

      // 🚀 SEGUNDA CAMADA DE BLINDAGEM: Força o mapeamento correto antes de dar o return para o Express
      return result.map((item: any) => ({
        ...item,
        totalSessoes: Number(item.totalSessoes ?? item.totalsessoes ?? (item.o_total_sessoes || 1)),
        sessoesConcluidas: Number(item.sessoesConcluidas ?? item.sessoesconcluidas ?? (item.o_sessoes_concluidas || 0))
      }));

    } catch (error: any) {
      console.error('ERRO NO QUERY BUILDER:', error.message);
      throw new Error('Erro ao buscar ofertas: ' + error.message);
    }
  },
};

export default ServicoOfertaService;