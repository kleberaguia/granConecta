// /src/controllers/SecaoController.ts
import { Request, Response } from 'express';
import { SecaoService } from '../services/SecaoService';
import { AppDataSource } from '../config/data-source';
import { Secao } from '../models/secaoModels';

const SecaoController = {
  async getHome(req: Request, res: Response) {
    try {
      const secoes = await SecaoService.getHomePageSections();

      // Retorna os dados no formato JSON
      return res.json(secoes);

    } catch (error) {
      console.error('Erro ao carregar a home page:', error);
      return res.status(500).json({ error: 'Erro interno do servidor ao carregar a página.' });
    }
  },

  async createSecao(req: Request, res: Response) {
    try {
      // Chama o Service que lida com a transação e o salvamento aninhado
      const novaSecao = await SecaoService.saveSecao(req.body);

      // Retorna o objeto recém-criado com status 201 (Created)
      return res.status(201).json(novaSecao);
    } catch (error) {
      console.error('Erro ao criar nova seção:', error);
      // Retorna um erro 500 se houver falha na transação ou no banco
      return res.status(500).json({
        message: 'Erro ao criar a seção. A transação foi revertida.',
        error: (error as Error).message
      });
    }
  },
  async updateSecao(req: Request, res: Response) {
    // O ID da seção a ser atualizada vem dos parâmetros da URL
    if (!req.params.id) return null
    const id = parseInt(req.params.id);
    const secaoData = req.body; // Os novos dados vêm do corpo da requisição

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID da seção inválido.' });
    }

    try {
      const secaoAtualizada = await SecaoService.updateSecao(id, secaoData);

      // Retorna a seção modificada
      return res.json(secaoAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar seção:', error);
      // Se o erro for 'Secao não encontrada', podemos retornar 404
      if ((error as Error).message.includes('não encontrada')) {
        return res.status(404).json({ message: (error as Error).message });
      }
      return res.status(500).json({
        message: 'Erro ao processar a atualização da seção.',
        error: (error as Error).message
      });
    }
  },

  async deleteSecao(req: Request, res: Response) {
    if (!req.params.id) return null
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID da seção inválido.' });
    }

    try {
      const secaoDelete = await SecaoService.deleteSecao(id);

      // Retorna a seção modificada
      return res.json(secaoDelete);
    } catch (error) {
      console.error('Erro deletar seção:', error);
      // Se o erro for 'Secao não encontrada', podemos retornar 404
      if ((error as Error).message.includes('não encontrada')) {
        return res.status(404).json({ message: (error as Error).message });
      }
      return res.status(500).json({
        message: 'Erro ao processar a deletar da seção.',
        error: (error as Error).message
      });
    }
  },

  async getSecaoById(req: Request, res: Response) {
    if (!req.params.id) {
      return res.status(400).json({ message: 'ID da seção não informado.' });
    }

    const id = parseInt(req.params.id);

    try {
      const secao = await SecaoService.getSecaoById(id);

      // Retorna a seção completa com os dados aninhados
      return res.json(secao);
    } catch (error) {
      console.error(`Erro ao buscar seção ID ${id}:`, error);

      // Se o erro for 'Seção não encontrada', retorna 404
      if ((error as Error).message.includes('não encontrada') || (error as Error).message.includes('inválido')) {
        return res.status(404).json({ message: (error as Error).message });
      }

      // Erro genérico
      return res.status(500).json({
        message: 'Erro interno do servidor ao buscar a seção.',
        error: (error as Error).message
      });
    }
  }

};

export default SecaoController