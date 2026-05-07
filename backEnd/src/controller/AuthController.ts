import { Request, Response } from "express";
import AuthService from "../services/AuthService";
import UserService from "../services/UserService"; // Importamos o novo UserService

export default {
  // ✅ LOGIN (Agora retorna o usuarioId padronizado)
  async login(req: Request, res: Response) {
    try {
      const { email, senha, password } = req.body;
      const payloadLogin = {
        email,
        password: senha || password
      };

      if (!payloadLogin.email || !payloadLogin.password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
      }

      const result = await AuthService.login(payloadLogin);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ REGISTER (Refatorado para usar a Transaction que criamos)
  async register(req: Request, res: Response) {
    try {

      const result = await AuthService.register(req.body);

      
      return res.status(201).json(result);
    } catch (err: any) {
      console.error("ERRO NO REGISTRO:", err);
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ VERIFICAÇÃO DE EMAIL (2FA)
  async verificarEmail(req: Request, res: Response) {
    try {
      const { email, codigo } = req.body;
      const result = await AuthService.verificarEmail({ email, codigo });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ ESQUECI A SENHA
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email?.trim()) {
        return res.status(400).json({ error: "E-mail é obrigatório." });
      }

      const result = await AuthService.forgotPassword(email);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ RESETAR SENHA
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes." });
      }

      const result = await AuthService.resetPassword({ email, token, newPassword });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // ✅ REENVIAR CÓDIGO
  async reenviarCodigo(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "E-mail obrigatório." });

      const result = await AuthService.reenviarCodigo(email);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  async getMe(req: Request, res: Response) {
    try {

      // O usuarioId deve vir do seu middleware de autenticação (JWT)
    const usuarioId = (req as any).user?.usuarioId;

      
      if (!usuarioId) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const dadosUsuario = await AuthService.getMe(usuarioId);

      return res.json(dadosUsuario);
    } catch (error: any) {
      console.error("Erro no AuthController (getMe):", error.message);
      return res.status(404).json({ message: error.message });
    }
  }

};