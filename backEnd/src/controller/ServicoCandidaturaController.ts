import { Request, Response } from 'express';
import ServicoCandidaturaService from '../services/ServicoCandidaturaService';

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

      const { solicitacaoId, mensagem, proposta_valor } = req.body;

      const saved = await ServicoCandidaturaService.candidatar({
        solicitacaoId,
        prestadorId: user.usuarioId,
        mensagem,
        proposta_valor,
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
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { candidaturaId, valor, mensagem } = req.body;

      if (!candidaturaId || !valor || !mensagem) {
        return res.status(400).json({
          error: 'candidaturaId, valor e mensagem são obrigatórios'
        });
      }

      const result = await ServicoCandidaturaService.enviarProposta({
        candidaturaId,
        usuarioId: user.usuarioId,
        valor,
        mensagem
      });

      return res.json(result);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
  }

  // ✅ ACEITAR A PROPOSTA
  async aceitarProposta(req: Request, res: Response) {
    try {
  
      const user = (req as any).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const { candidaturaId } = req.body;
      if (!candidaturaId) {
        return res.status(400).json({ error: 'candidaturaId é obrigatório' });
      }

      const result = await ServicoCandidaturaService.aceitarProposta(
        candidaturaId,
        user.usuarioId
      );

      return res.json(result);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message });
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
}

export default new ServicoCandidaturaController();