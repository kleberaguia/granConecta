import { Request, Response } from "express";
import AuthService from "../services/AuthService";


function obterMensagemErro(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro interno do servidor.";
}

export default {
  /**
   * LOGIN
   */
  async login(req: Request, res: Response) {
    try {
      const { email, senha, password } = req.body;

      const emailNormalizado = String(email || "")
        .trim()
        .toLowerCase();

      const senhaInformada = String(senha || password || "");

      if (!emailNormalizado || !senhaInformada) {
        return res.status(400).json({
          error: "Email e senha são obrigatórios.",
        });
      }

      const result = await AuthService.login({
        email: emailNormalizado,
        password: senhaInformada,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      const message = obterMensagemErro(error);

      console.error("Erro no login:", message);

      return res.status(400).json({
        error: message,
      });
    }
  },

  /**
   * CADASTRO
   */
  async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);

      return res.status(201).json(result);
    } catch (error: unknown) {
      const message = obterMensagemErro(error);

      console.error("Erro no registro:", message);

      return res.status(400).json({
        error: message,
      });
    }
  },

  /**
   * VERIFICAÇÃO DE E-MAIL
   */
  async verificarEmail(req: Request, res: Response) {
    try {
      const { email, codigo } = req.body;

      if (!email || !codigo) {
        return res.status(400).json({
          error: "E-mail e código são obrigatórios.",
        });
      }

      const result = await AuthService.verificarEmail({
        email: String(email).trim().toLowerCase(),
        codigo: String(codigo).trim(),
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({
        error: obterMensagemErro(error),
      });
    }
  },

  /**
   * ESQUECI A SENHA
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          error: "E-mail é obrigatório.",
        });
      }

      const result = await AuthService.forgotPassword(email);

      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({
        error: obterMensagemErro(error),
      });
    }
  },

  /**
   * REDEFINIÇÃO DE SENHA
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        return res.status(400).json({
          error: "Campos obrigatórios ausentes.",
        });
      }

      const result = await AuthService.resetPassword({
        email: String(email).trim().toLowerCase(),
        token: String(token).trim(),
        newPassword: String(newPassword),
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({
        error: obterMensagemErro(error),
      });
    }
  },

  /**
   * REENVIO DO CÓDIGO DE VERIFICAÇÃO
   */
  async reenviarCodigo(req: Request, res: Response) {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          error: "E-mail obrigatório.",
        });
      }

      const result = await AuthService.reenviarCodigo(email);

      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({
        error: obterMensagemErro(error),
      });
    }
  },

  /**
   * USUÁRIO AUTENTICADO
   *
   * Este endpoint deve responder mesmo quando a assinatura estiver vencida,
   * pois o frontend precisa saber por que o painel está bloqueado.
   */
  async getMe(req: Request, res: Response){
    try {
      const usuarioId =
        req.user?.usuarioId ||
        req.user?.id;

      if (!usuarioId) {
        return res.status(401).json({
          codigo: "NAO_AUTORIZADO",
          message: "Usuário não autenticado.",
        });
      }

      const dadosUsuario = await AuthService.getMe(usuarioId);

      return res.status(200).json(dadosUsuario);
    } catch (error: unknown) {
      const message = obterMensagemErro(error);

      console.error("Erro no AuthController.getMe:", message);

      if (
        message === "Usuário não encontrado" ||
        message === "Usuario não encontrado"
      ) {
        return res.status(404).json({
          codigo: "USUARIO_NAO_ENCONTRADO",
          message,
        });
      }

      return res.status(500).json({
        codigo: "ERRO_AO_BUSCAR_USUARIO",
        message: "Não foi possível carregar os dados do usuário.",
      });
    }
  },
};