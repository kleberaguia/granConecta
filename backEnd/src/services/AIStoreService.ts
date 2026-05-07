// src/services/AIStoreService.ts

import { AppDataSource } from "../config/data-source";
import { Store } from "../models/StoreModels";
import { Product } from "../models/ProdutoModels";
import { Order } from "../models/OrderModels";
import fs from "fs";
import path from "path";
import type { EntityTarget, ObjectLiteral, Repository } from "typeorm";

export class AIStoreService {
  private storeRepo: Repository<Store>;
  private productRepo: Repository<Product>;
  private orderRepo: Repository<Order>;

  constructor() {
    this.storeRepo = this.getRepository(Store);
    this.productRepo = this.getRepository(Product);
    this.orderRepo = this.getRepository(Order);
  }

  public getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>
  ): Repository<T> {
    return AppDataSource.getRepository(entity);
  }

  // ===============================
  // STORE READ
  // ===============================

  async getStoreById(id: string) {
    return await this.storeRepo.findOne({
      where: { id } as any,
      relations: ["products"],
    });
  }

  async getAllPublicStores() {
    return await this.storeRepo.find({
      where: { ativa: true } as any,
      select: {
        id: true,
        usuarioId: true,
        slug: true,
        name: true,
        ativa: true,
        capa_url: true,
        tipo: true,
        categoria: true,
        categoria_tag: true,
      },
      order: { name: "ASC" },
    });
  }

  async getStoreBySlug(slug: string) {
    return await this.storeRepo.findOne({
      where: { slug } as any,
      relations: ["products"],
    });
  }

  async getStoreByUserId(usuarioId: string) {
    return await this.storeRepo.findOne({
      where: { usuarioId } as any,
      relations: ["products"],
    });
  }

  // ===============================
  // STORE UPSERT
  // ===============================

  async saveOrUpdateStore(usuarioId: string, data: any) {
    // 1. Busca a loja existente ou cria uma nova
    let store = await this.storeRepo.findOne({ where: { usuarioId } });

    if (!store) {
      store = this.storeRepo.create({ usuarioId });
    }

    // 2. Lógica de imagem (Mantida e melhorada)
    if (data.heroImageBuffer) {
      const fileName = `loja-${usuarioId}-${Date.now()}.png`;
      const uploadDir = path.join(__dirname, "../../uploads/images");
      const fullPath = path.join(uploadDir, fileName);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(fullPath, data.heroImageBuffer);
      // Salva o caminho relativo para ser acessível via URL
      data.capa_url = `/uploads/images/${fileName}`;
    }

    // 3. Mapeamento de Dados (Onde estava o erro de salvamento)
    // Usamos || store.campo para não sobrescrever com vazio caso o front não envie algo específico
    store.name = data.name || store.name;
    store.slug = data.slug || store.slug;
    store.pageHtmlPublished = data.pageHtmlPublished || store.pageHtmlPublished;
    store.capa_url = data.capa_url || store.capa_url;

    // Categorias e Tipos
    store.categoria = data.categoria || store.categoria;
    store.categoriaid = data.categoriaid || store.categoriaid;
    store.tipo = data.tipo || store.tipo;

    // 4. PERSISTÊNCIA DO EDITOR (O JSON da IA)
    // O layoutConfig que vem do controller deve ir para o pageSpecDraft (coluna do banco)
    if (data.layoutConfig) {
      (store as any).pageSpecDraft = data.layoutConfig;
      // Também atualizamos o layoutConfig se ele existir como coluna separada
      store.layoutConfig = data.layoutConfig;
    }

    // Estilo visual
    if (data.estilo) {
      store.estilo = data.estilo;
    }

    // 5. Condomínio (Seguindo sua regra de ser opcional)
    if (data.condominioId !== undefined) {
      (store as any).condominioId = data.condominioId;
    }

    // 6. Salva e retorna
    return await this.storeRepo.save(store);
  }
  // ===============================
  // HTML DRAFT / PUBLICAR
  // ===============================

  async updateHtmlDraft(usuarioId: string, html: string, css: string) {
    const store = await this.getStoreByUserId(usuarioId);
    if (!store) throw new Error("Store não encontrada");

    (store as any).pageHtmlDraft = html;
    (store as any).pageCssDraft = css;

    return await this.storeRepo.save(store);
  }

  async publishHtml(usuarioId: string) {
    const store = await this.getStoreByUserId(usuarioId);
    if (!store) throw new Error("Store não encontrada");

    if (!(store as any).pageHtmlDraft) {
      throw new Error("Rascunho inexistente.");
    }

    (store as any).pageHtmlPublished =
      (store as any).pageHtmlDraft;

    (store as any).pageCssPublished =
      (store as any).pageCssDraft || "";

    (store as any).lastPublishedAt = new Date();

    return await this.storeRepo.save(store);
  }

  // ===============================
  // PEDIDOS
  // ===============================

  async getOrdersByOwnerId(userId: string | number) {
    return await this.orderRepo.find({
      where: {
        store: { owner: { id: String(userId) } as any } as any,
      } as any,
      relations: ["items", "items.product", "customer"],
      order: { createdAt: "DESC" } as any,
    });
  }

  async getLeadsByOwner(usuarioId: string) {
    try {
      // Usamos o manager para garantir que a query rode mesmo sem uma classe Entity formal
      const repo = this.getRepository(Store); // Pegamos o repo de Store que já existe

      return await repo.manager.createQueryBuilder()
        .select([
          "lead.id AS id",
          "lead.tipoInteracao AS tipoInteracao",
          "lead.metaData AS metaData",
          "lead.createdAt AS createdAt",
          "store.name AS storeName"
        ])
        .from("loja_interacoes", "lead") // Tabela alvo
        .innerJoin("stores", "store", "store.id = lead.lojaId") // Join com stores
        .where("store.usuarioId = :usuarioId", { usuarioId })
        .orderBy("lead.createdAt", "DESC")
        .getRawMany(); // getRawMany é melhor quando lidamos com tabelas sem Entity definida
    } catch (err) {
      console.error("Erro na query de leads:", err);
      throw err;
    }
  }
}