import { Request, Response } from "express";// 🎯 Importa o Service, não os Repositórios
import ServicoSolicitacaoService from "../services/ServicoSolicitacaoService";

// A classe não precisa mais dos repositórios, pois eles estão no Service
export class ServicoSolicitacaoController {
  criar = async (req: Request, res: Response) => {
  const {
    titulo,
    descricao,
    categoriaId,
    valor_sugerido,
    condominio_id,
    metadata // 👈 ADICIONE ISSO
  } = req.body;

  const usuarioId = (req as any).user?.usuarioId;

  if (!usuarioId) {
    return res.status(401).json({ msg: "Usuário não autenticado." });
  }

  // if (!condominio_id) {
  //   return res.status(400).json({ msg: "ID do condomínio é obrigatório." });
  // }

   console.log('reqqqqqqqqqqqqqqqqq ', req)


  try {
    const novaSolicitacao = await ServicoSolicitacaoService.criarSolicitacao({
      titulo,
      descricao,
      categoriaId,
      usuarioId,
      valor_sugerido,
      condominio_id,
      metadata // 👈 PASSA PRO SERVICE
    });

    return res.status(201).json(novaSolicitacao);
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    return res.status(500).json({ msg: "Erro interno no servidor." });
  }
};
  minhasSolicitacoes = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.usuarioId ?? (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Não autenticado" });

      const page = Math.max(1, Number(req.query.page ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));

      // ✅ ideal: cache headers aqui ou globalmente em middleware
      res.set("Cache-Control", "no-store");

      const result = await ServicoSolicitacaoService.ListarMinhasSolicitacoesService(userId, { page, pageSize });

      // Se o seu service retorna { items, total, page, pageSize }:
      return res.status(200).json(result);

      // Se quiser retornar só array:
      // return res.status(200).json(result.items);
    } catch (e: any) {
      console.error("ERRO minhas-solicitacoes:", e);
      return res.status(500).json({
        error: "ERRO_MINHAS_SOLICITACOES",
        message: e?.message ?? "Erro interno",
      });
    }
  };

  listarTodas = async (req: Request, res: Response) => {
    try {
      // 🎯 Chama o Service para buscar
      const solicitacoes = await ServicoSolicitacaoService.listarTodas();

      return res.json(solicitacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Erro ao listar solicitações." });
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const solicitacao = await ServicoSolicitacaoService.buscarPorId(id);

      return res.json(solicitacao);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === "SOLICITACAO_NAO_ENCONTRADA") {
        return res.status(404).json({ msg: "Solicitação não encontrada." });
      }
      console.error(error);
      return res.status(500).json({ msg: "Erro ao buscar solicitação." });
    }
  };

  escolherPrestador = async (req: Request, res: Response) => {
    const usuarioId = (req as any).user?.usuarioId;
    const solicitacaoId = req.params.id;
    const { prestadorId, valor_final } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (!solicitacaoId) {
      // Embora a rota /:id devesse garantir isso, é um bom check
      return res.status(400).json({ msg: "ID da solicitação ausente na URL." });
    }

    try {
      const solicitacaoAtualizada = await ServicoSolicitacaoService.escolherPrestador(
        solicitacaoId,
        usuarioId,
        prestadorId,
        valor_final
      );

      return res.json({ msg: "Prestador escolhido com sucesso!", solicitacao: solicitacaoAtualizada });

    } catch (error) {
      const msg = (error as Error).message;
      if (msg === "SOLICITACAO_NAO_ENCONTRADA" || msg === "PRESTADOR_NAO_ENCONTRADO") {
        return res.status(404).json({ msg });
      }
      if (msg === "SEM_PERMISSAO") {
        return res.status(403).json({ msg: "Você não pode alterar esta solicitação." });
      }

      console.error(error);
      return res.status(500).json({ msg: "Erro ao escolher o prestador." });
    }
  };

  atualizarStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) return res.status(400).json({ msg: 'ID não informado' });

    try {
      const solicitacao = await ServicoSolicitacaoService.atualizarStatus(id, status);
      return res.json({ msg: "Status atualizado!", solicitacao });
    } catch (error: any) {
      if (error.message === "SOLICITACAO_NAO_ENCONTRADA") {
        return res.status(404).json({ msg: "Solicitação não encontrada." });
      }
      console.error(error);
      return res.status(500).json({ msg: "Erro ao atualizar status." });
    }
  };


  disponiveis = async (req: Request, res: Response) => {
    const { categoriaSlug } = req.query;

    try {
      const solicitacoes = await ServicoSolicitacaoService.listarDisponiveis(categoriaSlug as string | undefined);
      return res.json(solicitacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Erro ao buscar solicitações disponíveis." });
    }
  }

  atualizarProgresso = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { progresso } = req.body;

    if (progresso === undefined || progresso < 0 || progresso > 100) {
      return res.status(400).json({ msg: "Progresso deve ser um valor entre 0 e 100." });
    }

    try {
      if (!id) return res.status(400).json({ msg: "Id não encontrado" })
      const solicitacao = await ServicoSolicitacaoService.atualizarProgresso(id, Number(progresso));
      return res.json({ msg: "Progresso atualizado!", solicitacao });
    } catch (error: any) {
      const msg = error.message;
      if (msg === "SOLICITACAO_NAO_ENCONTRADA") {
        return res.status(404).json({ msg: "Solicitação não encontrada." });
      }
      console.error(error);
      return res.status(500).json({ msg: "Erro ao atualizar progresso." });
    }
  };

  getDashboardPrestador = async (req: Request, res: Response) => {
    // 1. Log de segurança para debugar no terminal
    const user = (req as any).user;
    const prestadorId = user?.usuarioId || user?.id;

    if (!prestadorId) {
      console.error("ERRO: PrestadorId não encontrado no objeto user!");
      return res.status(400).json({ msg: "ID do prestador ausente no token." }); // Mudamos para 400
    }

    try {
      const dados = await ServicoSolicitacaoService.getDashboardDados(prestadorId);
      return res.json(dados);
    } catch (error) {
      console.error("ERRO NO SERVICE:", error);
      return res.status(500).json({ msg: "Erro interno no servidor." });
    }
  };


  async listarMinhasSolicitacoes(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user?.usuarioId;// vindo do authMiddleware

      if (!usuarioId) return res.status(400).json('moradorId não esta no formato correto')


      const solicitacoes = await ServicoSolicitacaoService.ListarMinhasSolicitacoesService(usuarioId);

      return res.json(solicitacoes);
    } catch (error) {
      console.error('Erro listarMinhasSolicitacoes:', error);
      return res.status(500).json({
        message: 'Erro ao listar solicitações'
      });
    }
  }
}