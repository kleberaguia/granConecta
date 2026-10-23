import { Request, Response } from 'express';
import ServicoCandidaturaService from '../services/ServicoCandidaturaService';
import PagamentoService from "../services/PagamentoService"; //
import { AppDataSource } from '../config/data-source';
import { ServicoNegociacao } from '../models/servicoNegociacaoModels';

class ServicoCandidaturaController {

  // ✅ NOVO: LISTAR CANDIDATURAS DO PRESTADOR LOGADO
  async listarMinhas(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Chama o Service seguindo o seu padrão
      const list = await ServicoCandidaturaService.listarMinhas(user.usuarioId);

      return res.json(list);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Erro ao listar candidaturas' });
    }
  }

  // ✅ PRESTADOR SE CANDIDATA
  async candidatar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { solicitacaoId, mensagem, proposta_valor, totalSessoes } = req.body;

      const saved = await ServicoCandidaturaService.candidatar({
        solicitacaoId,
        prestadorId: user.usuarioId,
        mensagem,
        proposta_valor,
        totalSessoes: Number(totalSessoes)
      });

      return res.status(201).json(saved);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }

  // ✅ LISTAR CANDIDATURAS POR SOLICITAÇÃO (Visão do Morador)
  async listarPorSolicitacao(req: Request, res: Response) {
    try {
      const { solicitacaoId } = req.params;

      if (!solicitacaoId) {
        return res.status(400).json({ error: 'solicitacaoId é obrigatório' });
      }

      const list = await ServicoCandidaturaService.listarPorSolicitacao(solicitacaoId);
      return res.json(list);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao listar candidaturas' });
    }
  }

  // ✅ PRESTADOR RETIRA CANDIDATURA
  async retirar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { candidaturaId } = req.params;
      if (!candidaturaId) {
        return res.status(400).json({ error: 'candidaturaId é obrigatório' });
      }

      const updated = await ServicoCandidaturaService.retirarCandidatura(
        candidaturaId,
        user.usuarioId
      );

      return res.json(updated);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }



  // ✅ MORADOR OU PRESTADOR ENVIA PROPOSTA (NEGOCIAÇÃO)
  async enviarProposta(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      // Verifique se o seu token usa 'usuarioId' ou 'id'
      // Com base no seu histórico, você padronizou para 'usuarioId'
      const idDoUsuarioLogado = user?.usuarioId || user?.id;

      if (!idDoUsuarioLogado) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // 1. Pegamos o ID da candidatura pela URL (req.params)
      const { id } = req.params;

      // 2. Pegamos os dados do corpo (ajustando nomes para bater com o Front)
      // O Front envia 'novoValor', o Service espera 'valor'
      const { novoValor, valor, mensagem, totalSessoes } = req.body;
      const valorFinal = novoValor || valor; // Aceita qualquer um dos dois para não quebrar

      if (!id || !valorFinal || !mensagem) {
        return res.status(400).json({
          error: 'candidaturaId (na URL), valor e mensagem são obrigatórios'
        });
      }

      // Chama o Service passando os dados mapeados
      const result = await ServicoCandidaturaService.enviarProposta({
        candidaturaId: id, // ID que veio da URL
        usuarioId: idDoUsuarioLogado,
        valor: Number(valorFinal),
        mensagem,
        totalSessoes
      });

      return res.json(result);
    } catch (err: any) {
      console.error("Erro no Controller enviarProposta:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  // ✅ ACEITAR A PROPOSTA
  async aceitarProposta(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const usuarioId = user?.usuarioId || user?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { candidaturaId } = req.body;

      if (!candidaturaId) {
        return res.status(400).json({
          error: 'candidaturaId é obrigatório no corpo da requisição'
        });
      }

      // O Service é a fonte única da regra de negócio:
      // - prestador pode aceitar contraproposta do morador;
      // - morador pode aceitar diretamente qualquer candidatura válida;
      // - ao fechar, cria a ServicoOferta real com o último valor negociado;
      // - encerra as demais candidaturas;
      // - cria o registro de pagamento ligado à oferta correta.
      const resultado: any = await ServicoCandidaturaService.aceitarProposta(
        candidaturaId,
        usuarioId
      );

      // Quando o prestador aceita uma contraproposta, ainda não há oferta/pagamento:
      // o morador continua responsável pelo fechamento definitivo.
      if (resultado?.status === 'ACEITO_PRESTADOR' || !resultado?.ofertaId) {
        return res.status(200).json({
          success: true,
          status: resultado?.status || 'ACEITO_PRESTADOR',
          message:
            'Proposta aceita pelo prestador com sucesso! Aguardando o fechamento do morador.'
        });
      }

      // O Service já criou a oferta real. Agora usamos exatamente esse ofertaId
      // para gerar/reutilizar o checkout Mercado Pago.
      const pagamento: any = await PagamentoService.criarPagamentoPorOferta(
        resultado.ofertaId,
        usuarioId
      );

      const linkPagamento =
        pagamento?.link_pagamento ||
        pagamento?.mercadoPago?.init_point ||
        pagamento?.qr_code ||
        null;

      return res.status(200).json({
        success: true,
        status: resultado.status || 'ACORDO_FECHADO',
        ofertaId: resultado.ofertaId,
        pagamentoId: pagamento?.id || resultado.pagamentoId || null,
        codigoAcesso: resultado.codigoAcesso || pagamento?.codigo_verificacao || null,
        link_pagamento: linkPagamento
      });

    } catch (error: any) {
      console.error('Erro no aceitarProposta:', error);

      const message = error?.message || 'Erro ao processar aceitação da proposta';

      if (message === 'CANDIDATURA_NAO_ENCONTRADA') {
        return res.status(404).json({ error: message });
      }

      if (message === 'OPERACAO_NAO_PERMITIDA' || message === 'SEM_PERMISSAO') {
        return res.status(400).json({ error: message });
      }

      return res.status(500).json({ error: message });
    }
  }


  // ✅ RECUSAR A PROPOSTA
  async recusarProposta(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { candidaturaId } = req.body;
      if (!candidaturaId) {
        return res.status(400).json({ error: 'candidaturaId é obrigatório' });
      }

      const result = await ServicoCandidaturaService.recusarProposta(
        candidaturaId,
        user.usuarioId
      );

      return res.json(result);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
  }


  async getHistoricoMensagens(req: Request, res: Response) {
    try {
      const { candidaturaId } = req.params;

      if (!candidaturaId) {
        return res.status(400).json({ message: 'O ID da candidatura é obrigatório.' });
      }

      // Buscando o histórico na tabela servico_negociacao
      const historico = await AppDataSource.getRepository(ServicoNegociacao).find({
        where: { candidaturaId: candidaturaId },
        select: {
          id: true,
          mensagem: true,
          createdAt: true,
          // usuarioId: true // Opcional: útil se quiser identificar quem mandou (prestador ou cliente)
        },
        order: {
          createdAt: 'ASC' // 'ASC' para ordem cronológica (chat), ou 'DESC' para a mais recente primeiro
        }
      });

      return res.status(200).json(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico de mensagens:', error);
      return res.status(500).json({ message: 'Erro interno ao carregar o histórico.' });
    }
  };

  async buscarTotalSessoesCandidatura(req: Request, res: Response) {
    try {
      const { candidaturaId } = req.params;

      if (!candidaturaId) {
        return res.status(400).json({ error: "candidaturaId é obrigatório." });
      }

      const result = await AppDataSource.query(
        `
      SELECT 
        id,
        total_sessoes
      FROM servico_candidatura
      WHERE id = ?
      LIMIT 1
      `,
        [candidaturaId]
      );

      if (!result.length) {
        return res.status(404).json({ error: "Candidatura não encontrada." });
      }

      return res.json({
        candidaturaId: result[0].id,
        total_sessoes: Number(result[0].total_sessoes || 1),
      });
    } catch (error) {
      console.error("Erro ao buscar total de sessões:", error);
      return res.status(500).json({ error: "Erro ao buscar total de sessões." });
    }
  }
}

export default new ServicoCandidaturaController();