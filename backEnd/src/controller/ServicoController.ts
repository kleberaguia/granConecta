// src/controller/ServicoController.ts
import { Request, Response } from "express";
import servicoService from "../services/servicosService";

type Role =
  | "MORADOR"
  | "SINDICO"
  | "ADMIN"
  | "PRESTADOR"
  | "EMPREENDEDOR"
  | "PORTARIA"
  | "VISITANTE";

interface RequestComUsuario extends Request {
  user?: {
    id: string;              // ✅ obrigatório pelo seu .d.ts
    usuarioId: string;       // ✅
    role?: Role;             // ✅ opcional igual no .d.ts
    condominio_id?: string;  // ✅ opcional igual no .d.ts
    plano?: "BASICO" | "INTERMEDIARIO" | "PREMIUM";
    email?: string;
    bloco?: string;
    unidade?: string;
  };
}

class ServicoController {
  async criar(req: Request, res: Response) {
    try {
      const user = (req as RequestComUsuario).user;
      if (!user?.usuarioId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const {
        categoria_slug,
        titulo,
        descricao,
        valor_sugerido,
        bloco,
        apartamento,
        observacoes,
      } = req.body;

      const servico = await servicoService.criarServico({
        usuarioId: user.usuarioId,
        categoria_slug,
        titulo,
        descricao,
        valor_sugerido,
        bloco,
        apartamento,
        observacoes,
      });

      return res.status(201).json(servico);
    } catch (err: any) {
      console.error(err);
      if (
        err.message === "MORADOR_NAO_ENCONTRADO" ||
        err.message === "USUARIO_NAO_E_MORADOR"
      ) {
        return res.status(400).json({ error: "Usuário não é morador ou não existe" });
      }
      return res.status(500).json({ error: "Erro ao criar serviço" });
    }
  }

  // async meusComoMorador(req: Request, res: Response) {
  //   try {
  //     const user = (req as RequestComUsuario).user;
  //     if (!user?.usuarioId) {
  //       return res.status(401).json({ error: "Não autenticado" });
  //     }

  //     const servicos = await servicoService.listarServicosDoMorador(user.usuarioId);
  //     return res.json(servicos);
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ error: "Erro ao listar serviços do morador" });
  //   }
  // }

  async disponiveis(req: Request, res: Response) {
    try {
      const { categoria_slug } = req.query;
      const servicos = await servicoService.listarServicosDisponiveis(
        categoria_slug ? String(categoria_slug) : undefined
      );
      return res.json(servicos);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao listar serviços disponíveis" });
    }
  }



  // async meusComoPrestador(req: Request, res: Response) {
  //   try {
  //     const user = (req as RequestComUsuario).user;
  //     if (!user?.usuarioId) {
  //       return res.status(401).json({ error: "Não autenticado" });
  //     }

  //     const servicos = await servicoService.listarServicosDoPrestador(user.usuarioId);
  //     return res.json(servicos);
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ error: "Erro ao listar serviços do prestador" });
  //   }
  // }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Id inválido" });
      }

      const servico = await servicoService.getById(id);
      if (!servico) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }

      return res.json(servico);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar serviço" });
    }
  }
}

export default new ServicoController();
