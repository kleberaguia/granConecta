"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const UserModels_1 = require("../models/UserModels");
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = async (req, res, next) => {
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
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = payload.usuarioId || payload.id;
        if (!userId) {
            res.status(401).json({ message: "Token inválido (sem id)." });
            return;
        }
        const userRepo = data_source_1.AppDataSource.getRepository(UserModels_1.Usuario);
        const user = await userRepo.findOne({
            where: { id: userId },
            select: { id: true, tipo: true, condominio_id: true },
        });
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado." });
            return;
        }
        const finalRole = user.tipo || "MORADOR";
        const condominioIdFinal = String(user.condominio_id || "");
        if (!condominioIdFinal && finalRole == "MORADOR") {
            res.status(401).json({ message: "Usuário sem condomínio vinculado." });
            return;
        }
        // ✅ cast apenas aqui, o Express continua feliz
        req.user = {
            id: user.id,
            usuarioId: user.id,
            role: finalRole,
            condominio_id: condominioIdFinal,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(401).json({ message: "Sua sessão expirou.", error: "token_expired" });
            return;
        }
        res.status(401).json({ message: "Token inválido ou malformado." });
    }
};
exports.authMiddleware = authMiddleware;
