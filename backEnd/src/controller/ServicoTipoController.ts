import { Request, Response } from "express";
import TipoServicoService from "../services/ServicoTipoService";

class TipoServicoController {
  
  // ✅ Busca os grupos para o combo do Registro
  async listAllGrupos(req: Request, res: Response) {
    try {
      const grupos = await TipoServicoService.listarGrupos();
      return res.json(grupos);
    } catch (err) {
      console.error("Erro ao listar grupos:", err);
      return res.status(500).json({ error: "Erro ao buscar grupos" });
    }
  }

  // ✅ Lista as categorias (usado no combo de especialidades)
  async listar(req: Request, res: Response) {
    try {
      const list = await TipoServicoService.listar();
      return res.json(list);
    } catch (err) {
      console.error("Erro ao listar tipos:", err);
      return res.status(500).json({ error: "Erro ao listar categorias" });
    }
  }

  // ✅ ÚNICO findOrCreate (Consolidado com grupo_id)
  async findOrCreate(req: Request, res: Response) {
    try {
      const { name, tipo, grupo_id, storeId } = req.body;

      if (!name || !tipo) {
        return res.status(400).json({ error: "Nome e Tipo são obrigatórios" });
      }

      // Chama o service enviando o grupo_id para salvar no lugar certo
      const categoria = await TipoServicoService.findOrCreate({ 
        name, 
        tipo, 
        grupo_id: grupo_id ? Number(grupo_id) : null, // Garante que é número
        storeId: storeId || null 
      });

      return res.status(200).json(categoria);
    } catch (error) {
      console.error("Erro ao processar categoria:", error);
      return res.status(500).json({ error: "Erro interno ao processar categoria" });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { nome, descricao } = req.body;
      if (!nome) return res.status(400).json({ error: "Nome obrigatório" });
      const t = await TipoServicoService.criar({ nome, descricao });
      return res.status(201).json(t);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao criar tipo" });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if(!id) return res.status(400).json('Id não encontrado')
      const updated = await TipoServicoService.atualizar(id, req.body);
      if (!updated) return res.status(404).json({ error: "Tipo não encontrado" });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar" });
    }
  }

  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Convertemos para number se o seu ID da Category for number
      const ok = await TipoServicoService.excluir(Number(id));
      return res.json({ ok });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao excluir" });
    }
  }
}

// Exporta a instância para usar nas rotas
export default new TipoServicoController();