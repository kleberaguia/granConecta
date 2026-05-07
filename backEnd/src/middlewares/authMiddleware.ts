import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";

export type Role =
  | "MORADOR"
  | "SINDICO"
  | "ADMIN"
  | "PRESTADOR"
  | "EMPREENDEDOR"
  | "PORTARIA"
  | "VISITANTE";

interface TokenPayload {
  id?: string;
  usuarioId?: string;
  condominio_id?: string;
  iat: number;
  exp: number;
}

export type AuthenticatedRequest = Request & {
  user?: {
    usuarioId: string;
    id: string;
    role: Role;
    condominio_id: string;
    plano?: "BASICO" | "INTERMEDIARIO" | "PREMIUM";
  };
};

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(400).json({ message: "Token não fornecido." });
    return;
  }

  try {
    if (!JWT_SECRET) {
      res.status(500).json({ message: "Configuração inválida do servidor (JWT_SECRET ausente)." });
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const userId = payload.usuarioId || payload.id;

    if (!userId) {
      res.status(401).json({ message: "Token inválido (sem id)." });
      return;
    }

    const userRepo = AppDataSource.getRepository(Usuario);
    const user = await userRepo.findOne({
      where: { id: userId } as any,
      select: { id: true, tipo: true, condominio_id: true } as any,
    });

    if (!user) {
      res.status(401).json({ message: "Usuário não encontrado." });
      return;
    }

    const finalRole: Role = ((user as any).tipo as Role) || "MORADOR";
    const condominioIdFinal = String((user as any).condominio_id || "");

    if (!condominioIdFinal && finalRole == "MORADOR") {
      res.status(401).json({ message: "Usuário sem condomínio vinculado." });
      return;
    }

    // ✅ cast apenas aqui, o Express continua feliz
    (req as AuthenticatedRequest).user = {
      id: user.id,
      usuarioId: user.id,
      role: finalRole,
      condominio_id: condominioIdFinal,
    };

    next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: "Sua sessão expirou.", error: "token_expired" });
      return;
    }
    res.status(401).json({ message: "Token inválido ou malformado." });
  }
};