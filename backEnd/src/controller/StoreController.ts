import type { RequestHandler } from "express";
import { AIStoreService } from "../services/AIStoreService";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware"; // ajuste o path
import { sanitizeHtmlBasic } from "../utils/html/sanitizeHtmlBasic";
import { Store } from "../models/StoreModels";
import fs from "fs";
import { Category } from "../models/CategoryModels";
import { LojaInteracao } from "../models/LojaInteracao";
import { DeliveryConfig } from "../models/DeliveryConfig";
import { AppDataSource } from "../config/data-source";
import { ListaDesejosService } from "../services/ListaDesejosService";
import { PerfilPrestador } from "../models/PerfilPrestadorModel";
import { In } from "typeorm";


function getFileBuffer(file?: Express.Multer.File) {
  if (!file) return null;

  const anyFile = file as any;
  if (anyFile.buffer) return anyFile.buffer as Buffer;

  if (file.path && fs.existsSync(file.path)) {
    return fs.readFileSync(file.path);
  }

  return null;
}

function onlyDigits(value?: string | number | null): string {
  return String(value || "").replace(/\D/g, "");
}

function resolveWhatsappFromStore(source: any): string {
  if (!source) return "";

  const candidates = [
    source.telefone_whatsapp,
    source.store_whatsapp,
    source.whatsapp,
    source.numero_whatsapp,
    source.numeroWhatsapp,
    source.whatsapp_number,
    source.whatsappNumber,
    source.telefoneWhatsapp,
    source.telefone,
    source.celular,
    source.phone,
    source.mobile,
    source.contactPhone,
    source.contatoTelefone,
    source?.usuario?.telefone_whatsapp,
    source?.usuario?.whatsapp,
    source?.usuario?.telefone,
    source?.usuario?.celular,
    source?.user?.telefone_whatsapp,
    source?.user?.whatsapp,
    source?.user?.telefone,
    source?.user?.celular,
    source?.owner?.telefone_whatsapp,
    source?.owner?.whatsapp,
    source?.owner?.telefone,
    source?.owner?.celular,
  ];

  const found = candidates.find((value) => onlyDigits(value).length >= 10);
  return found ? onlyDigits(found) : "";
}

function normalizeBrazilWhatsapp(value?: string | number | null): string {
  const digits = onlyDigits(value);

  if (!digits) return "";

  return digits.startsWith("55") ? digits : `55${digits}`;
}

function normalizeStoreContactPayload<T extends Record<string, any> | null>(store: T): T {
  if (!store) return store;

  const rawWhatsapp = resolveWhatsappFromStore(store);
  const normalizedWhatsapp = normalizeBrazilWhatsapp(rawWhatsapp);
  const telefone =
    onlyDigits((store as any).telefone) ||
    onlyDigits((store as any).celular) ||
    rawWhatsapp;

  return {
    ...(store as any),

    // Coluna real do banco + campo padronizado para o frontend usar daqui para frente.
    telefoneWhatsapp: normalizedWhatsapp,
    whatsapp: normalizedWhatsapp,

    // Campos mantidos para compatibilidade com telas antigas.
    telefone_whatsapp: normalizedWhatsapp,
    store_whatsapp: normalizedWhatsapp,
    numero_whatsapp: normalizedWhatsapp,
    telefone,
    celular: onlyDigits((store as any).celular) || telefone,
  } as T;
}

const STATUS_ASSINATURA_BLOQUEADOS = new Set([
  "VENCIDA",
  "VENCIDO",
  "PENDENTE",
  "INATIVA",
  "INATIVO",
  "CANCELADA",
  "CANCELADO",
  "SUSPENSA",
  "SUSPENSO",
  "BLOQUEADA",
  "BLOQUEADO",
]);

function enriquecerAcessoComercial(
  store: Record<string, any>,
  perfil?: PerfilPrestador | null,
) {
  const agora = new Date();
  const statusAssinatura = String(
    perfil?.status_assinatura || "",
  )
    .trim()
    .toUpperCase();

  const vencimento = perfil?.assinatura_vence_em
    ? new Date(perfil.assinatura_vence_em)
    : null;

  const vencimentoValido =
    vencimento instanceof Date &&
      !Number.isNaN(vencimento.getTime())
      ? vencimento
      : null;

  const assinaturaVencida = Boolean(
    vencimentoValido && vencimentoValido.getTime() <= agora.getTime(),
  );

  const bloqueadoPorStatus =
    STATUS_ASSINATURA_BLOQUEADOS.has(statusAssinatura);

  const bloqueadoPorAssinatura = Boolean(
    perfil?.bloqueado_por_assinatura ||
    assinaturaVencida ||
    bloqueadoPorStatus,
  );

  /*
   * Lojas antigas que ainda não possuem PerfilPrestador continuam seguindo
   * o campo store.ativa. Quando existe perfil, a assinatura passa a ser a
   * fonte de verdade para compras, contatos e acesso à landing page.
   */
  const lojaAtiva =
    store.ativa !== false &&
    store.ativa !== 0 &&
    String(store.ativa).toLowerCase() !== "false";

  const acessoLiberado = lojaAtiva && !bloqueadoPorAssinatura;

  const payload = {
    ...store,
    acesso_comercial_liberado: acessoLiberado,
    assinatura_ativa: acessoLiberado,
    pode_receber_pedidos: acessoLiberado,
    bloqueado_assinatura: bloqueadoPorAssinatura,
    status_assinatura:
      statusAssinatura ||
      (perfil ? "INDEFINIDA" : "SEM_PERFIL_ASSINATURA"),
    assinatura_vence_em:
      vencimentoValido?.toISOString() || null,
  };

  if (!acessoLiberado) {
    return {
      ...payload,
      pageHtmlPublished: null,
      pageHtmlDraft: null,
      pageCssPublished: null,
      pageCssDraft: null,
      layoutConfig: null,
    };
  }

  return payload;
}

export class StoreController {
  private aiStoreService = new AIStoreService();
  private storeRepository = AppDataSource.getRepository(Store);
  private deliveryRepo = AppDataSource.getRepository(DeliveryConfig);
  private listaDesejosService = new ListaDesejosService();

  private async adicionarAcessoComercial(store: any) {
    if (!store) return store;

    const perfil = store.usuarioId
      ? await AppDataSource.getRepository(PerfilPrestador).findOne({
        where: { usuarioId: String(store.usuarioId) },
      })
      : null;

    return enriquecerAcessoComercial(
      normalizeStoreContactPayload(store) as Record<string, any>,
      perfil,
    );
  }

  private async adicionarAcessoComercialEmLista(lojas: any[]) {
    if (!Array.isArray(lojas) || lojas.length === 0) return [];

    const usuarioIds = Array.from(
      new Set(
        lojas
          .map((loja) => String(loja?.usuarioId || "").trim())
          .filter(Boolean),
      ),
    );

    const perfis = usuarioIds.length
      ? await AppDataSource.getRepository(PerfilPrestador).find({
        where: { usuarioId: In(usuarioIds) },
      })
      : [];

    const perfilPorUsuario = new Map(
      perfis.map((perfil) => [String(perfil.usuarioId), perfil]),
    );

    return lojas.map((loja) =>
      enriquecerAcessoComercial(
        normalizeStoreContactPayload(loja) as Record<string, any>,
        perfilPorUsuario.get(String(loja?.usuarioId || "")) || null,
      ),
    );
  }

  // ✅ Buscar loja por ID (pública)
  getStoreById: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "O ID da loja é obrigatório." });
        return;
      }

      const store = await this.aiStoreService.getStoreById(id);

      if (!store) {
        res.status(404).json({ message: "Loja não encontrada com o ID fornecido." });
        return;
      }

      res.json(await this.adicionarAcessoComercial(store));
      return;
    } catch (error: any) {
      console.error("Erro ao buscar loja por ID:", error);
      res.status(500).json({ error: "Erro interno ao buscar dados da loja." });
      return;
    }
  };

  // ✅ Listar lojas públicas
  listPublicStores: RequestHandler = async (_req, res) => {
    try {
      const lojas = await this.aiStoreService.getAllPublicStores();
      res.json(
        Array.isArray(lojas)
          ? await this.adicionarAcessoComercialEmLista(lojas)
          : lojas,
      );
      return;
    } catch (error: any) {
      console.error("Erro ao listar lojas:", error);
      res.status(500).json({ error: "Erro ao carregar vitrine pública." });
      return;
    }
  };

  listStoresByCategoria: RequestHandler = async (req, res) => {
    try {
      const { categoria } = req.params;

      const stores = await AppDataSource.getRepository(Store)
        .createQueryBuilder("store")
        .innerJoin("grupos_home", "grupo", "grupo.id = store.categoriaid")
        .where("grupo.slug = :categoria", { categoria })
        .andWhere("store.ativa = true")
        .getMany();

      return res.json(stores);
    } catch (error) {
      console.error("Erro ao buscar por categoria:", error);
      return res.status(500).json({ message: "Erro interno" });
    }
  }

  listGruposComLojas: RequestHandler = async (req, res) => {
    try {
      const grupos = await AppDataSource
        .getRepository("grupos_home")
        .createQueryBuilder("grupo")
        .leftJoinAndMapMany(
          "grupo.stores",
          "stores",
          "store",
          "store.categoriaid = grupo.id AND store.ativa = true"
        )
        .where("grupo.ativo = true")
        .orderBy("grupo.id", "ASC")
        .getMany();

      return res.json(grupos);
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
      return res.status(500).json({ message: "Erro interno" });
    }
  }

  // ✅ Buscar loja por Slug (pública)
  getStoreBySlug: RequestHandler = async (req, res) => {
    try {
      const { slug } = req.params;
      if (!slug) {
        res.status(400).json({ error: "Slug é obrigatório" });
        return;
      }

      const store = await this.aiStoreService.getStoreBySlug(slug);

      if (!store) {
        res.status(404).json({ message: "Loja não encontrada." });
        return;
      }

      res.json(await this.adicionarAcessoComercial(store));
      return;
    } catch (error: any) {
      console.error("Erro ao buscar loja por slug:", error);
      res.status(500).json({ error: "Erro interno ao buscar loja." });
      return;
    }
  };

  // ✅ Loja do usuário logado (privada)
  getStoreByUser: RequestHandler = async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const usuarioId = authReq.user?.usuarioId;

      if (!usuarioId) {
        res.status(401).json({ message: "Não autenticado." });
        return;
      }

      const store = await this.aiStoreService.getStoreByUserId(usuarioId);
      res.json(normalizeStoreContactPayload(store || null));
      return;
    } catch (error: any) {
      console.error("Erro ao buscar loja do usuário:", error);
      res.status(500).json({ error: "Erro interno ao buscar loja do usuário." });
      return;
    }
  };

  listCategoriasByGrupo: RequestHandler = async (req, res) => {
    try {
      const { categoria } = req.params; // slug: dia-a-dia

      // 🔢 paginação
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 8);
      const skip = (page - 1) * limit;

      const grupoRepo = AppDataSource.getRepository("grupos_home");
      const categoriaRepo = AppDataSource.getRepository("categories");

      // 1️⃣ Buscar grupo pelo slug
      const grupo = await grupoRepo
        .createQueryBuilder("grupo")
        .where("grupo.slug = :slug", { slug: categoria })
        .andWhere("grupo.ativo = true")
        .getOne();

      if (!grupo) {
        return res.status(404).json({ message: "Grupo não encontrado" });
      }

      // 2️⃣ Buscar categorias do grupo (COM PAGINAÇÃO)
      // O getManyAndCount já trará a 'urlCategoria' se ela estiver na Entity
      const [categorias, total] = await categoriaRepo
        .createQueryBuilder("cat")
        .where("cat.grupo_id = :grupoId", { grupoId: grupo.id })
        // .select(["cat.id", "cat.nome", "cat.slug", "cat.urlCategoria"]) // Opcional: para ser explícito
        .orderBy("cat.name", "ASC") // Verifique se no banco é 'nome' ou 'name'
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      // 3️⃣ Calcular hasMore
      const hasMore = skip + categorias.length < total;

      // 4️⃣ Resposta final
      return res.json({
        grupo,
        categorias, // Agora cada objeto aqui terá a 'urlCategoria'
        page,
        limit,
        total,
        hasMore
      });

    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return res.status(500).json({ message: "Erro interno" });
    }
  };

  getDeliveryConfig: RequestHandler = async (req, res) => {
    try {
      // 1. Solução para o erro de 'params'
      const { storeId } = req.params;

      if (!storeId) {
        return res.status(400).json({ message: "ID da loja não fornecido" });
      }

      const store = await this.storeRepository.findOne({
        where: { id: storeId },
        relations: ["deliveryConfig"],
      });

      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      return res.json(store.deliveryConfig || {
        acceptDelivery: true,
        acceptPickup: true,
        deliveryFee: 0
      });

    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar config" });
    }
  }

  upsertDeliveryConfig: RequestHandler = async (req, res) => {
    const { storeId, ...data } = req.body;

    try {
      // O 'Number' é uma função, você deve usar Number(valor), não Number valor
      const sId = storeId;

      let config = await this.deliveryRepo.findOne({ where: { storeId: sId } });

      if (config) {
        // Atualiza existente
        await this.deliveryRepo.update(config.id, {
          ...data,
          deliveryFee: Number(data.deliveryFee),
          minOrderValue: Number(data.minOrderValue)
        });
      } else {
        // Cria novo
        const newConfig = this.deliveryRepo.create({
          ...data,
          storeId: sId,
          deliveryFee: Number(data.deliveryFee),
          minOrderValue: Number(data.minOrderValue)
        });
        await this.deliveryRepo.save(newConfig);
      }

      return res.json({ message: "Configuração de entrega salva!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao salvar logística" });
    }
  }

  // ✅ Upsert loja (privada)
  upsertStore: RequestHandler = async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const usuarioId = authReq.user?.usuarioId || req.body.usuarioId;

      if (!usuarioId) return res.status(401).json({ error: "Usuário não identificado." });

      const files = req.files as Express.Multer.File[];
      const heroFile = files?.find(f => f.fieldname === 'heroImage');

      // Parse seguro dos JSONs
      const layoutConfig = typeof req.body.aiData === 'string' ? JSON.parse(req.body.aiData) : req.body.aiData;
      const estilo = typeof req.body.estilo === 'string' ? JSON.parse(req.body.estilo) : req.body.estilo;

      const categoriaid = req.body.categoriaid;
      const idValido = (
        categoriaid && !['null', 'undefined', '', 'OUTRO'].includes(String(categoriaid))
      );

      const storeData = {
        name: req.body.name,
        slug: req.body.slug,
        pageHtmlPublished: req.body.pageHtmlPublished,
        capa_url: req.body.capa_url,
        categoria: req.body.categoria,
        categoriaid: idValido ? Number(categoriaid) : null,
        tipo: req.body.tipo,
        layoutConfig: layoutConfig, // Enviado para o Service processar como pageSpecDraft
        estilo,
        heroImageBuffer: heroFile?.buffer,
        heroImageMime: heroFile?.mimetype,
        condominioId: req.body.condominioId, // Campo opcional
        telefoneWhatsapp: normalizeBrazilWhatsapp(
          req.body.telefoneWhatsapp ||
          req.body.telefone_whatsapp ||
          req.body.store_whatsapp ||
          req.body.whatsapp ||
          req.body.numero_whatsapp ||
          req.body.numeroWhatsapp ||
          req.body.telefone ||
          req.body.celular ||
          req.body.phone ||
          req.body.mobile ||
          layoutConfig?.settings?.telefoneWhatsapp ||
          layoutConfig?.settings?.telefone_whatsapp ||
          layoutConfig?.settings?.store_whatsapp ||
          layoutConfig?.settings?.whatsapp ||

          "",
        ),
      };

      const store = await this.aiStoreService.saveOrUpdateStore(usuarioId, storeData);
      return res.json({ message: "Site publicado!", store: normalizeStoreContactPayload(store) });
    } catch (error: any) {
      console.error("ERRO NO UPSERT:", error);
      return res.status(500).json({ error: "Erro ao salvar loja.", details: error.message });
    }
  };

  // ✅ Update Store (Onde o "Salvar Geral" do Preview costuma bater)
  updateStore: RequestHandler = async (req, res) => {


    console.log("======== UPDATE CAPA ========");
    console.log("PARAM ID:", req.params.id);
    console.log("BODY:", req.body);
    console.log("USER:", (req as any).user);
    console.log("=============================");
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const currentUserId = authReq.user?.usuarioId;

      if (!id || id === "undefined") return res.status(400).json({ error: "ID não fornecido." });
      if (!currentUserId) return res.status(401).json({ error: "Não autorizado." });

      const repo = this.aiStoreService.getRepository(Store);
      const store = await repo.findOne({ where: { id, usuarioId: currentUserId } });

      if (!store) return res.status(404).json({ error: "Loja não encontrada." });

      const updateData = req.body;

      // 1. Processamento do aiData (Rascunho do editor)
      if (updateData.aiData) {
        const parsedAiData = typeof updateData.aiData === 'string'
          ? JSON.parse(updateData.aiData)
          : updateData.aiData;

        (store as any).pageSpecDraft = parsedAiData;
        (store as any).layoutConfig = parsedAiData;

        // 🔥 EXTRAÇÃO DA CAPA DE DENTRO DO aiData
        // Se o editor salvou a capa dentro do JSON, atualizamos a coluna principal também
        if (parsedAiData.capa_url) {
          // Limpeza: Garante que salve apenas o nome do arquivo se vier a URL completa
          store.capa_url = parsedAiData.capa_url.split('/').pop();
        }
      }

      // 2. Atualização do HTML Publicado
      if (updateData.pageHtmlPublished) {
        store.pageHtmlPublished = updateData.pageHtmlPublished;
      }

      // 3. Mapeamento de campos básicos
      if (updateData.name || updateData.store_name) {
        store.name = updateData.name || updateData.store_name;
      }

      if (updateData.slug || updateData.store_slug) {
        store.slug = updateData.slug || updateData.store_slug;
      }

      const incomingWhatsapp =
        updateData.telefone_whatsapp ||
        updateData.store_whatsapp ||
        updateData.whatsapp ||
        updateData.numero_whatsapp ||
        updateData.numeroWhatsapp ||
        updateData.whatsapp_number ||
        updateData.whatsappNumber ||
        updateData.telefoneWhatsapp ||
        updateData.telefone ||
        updateData.celular ||
        updateData.phone ||
        updateData.mobile ||
        "";

      if (incomingWhatsapp) {
        const normalizedWhatsapp = normalizeBrazilWhatsapp(incomingWhatsapp);

        // Coluna real da tabela stores.
        (store as any).telefoneWhatsapp = normalizedWhatsapp;

        // Aliases em memória, caso a entity tenha algum deles no futuro.
        if ((store as any).whatsapp !== undefined) (store as any).whatsapp = normalizedWhatsapp;
        if ((store as any).telefone_whatsapp !== undefined) (store as any).telefone_whatsapp = normalizedWhatsapp;
        if ((store as any).store_whatsapp !== undefined) (store as any).store_whatsapp = normalizedWhatsapp;
        if ((store as any).numero_whatsapp !== undefined) (store as any).numero_whatsapp = normalizedWhatsapp;
        if ((store as any).telefone !== undefined) (store as any).telefone = onlyDigits(incomingWhatsapp);
      }

      // 🔥 ATUALIZAÇÃO DA CAPA VIA RAIZ (Caso o componente de upload envie fora do aiData)
      if (
        typeof updateData.capa_url === "string" &&
        updateData.capa_url.trim()
      ) {
        store.capa_url = updateData.capa_url.trim();

        console.log("[STORE] capa_url atualizada:", {
          storeId: store.id,
          capa_url: store.capa_url,
        });
      }

      if (updateData.condominioId !== undefined) (store as any).condominioId = updateData.condominioId;

      // 4. Lógica de Categoria
      if (updateData.categoriaid !== undefined) {
        const cid = parseInt(updateData.categoriaid);
        if (!isNaN(cid) && cid > 0) {
          store.categoriaid = cid;
          const catRepo = this.aiStoreService.getRepository(Category);
          const cat = await catRepo.findOne({ where: { id: cid } });
          if (cat) {
            store.categoria = cat.name;
            if ((cat as any).tipo) (store as any).categoria_tag = (cat as any).tipo;
          }
        } else {
          store.categoriaid = null;
          store.categoria = null;
        }
      }

      const updatedStore = await repo.save(store);

      return res.json({
        message: "Loja atualizada com sucesso!",
        store: normalizeStoreContactPayload(updatedStore)
      });
    } catch (error: any) {
      console.error("Erro no updateStore:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar." });
    }
  };
  // ✅ Upload imagem (privada)
  uploadStoreImage: RequestHandler = async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const usuarioId = authReq.user?.usuarioId;
      if (!usuarioId) return res.status(401).json({ error: "Não autorizado." });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "Arquivo não enviado." });

      const proto =
        (req.headers["x-forwarded-proto"] as string) ||
        (req.headers["x-forwarded-protocol"] as string) ||
        req.protocol;

      const host = req.get("host");
      const relativePath = `/uploads/images/${file.filename}`;
      const url = `${proto}://${host}${relativePath}`;

      return res.json({
        ok: true,
        url,
        path: relativePath,
        filename: file.filename,
        mime: file.mimetype,
        size: file.size,
      });
    } catch (err: any) {
      console.error("Erro no uploadStoreImage:", err);
      return res.status(500).json({ error: err?.message || "Erro no upload." });
    }
  };

  updateHtmlDraft: RequestHandler = async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const usuarioId = authReq.user?.usuarioId;
    if (!usuarioId) return res.status(401).json({ error: "Não autorizado." });

    const html = String(req.body?.html || "");
    const css = String(req.body?.css || "");

    if (!html) return res.status(400).json({ error: "HTML vazio." });

    const repo = this.aiStoreService.getRepository(Store);
    const store = await repo.findOne({ where: { usuarioId } });
    if (!store) return res.status(404).json({ error: "Store não encontrada." });

    const safeHtml = sanitizeHtmlBasic(html, {
      allowScripts: false,
      allowTailwindCdn: false,
    });

    (store as any).pageHtmlDraft = safeHtml;
    (store as any).pageCssDraft = css; // ✅ AGORA SALVA CSS TAMBÉM

    await repo.save(store);
    return res.json({ ok: true });
  };

  publishHtml: RequestHandler = async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const usuarioId = authReq.user?.usuarioId; // ✅ Padrão usuarioId

      if (!usuarioId) {
        return res.status(401).json({ ok: false, error: "Não autorizado." });
      }

      // 🔥 A MUDANÇA ESTÁ AQUI:
      // Em vez de usar o repo aqui, chamamos o método do service que já tem a lógica
      const store = await this.aiStoreService.publishHtml(String(usuarioId));

      return res.json({
        ok: true,
        message: "Loja publicada com sucesso!",
        publishedAt: (store as any).lastPublishedAt
      });

    } catch (e: any) {
      console.error("🔥 [publish-html] ERROR:", e);
      return res.status(e.message === "Store não encontrada" ? 404 : 500).json({
        ok: false,
        message: e.message || "Erro ao publicar loja"
      });
    }
  };

  registrarInteracao: RequestHandler = async (req, res) => {
    try {
      const { lojaId, usuarioId, tipoInteracao, metaData, condominioId } = req.body;

      if (!lojaId || !tipoInteracao) {
        return res.status(400).json({ error: "Dados insuficientes para registrar interação." });
      }

      // Usamos o queryRunner ou o repositório genérico para salvar
      const repo = this.aiStoreService.getRepository(LojaInteracao);

      const novaInteracao = await repo.save({
        lojaId,
        usuarioId: usuarioId || null,
        tipoInteracao,
        metaData,
        condominioId
      });

      // 💡 Dica: Aqui você poderia disparar um e-mail ou notificação Push 
      // para o dono da loja avisando sobre o novo Lead.

      return res.json({ ok: true, id: novaInteracao.id });
    } catch (error: any) {
      console.error("Erro ao registrar interação/lead:", error);
      return res.status(500).json({ error: "Erro interno ao processar lead." });
    }
  };


  listMyLeads: RequestHandler = async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const currentUserId = authReq.user?.usuarioId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Não autorizado." });
      }

      const leads = await this.aiStoreService.getLeadsByOwner(currentUserId);

      // Garante que retorne um array vazio se não houver nada, evitando erro no .map do front
      return res.json(leads || []);
    } catch (error: any) {
      console.error("ERRO NO ENDPOINT LEADS:", error);
      return res.status(500).json({ error: "Erro interno ao listar leads." });
    }
  };

  criarDesejo: RequestHandler = async (req, res) => {
    try {
      const { lojaId, loja_id, nome, telefone } = req.body;

      if (!(lojaId || loja_id) || !nome || !telefone) {
        return res.status(400).json({
          error: "Loja, nome e telefone são obrigatórios.",
        });
      }

      const desejo = await this.listaDesejosService.criar(req.body);

      return res.status(201).json({
        success: true,
        message: "Desejo registrado com sucesso.",
        desejo,
      });
    } catch (error: any) {
      console.error("Erro ao registrar desejo:", error);
      return res.status(500).json({
        error: "Erro interno ao registrar desejo.",
        details: error.message,
      });
    }
  };

  updateStoreCover: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;

      const currentUserId = authReq.user?.usuarioId;

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      const repo = this.aiStoreService.getRepository(Store);

      const store = await repo.findOne({
        where: {
          id,
          usuarioId: currentUserId,
        },
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Loja não encontrada.",
        });
      }

      const capaUrl = String(req.body?.capa_url || "").trim();

      if (!capaUrl) {
        return res.status(400).json({
          success: false,
          message: "capa_url é obrigatória.",
        });
      }

      store.capa_url = capaUrl;

      await repo.save(store);

      console.log("CAPA DA STORE ATUALIZADA:", {
        storeId: store.id,
        capa_url: store.capa_url,
      });

      return res.json({
        success: true,
        storeId: store.id,
        capa_url: store.capa_url,
      });
    } catch (error: any) {
      console.error("ERRO AO ATUALIZAR CAPA:", error);

      return res.status(500).json({
        success: false,
        message: error?.message || "Erro ao atualizar capa.",
      });
    }
  };
}

