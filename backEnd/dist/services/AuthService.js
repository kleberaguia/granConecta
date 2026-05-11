"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const data_source_1 = require("../config/data-source");
const UserModels_1 = require("../models/UserModels");
const UsuarioAuthModels_1 = require("../models/UsuarioAuthModels");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const EmailService_1 = require("./EmailService");
const EnderecoModel_1 = require("../models/EnderecoModel");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const StoreModels_1 = require("../models/StoreModels");
const enums_1 = require("../models/enums");
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura";
function gerarCodigo6Digitos() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Busca os dados essenciais do usuário e suas relações básicas
 */
async function getUserLiteById(usuarioId) {
    return await data_source_1.AppDataSource.getRepository(UserModels_1.Usuario)
        .createQueryBuilder("u")
        .leftJoinAndSelect("u.endereco", "endereco")
        .leftJoinAndSelect("u.perfil", "perfil") // Verifique se na sua Entity o nome é 'perfil' ou 'perfis'
        .leftJoinAndSelect("u.store", "store")
        .where("u.id = :id", { id: usuarioId })
        .getOne();
}
exports.AuthService = {
    // =================================================================
    // ✅ 1. LOGIN
    // =================================================================
    async login({ email, password }) {
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const usuarioAuth = await authRepo.findOne({
            where: { email },
            select: ["id", "email", "password_hash", "role", "isActive", "emailVerificado", "usuarioId"],
        });
        if (!usuarioAuth?.usuarioId) {
            throw new Error("E-mail ou senha inválidos.");
        }
        const senhaBate = await (0, bcryptjs_1.compare)(password, usuarioAuth.password_hash);
        if (!senhaBate)
            throw new Error("E-mail ou senha inválidos.");
        const usuario = await getUserLiteById(usuarioAuth.usuarioId);
        if (!usuario)
            throw new Error("Usuário não encontrado.");
        if (usuario.status_conta === enums_1.UserStatus.REJEITADO) {
            throw new Error("Seu cadastro foi rejeitado.");
        }
        const token = (0, jsonwebtoken_1.sign)({
            usuarioId: usuario.id,
            role: usuarioAuth.role,
            tipo: usuario.tipo,
        }, JWT_SECRET, { expiresIn: "7d" });
        const perfilRaw = usuario.perfil;
        const perfisApp = perfilRaw ? [{
                id: perfilRaw.id,
                status: perfilRaw.status_aprovacao,
                status_aprovacao: perfilRaw.status_aprovacao,
                plano: perfilRaw.plano,
                payment_status: perfilRaw.payment_status || perfilRaw.status_aprovacao,
                checkout_url: perfilRaw.checkout_url || null,
                checkout_expira_em: perfilRaw.checkout_expira_em || null
            }] : [];
        return {
            token,
            user: {
                id: usuario.id,
                usuarioId: usuario.id,
                name: usuario.name,
                email: usuarioAuth.email,
                tipo: usuario.tipo,
                status_conta: usuario.status_conta,
                is_empreendedor: usuario.is_empreendedor,
                is_prestador: usuario.is_prestador,
                telefone: usuario.telefone,
                emailVerificado: usuarioAuth.emailVerificado,
                lojaId: usuario.store?.id || null,
                slug: usuario.store?.slug || null,
                // Dados de Endereço (extraídos com segurança)
                bloco: usuario.endereco?.bloco_torre ?? null,
                unidade: usuario.endereco?.unidade_apto ?? null,
                condominio_id: usuario.condominio_id,
                // Array de perfis essencial para o Front-end
                perfis: perfisApp,
                plano: perfilRaw?.plano || "basico",
            },
        };
    },
    // =================================================================
    // ✅ 2. REGISTER (COM TRANSAÇÃO)
    // =================================================================
    async register(data) {
        const { email, name, tipo, categoriaid, condominio_id } = data;
        const password = data.password || data.senha;
        if (!email || !password)
            throw new Error("E-mail e senha são obrigatórios!");
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const emailExistente = await authRepo.findOne({ where: { email } });
        if (emailExistente)
            throw new Error("E-mail já cadastrado!");
        // Normalização dos booleanos
        const isEmpreendedor = data.is_empreendedor === true || data.is_empreendedor === 'true';
        const isPrestador = data.is_prestador === true || data.is_prestador === 'true' || tipo === "PRESTADOR";
        const codigoVerificacao = gerarCodigo6Digitos();
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            // 1. Criar o Usuário
            const novoUsuario = manager.create(UserModels_1.Usuario, {
                name,
                email,
                telefone: data.telefone,
                tipo,
                condominio_id: condominio_id || null,
                is_empreendedor: isEmpreendedor,
                is_prestador: isPrestador,
                is_interno: data.origem !== "EXTERNO",
                status_conta: tipo === "MORADOR" ? enums_1.UserStatus.APROVADO : enums_1.UserStatus.PENDENTE,
                categoriaid: categoriaid || null
            });
            const usuarioSalvo = await manager.save(novoUsuario);
            // 2. Criar Endereço
            const novoEndereco = manager.create(EnderecoModel_1.Endereco, {
                usuarioId: usuarioSalvo.id,
                condominio_id: condominio_id || null,
                bloco_torre: data.bloco || null,
                unidade_apto: data.unidade || null,
                logradouro: data.logradouro || data.endereco_externo || null,
                numero: data.numero || null,
            });
            await manager.save(novoEndereco);
            console.log("tipo recebido:", tipo);
            console.log("is_prestador recebido:", data.is_prestador);
            console.log("isPrestador final:", isPrestador);
            console.log("isEmpreendedor final:", isEmpreendedor);
            // 3. Criar Perfil de Prestador/Empreendedor
            if (isPrestador || isEmpreendedor) {
                const novoPerfil = manager.create(PerfilPrestadorModel_1.PerfilPrestador, {
                    usuarioId: usuarioSalvo.id,
                    nome_profissional: name,
                    tipo: "PRESTADOR",
                    status_aprovacao: "PENDENTE",
                    tipo_assinatura: data.tipo_assinatura || "MENSAL",
                    plano: data.plano || "basico",
                    categoriaid: categoriaid || null,
                });
                await manager.save(novoPerfil);
            }
            if (isEmpreendedor) {
                const novaLoja = manager.create(StoreModels_1.Store, {
                    usuarioId: usuarioSalvo.id,
                    nome_loja: `Loja de ${name}`,
                    name: name,
                    slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${usuarioSalvo.id.substring(0, 4)}`,
                    ativa: true,
                    categoriaid: (categoriaid && categoriaid !== 'OUTRO') ? categoriaid : null,
                });
                await manager.save(novaLoja);
            }
            const passwordHash = await (0, bcryptjs_1.hash)(password, 8);
            const novoAuth = manager.create(UsuarioAuthModels_1.UsuarioAuth, {
                email,
                password_hash: passwordHash,
                usuarioId: usuarioSalvo.id,
                role: tipo,
                codigoVerificacao,
            });
            await manager.save(novoAuth);
            EmailService_1.EmailService.send(email, "Verificação GranConecta", `Seu código é: ${codigoVerificacao}`).catch(console.error);
            const token = (0, jsonwebtoken_1.sign)({ usuarioId: usuarioSalvo.id }, JWT_SECRET, { expiresIn: "1d" });
            return {
                token,
                usuarioId: usuarioSalvo.id,
                user: {
                    id: usuarioSalvo.id,
                    usuarioId: usuarioSalvo.id,
                    name,
                    email,
                    tipo
                }
            };
        });
    },
    // =================================================================
    // ✅ 3. VERIFICAR EMAIL
    // =================================================================
    async verificarEmail(data) {
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const usuarioAuth = await authRepo.findOne({
            where: { email: data.email },
            select: ["id", "email", "usuarioId", "codigoVerificacao", "emailVerificado", "role"],
        });
        if (!usuarioAuth?.usuarioId)
            throw new Error("Usuário não encontrado.");
        if (usuarioAuth.codigoVerificacao !== data.codigo)
            throw new Error("Código inválido.");
        await authRepo.update(usuarioAuth.id, {
            emailVerificado: true,
            codigoVerificacao: null,
        });
        const usuario = await getUserLiteById(usuarioAuth.usuarioId);
        if (!usuario)
            throw new Error("Usuário não encontrado no banco.");
        const token = (0, jsonwebtoken_1.sign)({ usuarioId: usuario.id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: "7d" });
        return {
            token,
            user: {
                id: usuario.id,
                name: usuario.name,
                email: usuarioAuth.email,
                tipo: usuario.tipo,
                is_empreendedor: usuario.is_empreendedor,
                emailVerificado: true,
                lojaId: usuario.store?.id || null,
                slug: usuario.store?.slug || null,
            },
            message: "Email verificado com sucesso!",
        };
    },
    // =================================================================
    // ✅ 4. ESQUECI SENHA (FORGOT)
    // =================================================================
    async forgotPassword(email) {
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const usuarioAuth = await authRepo.findOne({ where: { email } });
        if (!usuarioAuth)
            throw new Error("Usuário não encontrado.");
        const code = gerarCodigo6Digitos();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 15);
        await authRepo.update(usuarioAuth.id, {
            reset_token: code,
            reset_token_expires: expires,
        });
        EmailService_1.EmailService.send(email, 'Recuperação de Senha', `Seu código GranConecta: ${code}`).catch(console.error);
        return { message: "Código de recuperação enviado para o seu e-mail." };
    },
    // =================================================================
    // ✅ 5. RESETAR SENHA
    // =================================================================
    async resetPassword({ email, token, newPassword }) {
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const usuarioAuth = await authRepo
            .createQueryBuilder("auth")
            .where("auth.email = :email", { email })
            .andWhere("auth.reset_token = :token", { token })
            .andWhere("auth.reset_token_expires > :now", { now: new Date() })
            .getOne();
        if (!usuarioAuth)
            throw new Error("Código inválido ou expirado.");
        const password_hash = await (0, bcryptjs_1.hash)(newPassword, 8);
        await authRepo.update(usuarioAuth.id, {
            password_hash,
            reset_token: null,
            reset_token_expires: null,
        });
        return { message: "Senha redefinida com sucesso!" };
    },
    // =================================================================
    // ✅ 6. REENVIAR CÓDIGO
    // =================================================================
    async reenviarCodigo(email) {
        const authRepo = data_source_1.AppDataSource.getRepository(UsuarioAuthModels_1.UsuarioAuth);
        const usuarioAuth = await authRepo.findOne({ where: { email } });
        if (!usuarioAuth)
            throw new Error("Usuário não encontrado.");
        const novoCodigo = gerarCodigo6Digitos();
        await authRepo.update(usuarioAuth.id, { codigoVerificacao: novoCodigo });
        EmailService_1.EmailService.send(email, 'Novo Código de Verificação', `Seu novo código: ${novoCodigo}`).catch(console.error);
        return { message: "Novo código enviado com sucesso!" };
    },
    // =================================================================
    // ✅ 7. GET ME (DADOS DO USUÁRIO LOGADO)
    // =================================================================
    async getMe(usuarioId) {
        const usuario = await getUserLiteById(usuarioId);
        if (!usuario)
            throw new Error("Usuário não encontrado.");
        return usuario;
    },
};
exports.default = exports.AuthService;
