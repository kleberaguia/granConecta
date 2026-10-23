// src/services/ServicoCandidaturaService.ts

import { AppDataSource } from '../config/data-source';
import { ServicoCandidatura } from '../models/servicoCandidatura';
import { Usuario } from '../models/UserModels';
import { ServicoSolicitacao } from '../models/servicoSolicitacaoModels';
import { NotificationService } from './NotificationService';
import { ServicoOferta } from '../models/servicoOfertaModels';
import { Pagamento } from '../models/PagamentoModel';

const candRepo = AppDataSource.getRepository(ServicoCandidatura);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const solicitacaoRepo = AppDataSource.getRepository(ServicoSolicitacao);
const ofertaRepo = AppDataSource.getRepository(ServicoOferta);

const ServicoCandidaturaService = {

  async listarMinhas(prestadorId: string) {
    try {
      const sql = `
        SELECT 
        c.id AS id,
        c.status AS candidatura_status,
        c.valor_proposto AS valor_proposto,
        c.mensagem AS candidatura_mensagem,
        c.total_sessoes AS total_sessoes,
        c.solicitacaoId AS solicitacao_id,
        c.createdAt AS createdAt,
        s.id AS solicitacao_id_orig,
        s.titulo AS solicitacao_titulo,
        u.name AS morador_nome,
        pt.foto_perfil_url AS morador_foto,
        e.bloco_torre AS morador_bloco,
        e.unidade_apto AS morador_unidade,
        cond.nome AS condominio_nome
        FROM servico_candidatura c
        INNER JOIN servico_solicitacao s ON c.solicitacaoId = s.id
        INNER JOIN usuarios u ON s.usuarioId = u.id
        LEFT JOIN enderecos e ON u.id = e.usuarioId 
        LEFT JOIN perfil_prestador pt ON u.id = pt.usuarioId
        LEFT JOIN condominios cond ON u.condominio_id = cond.id
        WHERE c.prestadorId = ?
        ORDER BY c.createdAt DESC;
    `;

      const rows = await AppDataSource.query(sql, [prestadorId]);


      console.log('Rowssssssssss ', rows)

      return rows.map((row: any) => {
        const sId = row.solicitacao_id_orig;

        return {
          id: row.id,
          solicitacaoId: sId,
          status: row.candidatura_status,
          valor_proposto: row.valor_proposto,
          mensagem: row.candidatura_mensagem,
          total_sessoes: Number(row.total_sessoes ?? 1),
          createdAt: row.createdAt,

          solicitacao_titulo: row.solicitacao_titulo,

          solicitacao: {
            id: sId,
            titulo: row.solicitacao_titulo,

            morador: {
              nome: row.morador_nome,
              foto_perfil_url: row.morador_foto,
              bloco: row.morador_bloco,
              unidade: row.morador_unidade
            },

            condominio: {
              nome: row.condominio_nome
            }
          }
        };
      });

    } catch (error) {
      console.error("Erro no Service listarMinhas:", error);
      throw error;
    }
  },

  // ✅ PRESTADOR SE CANDIDATA
  async candidatar(data: {
    solicitacaoId: string;
    prestadorId: string;
    mensagem?: string;
    proposta_valor?: number;
    totalSessoes?: number;
  }) {

    const solicitacao = await solicitacaoRepo.findOne({
      where: { id: data.solicitacaoId }
    });

    if (!solicitacao) {
      throw new Error('SOLICITACAO_NAO_ENCONTRADA');
    }

    const jaCandidatado = await candRepo.findOne({
      where: {
        solicitacaoId: data.solicitacaoId,
        prestadorId: data.prestadorId
      }
    });

    if (jaCandidatado) {
      throw new Error('VOCE_JA_SE_CANDIDATOU');
    }

    const prestador = await usuarioRepo.findOne({
      where: { id: data.prestadorId }
    });

    if (!prestador || prestador.tipo !== 'PRESTADOR') {
      throw new Error('PRESTADOR_NAO_ENCONTRADO');
    }

    const totalSessoes = Number(data.totalSessoes ?? 1);

    console.log('TOTAL SESSOES RECEBIDO:', totalSessoes);

    const cand = candRepo.create({
      solicitacaoId: solicitacao.id,
      prestadorId: prestador.id,
      mensagem: data.mensagem || '',
      valor_proposto: data.proposta_valor ?? solicitacao.valor_sugerido ?? 0,
      status: 'PENDENTE',

      // 🚀 AGORA SALVA FISICAMENTE
      total_sessoes: totalSessoes
    } as any);

    console.log('CANDIDATURA ANTES DO SAVE:', cand);

    const saved = await candRepo.save(cand);

    console.log('CANDIDATURA SALVA:', saved);

    await NotificationService.enviar(
      solicitacao.usuarioId,
      'Nova candidatura recebida',
      `O prestador ${prestador.name} se candidatou ao serviço ${solicitacao.titulo}.`
    );

    solicitacao.status = 'CANDIDATOS';

    await solicitacaoRepo.save(solicitacao);

    return saved;
  },

  // ✅ LISTAR CANDIDATURAS POR SOLICITAÇÃO
  async listarPorSolicitacao(solicitacaoId: string) {

    return await candRepo
      .createQueryBuilder('candidatura')
      .leftJoinAndSelect('candidatura.solicitacao', 'solicitacao')
      .leftJoinAndSelect('candidatura.prestador', 'prestador')
      .where('candidatura.solicitacaoId = :solicitacaoId', {
        solicitacaoId
      })
      .orderBy('candidatura.createdAt', 'DESC')
      .getMany();
  },

  // ✅ PRESTADOR RETIRA CANDIDATURA
  async retirarCandidatura(
    candidaturaId: string,
    prestadorId: string
  ) {

    const c = await candRepo.findOne({
      where: { id: candidaturaId }
    });

    if (!c) {
      throw new Error('CANDIDATURA_NAO_ENCONTRADA');
    }

    if (c.prestadorId !== prestadorId) {
      throw new Error('SEM_PERMISSAO');
    }

    c.status = 'CANCELADA';

    return await candRepo.save(c);
  },

  // ✅ MORADOR OU PRESTADOR ENVIA PROPOSTA
  async enviarProposta(data: {
    candidaturaId: string;
    usuarioId: string;
    valor: number;
    mensagem: string;
    totalSessoes?: number;
  }) {

    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const candidatura = await queryRunner.manager.findOne(
        ServicoCandidatura,
        {
          where: { id: data.candidaturaId },
          relations: ['solicitacao']
        }
      );

      if (!candidatura) {
        throw new Error('CANDIDATURA_NAO_ENCONTRADA');
      }

      const isMorador =
        candidatura.solicitacao.usuarioId === data.usuarioId;

      await queryRunner.manager.query(
        `
          INSERT INTO servico_negociacao 
          (id, candidaturaId, usuarioId, valor, mensagem) 
          VALUES (UUID(), ?, ?, ?, ?)
        `,
        [
          data.candidaturaId,
          data.usuarioId,
          data.valor,
          data.mensagem
        ]
      );

      candidatura.valor_proposto = data.valor;
      candidatura.mensagem = data.mensagem;

      console.log('data.totalSessoessssssssssssssssssssss ', data.totalSessoes)
      candidatura.status = isMorador
        ? 'PROPOSTA_MORADOR'
        : 'PROPOSTA_PRESTADOR';

      // 🚀 NÃO DEIXA VIRAR 1 SEMPRE
      const isPrestador = candidatura.prestadorId === data.usuarioId;

      if (isPrestador && data.totalSessoes !== undefined) {
        (candidatura as any).total_sessoes = Number(data.totalSessoes);
      }

      await queryRunner.manager.save(candidatura);

      await queryRunner.commitTransaction();

      const destinatario = isMorador
        ? candidatura.prestadorId
        : candidatura.solicitacao.usuarioId;

      await NotificationService.enviar(
        destinatario,
        'Nova proposta recebida',
        `Nova proposta de valor: R$ ${data.valor}`
      );

      return candidatura;

    } catch (err) {

      await queryRunner.rollbackTransaction();

      throw err;

    } finally {

      await queryRunner.release();
    }
  },

  // ✅ RESPONDER CONTRAPROPOSTA
  async responderContraproposta(data: {
    candidaturaId: string;
    usuarioId: string;
    novoValor: number;
    mensagem: string;
    totalSessoes?: number;
  }) {

    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      await queryRunner.manager.query(
        `
          INSERT INTO servico_negociacao 
          (id, candidaturaId, usuarioId, valor, mensagem) 
          VALUES (UUID(), ?, ?, ?, ?)
        `,
        [
          data.candidaturaId,
          data.usuarioId,
          data.novoValor,
          data.mensagem
        ]
      );

      const sessoesDefinidas = Number(data.totalSessoes ?? 1);
      console.log('SESSOES DEFINIDAS:', sessoesDefinidas);

      await queryRunner.manager.update(ServicoCandidatura, data.candidaturaId,
        {
          valor_proposto: data.novoValor,
          mensagem: data.mensagem,
          status: 'PROPOSTA_MORADOR'
        } as any
      );

      await queryRunner.commitTransaction();

      return {
        success: true
      };

    } catch (err) {

      await queryRunner.rollbackTransaction();

      throw err;

    } finally {

      await queryRunner.release();
    }
  },

  // ✅ ACEITAR PROPOSTA
  async aceitarProposta(candidaturaId: string, usuarioId: string) {

    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {

        const candidatura =
          await transactionalEntityManager.findOne(
            ServicoCandidatura,
            {
              where: { id: candidaturaId },
              relations: ['solicitacao']
            }
          );

        if (!candidatura) {
          throw new Error('CANDIDATURA_NAO_ENCONTRADA');
        }

        console.log(
          'CANDIDATURA COMPLETA:',
          candidatura
        );

        console.log(
          'TOTAL SESSOES DA CANDIDATURA:',
          (candidatura as any).total_sessoes
        );

        // Normaliza os IDs porque, dependendo da origem do JWT/TypeORM,
        // um lado pode chegar com representação diferente apesar de ser o
        // mesmo usuário. O aceite final continua restrito ao dono da solicitação.
        const usuarioAtualId = String(usuarioId || '').trim();
        const moradorId = String(candidatura.solicitacao.usuarioId || '').trim();
        const prestadorId = String(candidatura.prestadorId || '').trim();

        const isMorador = moradorId === usuarioAtualId;
        const isPrestador = prestadorId === usuarioAtualId;

        console.log('[ACEITAR PROPOSTA] autorização', {
          candidaturaId,
          status: candidatura.status,
          usuarioAtualId,
          moradorId,
          prestadorId,
          isMorador,
          isPrestador
        });

        if (
          isPrestador &&
          candidatura.status === 'PROPOSTA_MORADOR'
        ) {

          candidatura.status = 'ACEITO_PRESTADOR';

          return await transactionalEntityManager.save(candidatura);
        }

        const statusPermitidos = [
          'PROPOSTA_PRESTADOR',
          'ACEITO_PRESTADOR',
          'PENDENTE'
        ];

        if (
          isMorador &&
          statusPermitidos.includes(candidatura.status)
        ) {

          candidatura.status = 'ACORDO_FECHADO';          

          await transactionalEntityManager.save(candidatura);
          await transactionalEntityManager.update(
            ServicoSolicitacao, candidatura.solicitacaoId,
            {
              status: 'FECHADO',
              prestadorId: candidatura.prestadorId,
              valor_final: Number(candidatura.valor_proposto) || 0
            }
          );

          await transactionalEntityManager
            .createQueryBuilder()
            .update(ServicoCandidatura)
            .set({
              status: 'ENCERRADA'
            })
            .where(
              "solicitacaoId = :solId AND id != :candId",
              {
                solId: candidatura.solicitacaoId,
                candId: candidaturaId
              }
            )
            .execute();

          // 🚀 AGORA VAI HERDAR CORRETAMENTE
          const totalSessoesAcordadas = Number((candidatura as any).total_sessoes ?? 1);

          console.log('TOTAL SESSOES ACORDADAS:', totalSessoesAcordadas);
          const novaOferta =  transactionalEntityManager.create(ServicoOferta,
              {
                solicitacaoId: candidatura.solicitacaoId,
                prestadorId: candidatura.prestadorId,
                usuarioId:candidatura.solicitacao.usuarioId,
                valor: Number(candidatura.valor_proposto),
                status: "PENDENTE",             
                total_sessoes: totalSessoesAcordadas,
                sessoes_concluidas: 0,
                agenda_liberada: false

              } as any
            );

          console.log('NOVA OFERTA:',novaOferta);
          const ofertaSalva = await transactionalEntityManager.save(novaOferta );

          const novoPagamento =
            transactionalEntityManager.create(
              Pagamento,
              {
                ofertaId: ofertaSalva.id,

                prestadorId: candidatura.prestadorId,

                moradorId:
                  candidatura.solicitacao.usuarioId,

                valor:
                  Number(candidatura.valor_proposto),

                status: "PENDENTE",

                status_liberacao: "RETIDO",

                codigo_verificacao:
                  Math.floor(
                    1000 + Math.random() * 9000
                  ).toString()
              }
            );

          await transactionalEntityManager.save(
            novoPagamento
          );

          return {
            status: 'ACORDO_FECHADO',
            ofertaId: ofertaSalva.id,
            pagamentoId: novoPagamento.id,
            codigoAcesso:
              novoPagamento.codigo_verificacao
          };
        }

        throw new Error('OPERACAO_NAO_PERMITIDA');
      }
    );
  },

  // ✅ RECUSAR PROPOSTA
  async recusarProposta(
    candidaturaId: string,
    usuarioId: string
  ) {

    const candidatura = await candRepo.findOne({
      where: { id: candidaturaId },
      relations: ['solicitacao']
    });

    if (!candidatura) {
      throw new Error('CANDIDATURA_NAO_ENCONTRADA');
    }

    const isMorador =
      candidatura.solicitacao.usuarioId === usuarioId;

    const isPrestador =
      candidatura.prestadorId === usuarioId;

    if (!isMorador && !isPrestador) {
      throw new Error('SEM_PERMISSAO');
    }

    candidatura.status = 'RECUSADA';

    const saved = await candRepo.save(candidatura);

    const destinatario = isMorador
      ? candidatura.prestadorId
      : candidatura.solicitacao.usuarioId;

    await NotificationService.enviar(
      destinatario,
      'Proposta recusada',
      'A proposta foi recusada.'
    );

    return saved;
  }
};

export default ServicoCandidaturaService;