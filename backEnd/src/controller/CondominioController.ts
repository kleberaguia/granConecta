import { Request, Response } from 'express';
import CreateCondominioService from '../services/CreateCondominioService';
import { AppDataSource } from '../config/data-source';
import { Condominio } from '../models/condominiosModels';

export default class CondominioController {

  public async create(request: Request, response: Response): Promise<Response> {
    const createCondominio = new CreateCondominioService();
    const dados = request.body;

    try {
      // Verifica se é Array (Lote) ou Objeto (Único)
      if (Array.isArray(dados)) {
        const condominios = await createCondominio.executeBatch(dados);
        return response.status(201).json(condominios);
      } else {
        const condominio = await createCondominio.execute(dados);
        return response.status(201).json(condominio);
      }
    } catch (err: any) {
      return response.status(400).json({ error: err.message });
    }
  }

  async validarCodigo(req: Request, res: Response) {

    const createCondominio = new CreateCondominioService();
    try {

      const result = await createCondominio.validarCodigoParaUsuario(req.body.codigo, req.body.usuarioId);

      return res.status(201).json(result);
    } catch (error: any) {
      console.error("ERRO NO REGISTRO:", error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  public async getIdCondominio(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    // 1. Verificação de segurança (Type Guard)
    if (!id) {
      return response.status(400).json({ message: "O ID do condomínio é obrigatório." });
    }

    const condominioRepository = AppDataSource.getRepository(Condominio);

    // Agora o TypeScript sabe que 'id' não é undefined
    const condominio = await condominioRepository.findOneBy({ id });

    if (!condominio) {
      return response.status(404).json({ message: "Condomínio não encontrado." });
    }

    return response.json(condominio);
  }


  public async index(request: Request, response: Response): Promise<Response> {
    const condominioRepository = AppDataSource.getRepository(Condominio);
    const condominios = await condominioRepository.find({ order: { nome: 'ASC' } });
    return response.json(condominios);
  }
}