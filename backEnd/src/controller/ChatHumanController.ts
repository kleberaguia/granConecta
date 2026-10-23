import type { Request, Response } from "express";
import ChatHumanService from "../services/chat/ChatHumanService";

export class ChatHumanController {
  async inbox(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const atendenteId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      const scopeRaw = String(
        req.query.scope || "TODAS",
      )
        .trim()
        .toUpperCase();

      const scope:
        | "TODAS"
        | "AGUARDANDO"
        | "MINHAS" =
        scopeRaw === "AGUARDANDO"
          ? "AGUARDANDO"
          : scopeRaw === "MINHAS"
            ? "MINHAS"
            : "TODAS";

      const canalRaw = String(
        req.query.canal || "TODOS",
      )
        .trim()
        .toUpperCase();

      const canal:
        | "TODOS"
        | "INSTAGRAM"
        | "WHATSAPP" =
        canalRaw === "INSTAGRAM"
          ? "INSTAGRAM"
          : canalRaw === "WHATSAPP"
            ? "WHATSAPP"
            : "TODOS";

      const contextoRaw = String(
        req.query.contexto || "TODOS",
      )
        .trim()
        .toUpperCase();

      const contexto:
        | "TODOS"
        | "LOJA"
        | "PRESTADOR" =
        contextoRaw === "LOJA"
          ? "LOJA"
          : contextoRaw === "PRESTADOR"
            ? "PRESTADOR"
            : "TODOS";

      const result =
        await ChatHumanService.inbox({
          userId:
            user?.id ||
            user?.usuarioId,

          role:
            user?.role ||
            user?.tipo,

          chatbotTipo:
            String(
              req.query.chatbotTipo || "",
            ).trim(),

          chatbotOwnerId:
            String(
              req.query.chatbotOwnerId || "",
            ).trim(),

          atendenteId,

          scope,
          canal,
          contexto,
        });

      res.status(200).json(result);
    } catch (error: any) {
      console.error(
        "[ChatHumanController.inbox]",
        error,
      );

      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao listar atendimentos.",
      });
    }
  }

  async messages(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const atendenteId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      if (!atendenteId) {
        res.status(401).json({
          success: false,
          message:
            "Atendente não identificado.",
        });

        return;
      }

      const conversationId =
        String(
          req.params.conversationId ||
          "",
        ).trim();

      const result =
        await ChatHumanService.messages(
          conversationId,
          atendenteId,
        );

      res.status(200).json(result);
    } catch (error: any) {
      console.error(
        "[ChatHumanController.messages]",
        error,
      );

      res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Erro ao listar mensagens.",
      });
    }
  }

  async take(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const atendenteId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      if (!atendenteId) {
        res.status(401).json({
          success: false,
          message:
            "Atendente não identificado.",
        });

        return;
      }

      const conversationId =
        String(
          req.params.conversationId ||
          "",
        ).trim();

      const result =
        await ChatHumanService.take(
          conversationId,
          atendenteId,
        );

      res.status(200).json(result);
    } catch (error: any) {
      console.error(
        "[ChatHumanController.take]",
        error,
      );

      const message =
        error?.message ||
        "Erro ao assumir atendimento.";

      const conflict =
        String(message)
          .toLowerCase()
          .includes(
            "outro atendente",
          );

      res
        .status(
          conflict ? 409 : 400,
        )
        .json({
          success: false,
          message,
        });
    }
  }

  async reply(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const atendenteId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      if (!atendenteId) {
        res.status(401).json({
          success: false,
          message:
            "Atendente não identificado.",
        });

        return;
      }

      const conversationId =
        String(
          req.params.conversationId ||
          "",
        ).trim();

      const message =
        String(
          req.body?.message ||
          "",
        ).trim();

      const result =
        await ChatHumanService.reply(
          conversationId,
          atendenteId,
          message,
        );

      res.status(201).json(result);
    } catch (error: any) {
      console.error(
        "[ChatHumanController.reply]",
        error,
      );

      const message =
        error?.message ||
        "Erro ao responder atendimento.";

      const conflict =
        String(message)
          .toLowerCase()
          .includes(
            "outro atendente",
          );

      res
        .status(
          conflict ? 409 : 400,
        )
        .json({
          success: false,
          message,
        });
    }
  }

  async finish(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const atendenteId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      if (!atendenteId) {
        res.status(401).json({
          success: false,
          message:
            "Atendente não identificado.",
        });

        return;
      }

      const conversationId =
        String(
          req.params.conversationId ||
          "",
        ).trim();

      const result =
        await ChatHumanService.finish(
          conversationId,
          atendenteId,
        );

      res.status(200).json(result);
    } catch (error: any) {
      console.error(
        "[ChatHumanController.finish]",
        error,
      );

      const message =
        error?.message ||
        "Erro ao finalizar atendimento.";

      const conflict =
        String(message)
          .toLowerCase()
          .includes(
            "outro atendente",
          );

      res
        .status(
          conflict ? 409 : 400,
        )
        .json({
          success: false,
          message,
        });
    }
  }

  async unreadCount(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const user = (req as any).user;

      const userId = String(
        user?.id ||
        user?.usuarioId ||
        "",
      ).trim();

      if (!userId) {
        res.status(200).json({
          count: 0,
        });

        return;
      }

      const count =
        await ChatHumanService
          .getUnreadCount(
            userId,
          );

      res.status(200).json({
        count,
      });
    } catch (error: any) {
      console.error(
        "[ChatHumanController.unreadCount]",
        error,
      );

      res.status(400).json({
        error:
          error?.message ||
          "Erro ao consultar atendimentos.",
      });
    }
  }
}