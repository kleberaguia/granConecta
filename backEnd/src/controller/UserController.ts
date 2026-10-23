import { Request, Response } from "express";
import UserService from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";

class UserController {

  // 1. Cadastro robusto - CORRIGIDO para enviar usuarioId ao Front
  async create(req: Request, res: Response) {
    try {
      const newUser = await UserService.createUser(req.body);

      // ✅ IMPORTANTE: O front-end espera 'usuarioId' para salvar no localStorage
      // e usar na tela de pagamento. Se enviar só o objeto do banco, o front se perde.
      return res.status(201).json({
        ...newUser,
        usuarioId: newUser.id, // Mapeia o ID do banco para o nome que o front espera
        token: req.body.token // Se o seu service já gerar o token, garanta que ele vá aqui
      });
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      return res.status(400).json({ message: error.message || "Erro ao criar usuário." });
    }
  }

  // 2. Busca o perfil completo do usuário logado
  public async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.usuarioId || (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }

      const usuario = await UserService.getUserById(userId);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      return res.json(usuario);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar dados do perfil." });
    }
  }

  // 3. Atualização de dados cadastrais (Tabela Usuario)
  async atualizarDadosPessoais(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.usuarioId || (req as any).user?.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const dadosParaUsuario = {
        name: req.body.name,
        telefone: req.body.telefone,
        documento: req.body.documento,
        condominio_id: req.body.condominio_id || null,
        unidade: req.body.unidade,
        bloco: req.body.bloco,
        is_empreendedor: req.body.is_empreendedor === 'true',
        is_prestador: req.body.is_prestador === 'true',
        // ✅ Sincroniza a especialidade caso mude
        categoriaid: req.body.categoriaid,
        foto_perfil_url:  req.body.foto_perfil_url //files?.['foto_perfil_url'] ? `/uploads/images/${files['foto_perfil_url'][0]?.filename}` : undefined,
      };



      const usuarioAtualizado = await UserService.updateUser(userId, dadosParaUsuario);

      if (!usuarioAtualizado) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.json({
        message: "Dados atualizados com sucesso!",
        user: usuarioAtualizado
      });

    } catch (err) {
      console.error("Erro ao atualizar dados pessoais:", err);
      return res.status(500).json({ error: "Erro interno ao atualizar dados." });
    }
  }

  // 4. Atualização de Perfil Profissional (Tabela PerfilPrestador)
  async atualizarPerfilProfissional(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.usuarioId || (req as any).user?.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const is_empreendedor = req.body.is_empreendedor === 'true';
      const is_prestador = req.body.is_prestador === 'true';

      // Atualiza campos de status na tabela de Usuário primeiro
      const usuarioRepo = AppDataSource.getRepository(Usuario);
      const usuario = await usuarioRepo.findOne({ where: { id: userId } });

      if (usuario) {
        usuario.is_empreendedor = is_empreendedor;
        usuario.is_prestador = is_prestador;
        if (req.body.name) usuario.name = req.body.name;
        // ✅ Salva o tipo de serviço no usuário também para filtros rápidos
        if (req.body.categoriaid) usuario.categoriaid = req.body.categoriaid;
        await usuarioRepo.save(usuario);
      }

      const dadosParaPerfil = {
        ...req.body,
        is_empreendedor,
        is_prestador,
        categoriaid: req.body.categoriaid, // Vincula especialidade no Perfil
        // foto_perfil_url: files?.['foto_perfil_url'] ? `/uploads/images/${files['foto_perfil_url'][0]?.filename}` : undefined,
        // foto_hero_url: files?.['foto_hero_url'] ? `/uploads/images/${files['foto_hero_url'][0]?.filename}` : undefined,
      };

      let perfilExistente = await UserService.getPerfilUserById(userId);

      if (!perfilExistente) {
        const novoPerfil = await UserService.criarPerfil(userId, req.body.name || usuario?.name);
        // Atualiza com os dados extras (fotos, bio)
        const perfilFinal = await UserService.atualizarPerfilProfissional(userId, dadosParaPerfil);
        return res.json({ message: "Perfil criado!", perfil: perfilFinal, user: usuario });
      } else {
        const perfilAtualizado = await UserService.atualizarPerfilProfissional(userId, dadosParaPerfil);
        return res.json({ message: "Perfil atualizado!", perfil: perfilAtualizado, user: usuario });
      }

    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      return res.status(500).json({ error: "Erro ao atualizar perfil profissional." });
    }
  }

  // --- OUTROS MÉTODOS MANTIDOS ---

  async getVitrineBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const perfis = await AppDataSource.getRepository(PerfilPrestador)
        .createQueryBuilder("perfil")
        .leftJoinAndSelect("perfil.usuario", "usuario")
        .leftJoinAndSelect("usuario.endereco", "endereco")
        .where("perfil.servicos_json LIKE :tag", { tag: `%${slug}%` })
        .andWhere("usuario.status_conta = :status", { status: 'ativo' })
        .orderBy("usuario.tipo", "ASC")
        .getMany();

      const vitrineFormatada = perfis.map(p => ({
        id: p.usuarioId,
        name: p.nome_profissional || p.usuario?.name,
        foto_perfil_url: p.foto_perfil_url || "/uploads/default-avatar.png",
        foto_hero_url: p.foto_hero_url,
        descricao_bio: p.descricao_bio,
        whatsapp_comercial: p.whatsapp_comercial,
        localizacao: {
          bloco: p.usuario?.endereco?.bloco_torre || "",
          unidade: p.usuario?.endereco?.unidade_apto || "",
          condominio_id: p.usuario?.condominio_id || ""
        }
      }));
      return res.json(vitrineFormatada);
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar vitrine" });
    }
  }

  async trackAction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tipo } = req.body;
      if (!id) return res.status(400).json('Id é obrigatorio');
      await UserService.registrarClique(id, tipo);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao registrar métrica" });
    }
  }

  async listarPendentes(req: Request, res: Response) {
    try {
      const pendentes = await UserService.listarPendentes();
      return res.json(pendentes);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar pendentes." });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json('Id deve ser obrigatório')
      const user = await UserService.getUserById(id);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar usuário." });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json('Id deve ser obrigatório')
      const updated = await UserService.updateUser(id, req.body);
      return res.json(updated);
    } catch (error) {
      return res.status(400).json({ error: "Erro ao atualizar usuário." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json('Id deve ser obrigatório')
      await UserService.deleteUser(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: "Erro ao deletar usuário." });
    }
  }

  async analisarPerfil(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, observacao } = req.body;
      if (!id) return res.status(400).json('Id deve ser obrigatório')
      const usuario = await UserService.moderarUsuario(id, status, observacao);
      return res.json({ message: `Usuário avaliado como ${status}`, usuario });
    } catch (error) {
      return res.status(500).json({ error: "Erro na moderação." });
    }
  }
}

export default new UserController();