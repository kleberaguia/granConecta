import { Request, Response } from "express";
import ContentService from "../services/ContentService";

class ContentController {
  // GET: Listar todos os conteúdos
  async getAll(req: Request, res: Response) {
    try {
      const contents = await ContentService.getAllContents();
      return res.json(contents);
    } catch (error) {
      console.error("Erro ao listar conteúdos:", error);
      return res.status(500).json({ message: "Erro interno ao listar conteúdos." });
    }
  }

  // GET: Buscar conteúdo por ID
  async getById(req: Request, res: Response) {
    const idParam =  req.params.id
    
    if (isNaN(Number(idParam))) {
      return res.status(400).json({ message: "ID inválido." });
    }    
    const id = Number(idParam)
    try {
      const content = await ContentService.getContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Conteúdo não encontrado." });
      }
      return res.json(content);
    } catch (error) {
      console.error(`Erro ao buscar conteúdo ID ${id}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar conteúdo." });
    }
  }

  // POST: Criar novo conteúdo
  async create(req: Request, res: Response) {
    try {
      const newContent = await ContentService.createContent(req.body);
      return res.status(201).json(newContent);
    } catch (error) {
      console.error("Erro ao criar conteúdo:", error);
      return res.status(500).json({ message: "Erro interno ao criar conteúdo." });
    }
  }

  // PUT: Atualizar conteúdo existente
  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const updatedContent = await ContentService.updateContent(id, req.body);
      if (!updatedContent) {
        return res.status(404).json({ message: "Conteúdo não encontrado." });
      }
      return res.json(updatedContent);
    } catch (error) {
      console.error("Erro ao atualizar conteúdo:", error);
      return res.status(500).json({ message: "Erro interno ao atualizar conteúdo." });
    }
  }

  // DELETE: Remover conteúdo
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const deleted = await ContentService.deleteContent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Conteúdo não encontrado." });
      }
      return res.json({ message: "Conteúdo removido com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar conteúdo:", error);
      return res.status(500).json({ message: "Erro interno ao deletar conteúdo." });
    }
  }

  // GET: Listar conteúdos de uma seção específica
  async getBySection(req: Request, res: Response) {
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId)) {
      return res.status(400).json({ message: "ID da seção inválido." });
    }

    try {
      const contents = await ContentService.getContentsBySection(sectionId);
      return res.json(contents);
    } catch (error) {
      console.error(`Erro ao buscar conteúdos da seção ${sectionId}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar conteúdos da seção." });
    }
  }
}

export default new ContentController();
