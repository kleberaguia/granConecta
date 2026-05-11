"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminMiddleware = isAdminMiddleware;
function isAdminMiddleware(req, res, next) {
    const user = req.user; // payload do JWT, setado pelo authMiddleware
    if (!user) {
        return res.status(401).json({ error: "Não autenticado" });
    }
    if (user.role !== "ADMIN") {
        return res.status(403).json({ error: "Acesso restrito ao administrador" });
    }
    return next();
}
