import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import type { AuthenticatedRequest, Role } from "./authMiddleware";

type TokenPayload = JwtPayload & {
  id?: string;
  usuarioId?: string;
};

/**
 * Permite visitantes SEM Authorization, mas não transforma JWT inválido
 * em visitante silenciosamente. Nunca confia em identidade do req.body.
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header("authorization");
  if (!authHeader) {
    next();
    return;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  const token = match?.[1];

  if (!token) {
    res.status(401).json({ success: false, message: "Autorização inválida." });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[CHAT AUTH] JWT_SECRET não configurado");
    res.status(503).json({ success: false, message: "Autenticação temporariamente indisponível." });
    return;
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") throw new Error("JWT_PAYLOAD_INVALID");
    const payload = decoded as TokenPayload;
    userId = String(payload.usuarioId || payload.id || "").trim();
    if (!userId) throw new Error("JWT_USER_ID_MISSING");
  } catch {
    res.status(401).json({ success: false, message: "Sessão inválida ou expirada." });
    return;
  }

  try {
    const user = await AppDataSource.getRepository(Usuario).findOne({
      where: { id: userId } as any,
      select: {
        id: true,
        name: true,
        tipo: true,
        condominio_id: true,
      } as any,
    });
    if (!user) {
      res.status(401).json({ success: false, message: "Usuário da sessão não encontrado." });
      return;
    }
    (req as AuthenticatedRequest).user = {
      id: user.id,
      usuarioId: user.id,
      name: String((user as any).name || ""),
      role: ((user as any).tipo as Role) || "MORADOR",
      condominio_id: String((user as any).condominio_id || ""),
    } as AuthenticatedRequest["user"];
    next();
  } catch (error) {
    console.error("[CHAT AUTH] Falha ao consultar usuário", error);
    res.status(503).json({ success: false, message: "Não foi possível validar a sessão." });
  }
}
