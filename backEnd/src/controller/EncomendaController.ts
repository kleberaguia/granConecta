import { Response } from 'express';
import { EncomendaService } from '../services/EncomendaService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

class EncomendaController {
  
  // 🟢 Trocamos Request por AuthRequest aqui
  async getMeusPacotes(req: AuthenticatedRequest, res: Response) {
    const service = new EncomendaService();

    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Agora o erro TS2339 desaparece!
    const { condominio_id, usuarioId } = req.user;

    try {
      const encomendas = await service.listByMorador(usuarioId, condominio_id);
      return res.json(encomendas);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async store(req: AuthenticatedRequest, res: Response) {
    const service = new EncomendaService();
    
    if (!req.user || !req.user.condominio_id) {
      return res.status(401).json({ message: "Dados de condomínio não encontrados." });
    }

    const { codigoRastreio, transportadora, morador_id, descricao } = req.body;

    try {
      const encomenda = await service.create({
        codigoRastreio,
        transportadora,
        morador_id,
        descricao,
        porteiro_id: req.user.usuarioId, 
        condominio_id: req.user.condominio_id
      });
      
      return res.status(201).json(encomenda);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async darBaixa(req: AuthenticatedRequest, res: Response) {
    const service = new EncomendaService();
    const { id } = req.params;
    const { quemRetirou } = req.body;

    if(!id) return res.status(400).json({ message: 'Id não encontrado' });

    try {
      const atualizado = await service.registrarRetirada(id, quemRetirou);
      return res.json(atualizado);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}


export default new EncomendaController();