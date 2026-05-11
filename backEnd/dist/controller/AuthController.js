"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = __importDefault(require("../services/AuthService"));
exports.default = {
    // ✅ LOGIN (Agora retorna o usuarioId padronizado)
    async login(req, res) {
        try {
            const { email, senha, password } = req.body;
            const payloadLogin = {
                email,
                password: senha || password
            };
            if (!payloadLogin.email || !payloadLogin.password) {
                return res.status(400).json({ error: "Email e senha são obrigatórios." });
            }
            const result = await AuthService_1.default.login(payloadLogin);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // ✅ REGISTER (Refatorado para usar a Transaction que criamos)
    async register(req, res) {
        try {
            const result = await AuthService_1.default.register(req.body);
            return res.status(201).json(result);
        }
        catch (err) {
            console.error("ERRO NO REGISTRO:", err);
            return res.status(400).json({ error: err.message });
        }
    },
    // ✅ VERIFICAÇÃO DE EMAIL (2FA)
    async verificarEmail(req, res) {
        try {
            const { email, codigo } = req.body;
            const result = await AuthService_1.default.verificarEmail({ email, codigo });
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // ✅ ESQUECI A SENHA
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email?.trim()) {
                return res.status(400).json({ error: "E-mail é obrigatório." });
            }
            const result = await AuthService_1.default.forgotPassword(email);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // ✅ RESETAR SENHA
    async resetPassword(req, res) {
        try {
            const { email, token, newPassword } = req.body;
            if (!email || !token || !newPassword) {
                return res.status(400).json({ error: "Campos obrigatórios ausentes." });
            }
            const result = await AuthService_1.default.resetPassword({ email, token, newPassword });
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    // ✅ REENVIAR CÓDIGO
    async reenviarCodigo(req, res) {
        try {
            const { email } = req.body;
            if (!email)
                return res.status(400).json({ error: "E-mail obrigatório." });
            const result = await AuthService_1.default.reenviarCodigo(email);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    },
    async getMe(req, res) {
        try {
            // O usuarioId deve vir do seu middleware de autenticação (JWT)
            const usuarioId = req.user?.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ message: "Não autorizado" });
            }
            const dadosUsuario = await AuthService_1.default.getMe(usuarioId);
            return res.json(dadosUsuario);
        }
        catch (error) {
            console.error("Erro no AuthController (getMe):", error.message);
            return res.status(404).json({ message: error.message });
        }
    }
};
