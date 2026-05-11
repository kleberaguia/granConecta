"use strict";
// src/services/AIStoreService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIStoreService = void 0;
const data_source_1 = require("../config/data-source");
const StoreModels_1 = require("../models/StoreModels");
const ProdutoModels_1 = require("../models/ProdutoModels");
const OrderModels_1 = require("../models/OrderModels");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AIStoreService {
    constructor() {
        this.storeRepo = this.getRepository(StoreModels_1.Store);
        this.productRepo = this.getRepository(ProdutoModels_1.Product);
        this.orderRepo = this.getRepository(OrderModels_1.Order);
    }
    getRepository(entity) {
        return data_source_1.AppDataSource.getRepository(entity);
    }
    // ===============================
    // STORE READ
    // ===============================
    async getStoreById(id) {
        return await this.storeRepo.findOne({
            where: { id },
            relations: ["products"],
        });
    }
    async getAllPublicStores() {
        return await this.storeRepo.find({
            where: { ativa: true },
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
    async getStoreBySlug(slug) {
        return await this.storeRepo.findOne({
            where: { slug },
            relations: ["products"],
        });
    }
    async getStoreByUserId(usuarioId) {
        return await this.storeRepo.findOne({
            where: { usuarioId },
            relations: ["products"],
        });
    }
    // ===============================
    // STORE UPSERT
    // ===============================
    async saveOrUpdateStore(usuarioId, data) {
        // 1. Busca a loja existente ou cria uma nova
        let store = await this.storeRepo.findOne({ where: { usuarioId } });
        if (!store) {
            store = this.storeRepo.create({ usuarioId });
        }
        // 2. Lógica de imagem (Mantida e melhorada)
        if (data.heroImageBuffer) {
            const fileName = `loja-${usuarioId}-${Date.now()}.png`;
            const uploadDir = path_1.default.join(__dirname, "../../uploads/images");
            const fullPath = path_1.default.join(uploadDir, fileName);
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            fs_1.default.writeFileSync(fullPath, data.heroImageBuffer);
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
            store.pageSpecDraft = data.layoutConfig;
            // Também atualizamos o layoutConfig se ele existir como coluna separada
            store.layoutConfig = data.layoutConfig;
        }
        // Estilo visual
        if (data.estilo) {
            store.estilo = data.estilo;
        }
        // 5. Condomínio (Seguindo sua regra de ser opcional)
        if (data.condominioId !== undefined) {
            store.condominioId = data.condominioId;
        }
        // 6. Salva e retorna
        return await this.storeRepo.save(store);
    }
    // ===============================
    // HTML DRAFT / PUBLICAR
    // ===============================
    async updateHtmlDraft(usuarioId, html, css) {
        const store = await this.getStoreByUserId(usuarioId);
        if (!store)
            throw new Error("Store não encontrada");
        store.pageHtmlDraft = html;
        store.pageCssDraft = css;
        return await this.storeRepo.save(store);
    }
    async publishHtml(usuarioId) {
        const store = await this.getStoreByUserId(usuarioId);
        if (!store)
            throw new Error("Store não encontrada");
        if (!store.pageHtmlDraft) {
            throw new Error("Rascunho inexistente.");
        }
        store.pageHtmlPublished =
            store.pageHtmlDraft;
        store.pageCssPublished =
            store.pageCssDraft || "";
        store.lastPublishedAt = new Date();
        return await this.storeRepo.save(store);
    }
    // ===============================
    // PEDIDOS
    // ===============================
    async getOrdersByOwnerId(userId) {
        return await this.orderRepo.find({
            where: {
                store: { owner: { id: String(userId) } },
            },
            relations: ["items", "items.product", "customer"],
            order: { createdAt: "DESC" },
        });
    }
    async getLeadsByOwner(usuarioId) {
        try {
            // Usamos o manager para garantir que a query rode mesmo sem uma classe Entity formal
            const repo = this.getRepository(StoreModels_1.Store); // Pegamos o repo de Store que já existe
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
        }
        catch (err) {
            console.error("Erro na query de leads:", err);
            throw err;
        }
    }
}
exports.AIStoreService = AIStoreService;
