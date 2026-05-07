import { Request, Response } from 'express';
import ServicoOfertaService from '../services/ServicoOfertaService';

class ServicoOfertaController {
  async criarPorCandidatura(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });

      const { candidaturaId, valor_negociado } = req.body;
      const oferta = await ServicoOfertaService.criarOfertaPorCandidatura(
        candidaturaId,
        user.usuarioId,
        valor_negociado
      );
      return res.status(201).json(oferta);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }

  async aceitar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });

      const { ofertaId } = req.params;
      if (!ofertaId) return res.status(400).json({ error: 'ofertaId obrigatório' });

      const oferta = await ServicoOfertaService.aceitarOferta(ofertaId, user.usuarioId);
      return res.json(oferta);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }

  async iniciar(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });

      const { ofertaId } = req.params;
      if (!ofertaId) return res.status(400).json({ error: 'ofertaId obrigatório' });

      const oferta = await ServicoOfertaService.marcarEmAndamento(ofertaId, user.usuarioId);
      return res.json(oferta);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }

  async concluir(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });

      const { ofertaId } = req.params;
      if (!ofertaId) return res.status(400).json({ error: 'ofertaId obrigatório' });

      const resultado = await ServicoOfertaService.concluirOferta(ofertaId, user.usuarioId);
      return res.json(resultado);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ error: err.message || 'Erro' });
    }
  }

  async listarPorPrestador(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });
      const list = await ServicoOfertaService.listarPorPrestador(user.usuarioId);
      return res.json(list);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro' });
    }
  }

  async listarMinhasOfertas(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      // No seu padrão, o ID do prestador vem de user.usuarioId
      if (!user?.usuarioId) return res.status(401).json({ error: 'Não autenticado' });

      // Chamamos o novo método do Service que faz o INNER JOIN
      const list = await ServicoOfertaService.listarMinhasOfertas(user.usuarioId);
      return res.json(list);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao listar ofertas detalhadas' });
    }
  }
}

export default new ServicoOfertaController();
