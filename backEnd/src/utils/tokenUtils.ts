import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';



type JwtPayloadBase = {
  sub: string;         // id do usuário/autenticação
  role?: string;       // papel (ADMIN, MORADOR etc.)
  usuarioId?: string | null;
  condominio_id: string;
};


export function signAccessToken(payload: JwtPayloadBase) {
  const options: SignOptions = {
    expiresIn: '30d',
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function signRefreshToken(payload: JwtPayloadBase) {
  const options: SignOptions = {
    expiresIn: '30d',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

export async function hashPassword(senha: string) {
    return await bcrypt.hash(senha, 10);
}

export async function comparePassword(senha: string, hash: string) {
    return await bcrypt.compare(senha, hash);
}

export async function hashToken(token: string) {
    return await bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string | null | undefined) {
    if (!hash) return false;
    return await bcrypt.compare(token, hash);
}
