import "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

export type Role =
  | "MORADOR"
  | "SINDICO"
  | "ADMIN"
  | "PRESTADOR"
  | "EMPREENDEDOR"
  | "PORTARIA"
  | "VISITANTE";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      usuarioId: string;
      role?: Role; // ✅ NUNCA string
      condominio_id?: string;
      plano?: "BASICO" | "INTERMEDIARIO" | "PREMIUM";
      email?: string;
      bloco?: string;
      unidade?: string;
    };
  }
}

export {};