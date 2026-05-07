// src/controller/ServicoAdminController.ts

import { Request, Response } from "express";
import servicoService from "../services/servicosService"; // Ajuste o nome do arquivo se for 'servicosService'

class ServicoAdminController {

  // GET /admin/servicos
  async listar(req: Request, res: Response) {
    try {
      const {
        status,
        usuarioId,
        prestadorId,
        categoria_slug,
        dataInicio,
        dataFim,
      } = req.query;

      // Monta o objeto de filtros
      // Tipamos como 'any' ou definimos interface simples para não precisar importar Enum de outro arquivo
      const filtros: {
        status?: string;
        usuarioId?: string;
        prestadorId?: string;
        categoria_slug?: string;
        dataInicio?: string;
        dataFim?: string;
      } = {};

      if (status) {
        filtros.status = String(status);
      }
      if (usuarioId) {
        filtros.usuarioId = String(usuarioId);
      }
      if (prestadorId) {
        filtros.prestadorId = String(prestadorId);
      }
      if (categoria_slug) {
        filtros.categoria_slug = String(categoria_slug);
      }
      if (dataInicio) {
        filtros.dataInicio = String(dataInicio);
      }
      if (dataFim) {
        filtros.dataFim = String(dataFim);
      }

      // Chama o método do service que criamos anteriormente
      const servicos = await servicoService.listarTodosServicosAdmin(filtros);

      return res.json(servicos);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao listar serviços (admin)" });
    }
  }

  // GET /admin/servicos/:id
  async detalhe(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Id é obrigatório" });
      }

      const servico = await servicoService.getServicoDetalheAdmin(id);

      if (!servico) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      return res.json(servico);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar serviço (admin)" });
    }
  }
  async listarPrestadoresPendentes(req: Request, res: Response) {
    try {
      const prestadores = await servicoService.listarPrestadoresPendentes();
      return res.json(prestadores);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao listar prestadores" });
    }
  }

  // ✅ Buscar perfil completo de um prestador
  async buscarPrestador(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if(!id) return res.status(400).json("Id não fornecido")
      const prestador = await servicoService.buscarPrestadorPorId(id);

      if (!prestador) {
        return res.status(404).json({ error: "Prestador não encontrado" });
      }

      return res.json(prestador);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar prestador" });
    }
  }

  // ✅ Aprovar prestador
  async aprovarPrestador(req: Request, res: Response) {
    try {
      const { id } = req.params;
       if(!id) return res.status(400).json('Id não encontrado')
      const prestador = await servicoService.aprovarPrestador(id);

      return res.json({ message: "Prestador aprovado com sucesso", prestador });
    } catch (err: any) {
      console.error(err);

      if (err.message === "PRESTADOR_NAO_ENCONTRADO") {
        return res.status(404).json({ error: "Prestador não encontrado" });
      }

      return res.status(500).json({ error: "Erro ao aprovar prestador" });
    }
  }

  // ✅ Reprovar prestador (opcional)
  async reprovarPrestador(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if(!id) return res.status(400).json('Id não encontrado')
      const prestador = await servicoService.reprovarPrestador(id);
      return res.json({ message: "Prestador reprovado", prestador });
    } catch (err: any) {
      console.error(err);

      if (err.message === "PRESTADOR_NAO_ENCONTRADO") {
        return res.status(404).json({ error: "Prestador não encontrado" });
      }

      return res.status(500).json({ error: "Erro ao reprovar prestador" });
    }
  }
}

export default new ServicoAdminController();