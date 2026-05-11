"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserService = void 0;
const data_source_1 = require("../config/data-source");
const UserModels_1 = require("../models/UserModels");
const UsuarioAuthModels_1 = require("../models/UsuarioAuthModels"); // Certifique-se de importar este
const condominiosModels_1 = require("../models/condominiosModels");
const bcryptjs_1 = require("bcryptjs");
class CreateUserService {
    async execute({ nome, email, password, tipo, condominio_id, bloco, unidade, codigo_acesso, tipo_servico_id, is_empreendedor, origem }) {
        if (tipo === 'MORADOR') {
            if (!condominio_id)
                throw new Error("Condomínio é obrigatório para moradores.");
            const condominioRepo = data_source_1.AppDataSource.getRepository(condominiosModels_1.Condominio);
            const condominio = await condominioRepo.findOne({ where: { id: condominio_id } });
            if (!condominio)
                throw new Error("Condomínio não encontrado.");
            if (codigo_acesso && condominio.codigo_acesso !== codigo_acesso) {
                throw new Error("Código de acesso do condomínio inválido.");
            }
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(password, 8);
        return await data_source_1.AppDataSource.transaction(async (manager) => {
            const emailExists = await manager.findOne(UsuarioAuthModels_1.UsuarioAuth, { where: { email } });
            if (emailExists) {
                throw new Error("Este e-mail já está cadastrado.");
            }
            const user = new UserModels_1.Usuario();
            user.name = nome;
            user.email = email;
            user.tipo = tipo;
            user.is_empreendedor = is_empreendedor || false;
            const savedUser = await manager.save(user);
            const auth = new UsuarioAuthModels_1.UsuarioAuth();
            auth.email = email;
            auth.usuario = Promise.resolve(savedUser);
            auth.role = tipo === 'ADMIN' ? 'ADMIN' : 'USER';
            await manager.save(auth);
            return savedUser;
        });
    }
}
exports.CreateUserService = CreateUserService;
