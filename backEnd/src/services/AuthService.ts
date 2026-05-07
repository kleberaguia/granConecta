import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { UsuarioAuth } from "../models/UsuarioAuthModels";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { EmailService } from "./EmailService";
import { Endereco } from "../models/EnderecoModel";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Store } from "../models/StoreModels";
import { UserStatus } from "../models/enums";

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura";

type LoginInput = { email: string; password: string };
type VerifyEmailInput = { email: string; codigo: string };
type ResetPasswordInput = { email: string; token: string; newPassword: string };

function gerarCodigo6Digitos() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Busca os dados essenciais do usuário e suas relações básicas
 */
async function getUserLiteById(usuarioId: string) {
  return await AppDataSource.getRepository(Usuario)
    .createQueryBuilder("u")
    .leftJoinAndSelect("u.endereco", "endereco")
    .leftJoinAndSelect("u.perfil", "perfil") // Verifique se na sua Entity o nome é 'perfil' ou 'perfis'
    .leftJoinAndSelect("u.store", "store")
    .where("u.id = :id", { id: usuarioId })
    .getOne();
}

export const AuthService = {
  // =================================================================
  // ✅ 1. LOGIN
  // =================================================================
  async login({ email, password }: LoginInput) {
    const authRepo = AppDataSource.getRepository(UsuarioAuth);

    const usuarioAuth = await authRepo.findOne({
      where: { email },
      select: ["id", "email", "password_hash", "role", "isActive", "emailVerificado", "usuarioId"],
    });

    if (!usuarioAuth?.usuarioId) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const senhaBate = await compare(password, usuarioAuth.password_hash);
    if (!senhaBate) throw new Error("E-mail ou senha inválidos.");

    const usuario = await getUserLiteById(usuarioAuth.usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado.");

    if (usuario.status_conta === UserStatus.REJEITADO) {
      throw new Error("Seu cadastro foi rejeitado.");
    }

    const token = sign(
      {
        usuarioId: usuario.id,
        role: usuarioAuth.role,
        tipo: usuario.tipo,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ TRATAMENTO DO PERFIL PARA O FRONT-END
    // Garantimos que o Front receba o array 'perfis' para não dar erro de .some()
    const perfilRaw = (usuario as any).perfil;
    const perfisApp = perfilRaw ? [{
      id: perfilRaw.id,
      status: perfilRaw.status_aprovacao,
      status_aprovacao: perfilRaw.status_aprovacao,
      plano: perfilRaw.plano
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
  async register(data: any) {
    const { email, name, tipo, categoriaid, condominio_id } = data;
    const password = data.password || data.senha;
    console.log('dataaaaaaaaaaaaaaaaaaaaa ', data)
    if (!email || !password) throw new Error("E-mail e senha são obrigatórios!");

    const authRepo = AppDataSource.getRepository(UsuarioAuth);
    const emailExistente = await authRepo.findOne({ where: { email } });
    if (emailExistente) throw new Error("E-mail já cadastrado!");

    // Normalização dos booleanos
    const isEmpreendedor = data.is_empreendedor === true || data.is_empreendedor === 'true';
    const isPrestador = data.is_prestador === true || data.is_prestador === 'true' || tipo === "PRESTADOR";

    const codigoVerificacao = gerarCodigo6Digitos();

    return await AppDataSource.transaction(async (manager) => {
      // 1. Criar o Usuário
      const novoUsuario = manager.create(Usuario, {
        name,
        email,
        telefone: data.telefone,
        tipo,
        condominio_id: condominio_id || null,
        is_empreendedor: isEmpreendedor,
        is_prestador: isPrestador,
        is_interno: data.origem !== "EXTERNO",
        status_conta: tipo === "MORADOR" ? UserStatus.APROVADO : UserStatus.PENDENTE,
        categoriaid: categoriaid || null
      });

      const usuarioSalvo = await manager.save(novoUsuario);

      // 2. Criar Endereço
      const novoEndereco = manager.create(Endereco, {
        usuarioId: usuarioSalvo.id,
        condominio_id: condominio_id || null,
        bloco_torre: data.bloco || null,
        unidade_apto: data.unidade || null,
        logradouro: data.logradouro || data.endereco_externo || null,
        numero: data.numero || null,
      });
      await manager.save(novoEndereco);

      // 3. Criar Perfil de Prestador/Empreendedor
      if (isPrestador || isEmpreendedor) {
        const novoPerfil = manager.create(PerfilPrestador, {
          usuarioId: usuarioSalvo.id,
          nome_profissional: name,
          tipo: tipo || "PRESTADOR",
          status_aprovacao: "PENDENTE",
          tipo_assinatura: data.tipo_assinatura || "MENSAL",
          plano: data.plano || "basico",
          categoriaid: categoriaid || null,
        });
        await manager.save(novoPerfil);
      }

      // 4. Criar Loja (Apenas se for empreendedor)
      if (isEmpreendedor) {
        const novaLoja = manager.create(Store, {
          usuarioId: usuarioSalvo.id,
          nome_loja: `Loja de ${name}`,
          name: name,
          slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${usuarioSalvo.id.substring(0, 4)}`,
          ativa: true,
          categoriaid: (categoriaid && categoriaid !== 'OUTRO') ? categoriaid : null,
        });
        await manager.save(novaLoja);
      }

      // 5. Autenticação e Criptografia
      const passwordHash = await hash(password, 8);
      const novoAuth = manager.create(UsuarioAuth, {
        email,
        password_hash: passwordHash,
        usuarioId: usuarioSalvo.id,
        role: tipo,
        codigoVerificacao,
      });
      await manager.save(novoAuth);

      // Envio do código por e-mail
      EmailService.send(email, "Verificação GranConecta", `Seu código é: ${codigoVerificacao}`).catch(console.error);

      const token = sign({ usuarioId: usuarioSalvo.id }, JWT_SECRET, { expiresIn: "1d" });

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
  async verificarEmail(data: VerifyEmailInput) {
    const authRepo = AppDataSource.getRepository(UsuarioAuth);

    const usuarioAuth = await authRepo.findOne({
      where: { email: data.email },
      select: ["id", "email", "usuarioId", "codigoVerificacao", "emailVerificado", "role"],
    });

    if (!usuarioAuth?.usuarioId) throw new Error("Usuário não encontrado.");
    if (usuarioAuth.codigoVerificacao !== data.codigo) throw new Error("Código inválido.");

    await authRepo.update(usuarioAuth.id, {
      emailVerificado: true,
      codigoVerificacao: null,
    });

    const usuario = await getUserLiteById(usuarioAuth.usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado no banco.");

    const token = sign(
      { usuarioId: usuario.id, tipo: usuario.tipo },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
  async forgotPassword(email: string) {
    const authRepo = AppDataSource.getRepository(UsuarioAuth);
    const usuarioAuth = await authRepo.findOne({ where: { email } });

    if (!usuarioAuth) throw new Error("Usuário não encontrado.");

    const code = gerarCodigo6Digitos();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await authRepo.update(usuarioAuth.id, {
      reset_token: code,
      reset_token_expires: expires,
    });

    EmailService.send(email, 'Recuperação de Senha', `Seu código GranConecta: ${code}`).catch(console.error);

    return { message: "Código de recuperação enviado para o seu e-mail." };
  },

  // =================================================================
  // ✅ 5. RESETAR SENHA
  // =================================================================
  async resetPassword({ email, token, newPassword }: ResetPasswordInput) {
    const authRepo = AppDataSource.getRepository(UsuarioAuth);

    const usuarioAuth = await authRepo
      .createQueryBuilder("auth")
      .where("auth.email = :email", { email })
      .andWhere("auth.reset_token = :token", { token })
      .andWhere("auth.reset_token_expires > :now", { now: new Date() })
      .getOne();

    if (!usuarioAuth) throw new Error("Código inválido ou expirado.");

    const password_hash = await hash(newPassword, 8);

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
  async reenviarCodigo(email: string) {
    const authRepo = AppDataSource.getRepository(UsuarioAuth);
    const usuarioAuth = await authRepo.findOne({ where: { email } });

    if (!usuarioAuth) throw new Error("Usuário não encontrado.");

    const novoCodigo = gerarCodigo6Digitos();
    await authRepo.update(usuarioAuth.id, { codigoVerificacao: novoCodigo });

    EmailService.send(email, 'Novo Código de Verificação', `Seu novo código: ${novoCodigo}`).catch(console.error);

    return { message: "Novo código enviado com sucesso!" };
  },

  // =================================================================
  // ✅ 7. GET ME (DADOS DO USUÁRIO LOGADO)
  // =================================================================
  async getMe(usuarioId: string) {
    const usuario = await getUserLiteById(usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado.");
    return usuario;
  },
};

export default AuthService;