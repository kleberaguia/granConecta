import { AppDataSource } from "../config/data-source";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { Usuario } from "../models/UserModels";
import { Endereco } from "../models/EnderecoModel";
import { UserStatus } from "../models/enums";
import { EntityManager } from "typeorm";
import enderecoGeolocationService from "./EnderecoGeolocationService";
import { WhatsAppConsentimento } from "../models/WhatsAppConsentimentoModel";

const usuarioRepo = AppDataSource.getRepository(Usuario);
const perfilRepo = AppDataSource.getRepository(PerfilPrestador);
const enderecoRepo = AppDataSource.getRepository(Endereco);
const whatsappConsentimentoRepo =
  AppDataSource.getRepository(WhatsAppConsentimento);

async function geolocalizarEnderecoSemFalhar(usuarioId: string): Promise<void> {
  try {
    await enderecoGeolocationService.geolocalizarPorUsuario(usuarioId);
  } catch (error: any) {
    console.warn("[UserService] Não foi possível geolocalizar o endereço.", {
      usuarioId,
      erro: error?.message || error,
    });
  }
}

async function sincronizarConsentimentoWhatsApp(
  usuarioId: string,
  telefone?: string | null,
): Promise<void> {
  const telefoneNormalizado = String(telefone || "")
    .replace(/\D/g, "")
    .trim();

  if (!telefoneNormalizado) {
    return;
  }

  const consentimentoExistente =
    await whatsappConsentimentoRepo.findOne({
      where: { usuarioId },
    });

  if (consentimentoExistente) {
    // Atualiza somente o telefone.
    // Não altera as escolhas já feitas pelo usuário.
    if (consentimentoExistente.telefone !== telefoneNormalizado) {
      consentimentoExistente.telefone = telefoneNormalizado;

      await whatsappConsentimentoRepo.save(
        consentimentoExistente,
      );
    }

    return;
  }

  const novoConsentimento =
    whatsappConsentimentoRepo.create({
      usuarioId,
      telefone: telefoneNormalizado,
      aceita_utilidade: true,
      aceita_marketing: false,
      marketing_aceito_em: null,
      marketing_origem: null,
      marketing_cancelado_em: null,
    });

  await whatsappConsentimentoRepo.save(
    novoConsentimento,
  );

  console.log(
    "[UserService] Preferências WhatsApp criadas.",
    {
      usuarioId,
      aceita_utilidade: true,
      aceita_marketing: false,
    },
  );
}

const UserService = {

  async getAll() {
    return await usuarioRepo.find();
  },

  async getAllUsers(): Promise<Usuario[]> {
    return await usuarioRepo.find({ relations: ['perfil'] });
  },

  async getPerfilUserById(usuarioId: string) {
    const perfil = await perfilRepo.findOne({ where: { usuarioId } });
    return perfil || null;
  },

  async getUserById(id: string) {
    try {
      console.log("Buscando usuário ID:", id);

      const relacoesComuns = [
        "condominio",
        "perfil",
        "endereco",
        "perfil.categoriaidoPrincipal",
      ];

      const user = await usuarioRepo.findOne({
        where: { id },
        relations: relacoesComuns,
      });

      if (!user) {
        return null;
      }

      // =========================================================
      // SEGURANÇA — NUNCA EXPOR CREDENCIAIS DO MERCADO PAGO
      // =========================================================

      const mercadoPagoConectado =
        Boolean(user.gateway_conta_id) &&
        Boolean(user.mercadoPagoAccessToken);

      const {
        mercadoPagoAccessToken: _mercadoPagoAccessToken,
        ...usuarioSeguro
      } = user;

      return {
        ...usuarioSeguro,

        // O frontend pode saber se a conta está conectada,
        // mas nunca recebe o access token.
        mercadoPagoConectado,
      };
    } catch (error: any) {
      console.error(
        "Erro dentro de getUserById:",
        error.message
      );

      throw error;
    }
  },

  async listarPendentes() {
    return await usuarioRepo.find({
      where: { status_conta: UserStatus.PENDENTE as any },
      relations: ["perfil"],
      select: {
        id: true,
        name: true,
        tipo: true,
        status_conta: true,
        perfil: {
          id: true,
          nome_profissional: true,
        }
      }
    });
  },

  async deleteUser(id: string) {
    const user = await usuarioRepo.findOne({ where: { id } });
    if (!user) throw new Error("Usuário não encontrado");
    return await usuarioRepo.remove(user);
  },

  async createUser(data: any): Promise<Usuario> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Criação do Usuário
      const usuario = queryRunner.manager.create(Usuario, {
        name: data.name || data.nome,
        telefone: data.telefone,
        tipo: 'PRESTADOR',
        // Define se é interno baseado na origem enviada pelo front
        is_interno: data.origem === 'EXTERNO' ? false : (data.is_interno ?? true),
        documento: data.documento,
        status_conta: UserStatus.PENDENTE,
        categoriaid: data.categoriaid || null,
        condominio_id: data.condominio_id || null
      });

      const savedUser = await queryRunner.manager.save(usuario);

      // 2. Criação do Endereço
      const endereco = queryRunner.manager.create(Endereco, {
        usuarioId: savedUser.id,
        condominio_id: data.condominio_id || null,
        bloco_torre: data.bloco || data.bloco_torre || null,
        unidade_apto: data.unidade || data.unidade_apto || null,
        // Prioriza endereço externo se vier do front
        logradouro: data.endereco_externo || data.logradouro || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        uf: data.uf || null,
        numero: data.numero || null,
        cep: data.cep || null
      });

      await queryRunner.manager.save(endereco);

      // 3. Lógica para Perfil (Prestador ou Morador Empreendedor)
      if (data.tipo === 'PRESTADOR' || data.is_empreendedor === true || data.is_empreendedor === 'true') {
        await this.criarPerfilInternal(
          savedUser.id,
          data.name || data.nome,
          queryRunner.manager,
          data.categoriaid
        );
      }

      await queryRunner.commitTransaction();

      // Só geolocaliza depois do COMMIT, pois o serviço usa
      // o repositório normal do AppDataSource.
      await geolocalizarEnderecoSemFalhar(savedUser.id);

      return savedUser;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error("Erro no cadastro:", err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  },

  // Método interno para ser usado dentro de transações
  async criarPerfilInternal(id: string, nome: string, manager: EntityManager, categoriaid?: number) {
    const perfilExistente = await manager.findOne(PerfilPrestador, { where: { usuarioId: id } });

    if (!perfilExistente) {
      const perfil = manager.create(PerfilPrestador, {
        usuarioId: id,
        nome_profissional: nome,
        status_aprovacao: 'PENDENTE',
        categoriaid: categoriaid || null
      } as any); // O 'as any' resolve os erros de Overload e DeepPartial

      return await manager.save(perfil);
    }

    if (categoriaid && !perfilExistente.categoriaid) {
      perfilExistente.categoriaid = categoriaid;
      return await manager.save(perfilExistente);
    }

    return perfilExistente;
  },

  async updateUser(id: string, dados: any) {


    console.log(
      "🔥🔥🔥 [UserService.updateUser] EXECUTADO 🔥🔥🔥",
      {
        id,
        telefoneRecebido: dados?.telefone,
      },
    );
    const user = await usuarioRepo.findOne({
      where: { id },
      relations: ['perfil', 'endereco']
    });

    if (!user) return null;

    // =========================
    // 1. DADOS BÁSICOS
    // =========================
    if (dados.is_empreendedor !== undefined)
      user.is_empreendedor = String(dados.is_empreendedor) === 'true';

    if (dados.is_prestador !== undefined)
      user.is_prestador = String(dados.is_prestador) === 'true';

    if (dados.name) user.name = dados.name;
    if (dados.telefone) user.telefone = dados.telefone;

    if (dados.documento !== undefined)
      user.documento = dados.documento;

    if (dados.condominio_id)
      user.condominio_id = dados.condominio_id;

    if (dados.categoriaid !== undefined)
      user.categoriaid = dados.categoriaid;

    // 🔥 FOTO DO USUÁRIO (MORADOR / GLOBAL)
    if (dados.foto_perfil_url) {
      user.foto_perfil_url = dados.foto_perfil_url;
    }

    // =========================
    // 2. PERFIL PROFISSIONAL
    // =========================
    const virouProfissional = user.is_prestador || user.is_empreendedor;

    if (virouProfissional) {
      let perfilExistente =
        user.perfil ||
        await perfilRepo.findOne({ where: { usuarioId: id } });

      if (perfilExistente) {
        const dadosParaAtualizar: any = {};

        // ⚠️ aqui é foto PROFISSIONAL (opcional manter separado)
        if (dados.foto_perfil_url) {
          dadosParaAtualizar.foto_perfil_url = dados.foto_perfil_url;
        }

        if (dados.categoriaid) {
          dadosParaAtualizar.categoriaid = dados.categoriaid;
        }

        if (Object.keys(dadosParaAtualizar).length > 0) {
          await perfilRepo.update({ usuarioId: id }, dadosParaAtualizar);
          Object.assign(perfilExistente, dadosParaAtualizar);
          user.perfil = perfilExistente;
        }

      } else {
        // 👇 cria perfil apenas se virou profissional
        await this.criarPerfil(id, user.name);
      }
    }

    // =========================
    // 3. ENDEREÇO
    // =========================
    const bloco = dados.bloco || dados.bloco_torre;
    const unidade = dados.unidade || dados.unidade_apto;

    const possuiDadosEndereco =
      bloco !== undefined ||
      unidade !== undefined ||
      dados.endereco_externo !== undefined ||
      dados.logradouro !== undefined ||
      dados.bairro !== undefined ||
      dados.cidade !== undefined ||
      dados.uf !== undefined ||
      dados.numero !== undefined ||
      dados.cep !== undefined ||
      dados.condominio_id !== undefined ||
      dados.localizacao_publica !== undefined;

    let enderecoFoiAlterado = false;

    if (possuiDadosEndereco) {
      let endereco = user.endereco;

      if (!endereco) {
        endereco = enderecoRepo.create({ usuarioId: id });
      }

      if (dados.condominio_id !== undefined)
        endereco.condominio_id = dados.condominio_id || undefined;

      if (bloco !== undefined)
        endereco.bloco_torre = bloco || undefined;

      if (unidade !== undefined)
        endereco.unidade_apto = unidade || undefined;

      if (
        dados.endereco_externo !== undefined ||
        dados.logradouro !== undefined
      ) {
        endereco.logradouro =
          dados.endereco_externo || dados.logradouro || undefined;
      }

      if (dados.bairro !== undefined)
        endereco.bairro = dados.bairro || undefined;

      if (dados.cidade !== undefined)
        endereco.cidade = dados.cidade || undefined;

      if (dados.uf !== undefined)
        endereco.uf = dados.uf
          ? String(dados.uf).trim().toUpperCase()
          : undefined;

      if (dados.numero !== undefined)
        endereco.numero = dados.numero || undefined;

      if (dados.cep !== undefined)
        endereco.cep =
          String(dados.cep || "").replace(/\D/g, "") || null;

      if (dados.localizacao_publica !== undefined) {
        endereco.localizacao_publica =
          dados.localizacao_publica === true ||
          String(dados.localizacao_publica) === "true";
      }

      // Força nova avaliação sem apagar as coordenadas existentes.
      endereco.geocoding_status = "PENDENTE" as any;
      endereco.geocoding_precision = "NENHUMA" as any;

      user.endereco = await enderecoRepo.save(endereco);
      enderecoFoiAlterado = true;
    }

    // =========================
    // 4. UPDATE FINAL (PERFORMANCE)
    // =========================
    const updateData: any = {
      is_empreendedor: user.is_empreendedor,
      is_prestador: user.is_prestador,
      name: user.name,
      telefone: user.telefone ?? null,
      documento: user.documento ?? null,
      condominio_id: user.condominio_id,
      categoriaid: user.categoriaid,
    };

    // 👇 só adiciona se existir (evita sobrescrever)
    if (user.foto_perfil_url) {
      updateData.foto_perfil_url = user.foto_perfil_url;
    }

    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );



    await usuarioRepo.update(id, updateData);



    // Mantém as preferências de comunicação por WhatsApp
    // sincronizadas com o telefone do usuário.
    if (user.telefone) {
      await sincronizarConsentimentoWhatsApp(
        id,
        user.telefone,
      );
    }

    if (enderecoFoiAlterado) {
      await geolocalizarEnderecoSemFalhar(id);

      const enderecoAtualizado = await enderecoRepo.findOne({
        where: { usuarioId: id },
      });

      if (enderecoAtualizado) {
        user.endereco = enderecoAtualizado;
      }
    }

    return user;
  },

  async criarPerfil(id: string, nome: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const res = await this.criarPerfilInternal(id, nome, queryRunner.manager);
      await queryRunner.commitTransaction();
      return res;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  },

  async atualizarPerfilProfissional(usuarioId: string, data: any, file?: Express.Multer.File) {
    // 1. Busca o perfil ou cria um novo caso não exista (uso de 'as any' para evitar erro de cast do TS)
    let perfil = await perfilRepo.findOne({ where: { usuarioId } });

    if (!perfil) {
      // Fazemos o cast para 'unknown' primeiro e depois para 'PerfilPrestador'
      // Isso remove o erro de "overlap" (sobreposição) de tipos.
      perfil = perfilRepo.create({
        usuarioId,
        nome_profissional: data.nome_profissional || 'Pendente'
      } as any) as unknown as PerfilPrestador;
    }

    // 2. Tratamento de upload de foto
    if (file) {
      data.foto_perfil_url = `/uploads/images/${file.filename}`;
    }

    // 3. Atualização dos campos básicos
    if (data.nome_profissional) perfil.nome_profissional = data.nome_profissional;
    if (data.descricao_bio) perfil.descricao_bio = data.descricao_bio;
    if (data.foto_perfil_url) perfil.foto_perfil_url = data.foto_perfil_url;
    if (data.foto_hero_url) perfil.foto_hero_url = data.foto_hero_url;
    if (data.whatsapp_comercial) perfil.whatsapp_comercial = data.whatsapp_comercial;

    // --- NOVO: Atualização da Especialidade (Sincronia com o novo sistema) ---
    if (data.categoriaid) {
      perfil.categoriaid = data.categoriaid;
    }

    // 4. Tratamento de serviços (JSON)
    if (data.servicos_oferecidos) {
      perfil.servicos_json = Array.isArray(data.servicos_oferecidos)
        ? data.servicos_oferecidos
        : data.servicos_oferecidos.split(',').map((s: string) => s.trim());
    }

    // 5. Status e Salvamento
    // Definimos como PENDENTE para que a moderação revise a alteração
    perfil.status = UserStatus.PENDENTE;

    const perfilSalvo = await perfilRepo.save(perfil);

    // ✅ Dica Extra: Se o perfil mudar a especialidade, é bom espelhar no Usuário também
    if (data.categoriaid) {
      await usuarioRepo.update(usuarioId, { categoriaid: data.categoriaid });
    }


    return perfilSalvo;
  },
  async registrarClique(usuarioId: string, tipo: string) {
    const perfil = await perfilRepo.findOne({ where: { usuarioId } });
    if (!perfil) return;
    perfil.visualizacoes = (Number(perfil.visualizacoes) || 0) + 1;
    return await perfilRepo.save(perfil);
  },

  async moderarUsuario(id: string, status: UserStatus, _observacao?: string) {
    const usuario = await usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new Error("USUARIO_NAO_ENCONTRADO");
    usuario.status_conta = status;
    return await usuarioRepo.save(usuario);
  }
};

export default UserService;