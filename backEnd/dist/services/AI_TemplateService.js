"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source"); // Ajuste conforme seu projeto
const StoreModels_1 = require("../models/StoreModels");
const slugify_1 = __importDefault(require("slugify")); // npm install slugify
class AITemplateService {
    constructor() {
        this.storeRepository = data_source_1.AppDataSource.getRepository(StoreModels_1.Store);
    }
    async saveStoreProgress(id, data, files) {
        let store = null;
        // 1. BLINDAGEM DE BUSCA: Evita erro de sintaxe de UUID no banco
        const validId = (id && id !== "undefined" && id !== "null" && id.length > 5) ? id : null;
        if (validId) {
            store = await this.storeRepository.findOne({ where: { id: validId } });
        }
        else if (data.usuarioId && data.usuarioId !== "undefined" && data.tipo) {
            // Busca por dono + tipo para evitar duplicidade de lojas do mesmo tipo
            store = await this.storeRepository.findOne({
                where: {
                    usuarioId: data.usuarioId,
                    tipo: data.tipo
                }
            });
        }
        // 2. CRIAÇÃO: Se não existir, instanciamos
        if (!store) {
            store = this.storeRepository.create({
                tipo: data.tipo || "empreendedor",
                ativa: false
            });
        }
        // 3. SLUG: Proteção contra nome vazio
        if (data.name && (!store.slug || data.name !== store.name)) {
            let baseSlug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
            let finalSlug = baseSlug;
            let counter = 1;
            // Loop para verificar se o slug já existe (apenas se for uma nova loja ou mudou o nome)
            while (true) {
                const existingStore = await this.storeRepository.findOne({
                    where: { slug: finalSlug }
                });
                // Se não existir ninguém com esse slug, ou se a loja que achamos for a PRÓPRIA loja (edição)
                if (!existingStore || existingStore.id === store.id) {
                    break;
                }
                // Se existir, adiciona um sufixo (ex: pedreiros-and-irmaos-1)
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            store.name = data.name;
            store.slug = finalSlug;
        }
        // 4. GESTÃO DE UPLOADS
        if (files) {
            if (files["foto_perfil_url"]?.[0]) {
                store.logo_url = `/uploads/images/${files["foto_perfil_url"][0].filename}`;
            }
            if (files["foto_hero_url"]?.[0]) {
                store.capa_url = `/uploads/images/${files["foto_hero_url"][0].filename}`;
            }
        }
        // 5. DADOS PRINCIPAIS (Blindagem contra strings "undefined")
        if (data.usuarioId && data.usuarioId !== "undefined")
            store.usuarioId = data.usuarioId;
        // Blindagem do condominio_id (Se for string vazia ou "null", mandamos null real para o banco)
        if (data.condominio_id && data.condominio_id !== "undefined" && data.condominio_id !== "null" && data.condominio_id !== "") {
            store.condominio_id = data.condominio_id;
        }
        else {
            // Se o seu banco permitir null, isso evita erro 500 de FK
            store.condominio_id = store.condominio_id || '';
        }
        // 6. DESIGN
        store.bodyBgColor = data.bodyBgColor || store.bodyBgColor || "#ffffff";
        store.footerBgColor = data.footerBgColor || store.footerBgColor || "#000000";
        store.footerTextColor = data.footerTextColor || store.footerTextColor || "#ffffff";
        // 7. CATEGORIAS
        if (data.categoriaid)
            store.categoriaid = data.categoriaid;
        if (data.categoria_tag)
            store.categoria_tag = data.categoria_tag;
        if (data.tipo)
            store.tipo = data.tipo;
        // 8. CONTEÚDO (HTML/CSS)
        if (data.pageHtmlPublished !== undefined)
            store.pageHtmlPublished = data.pageHtmlPublished;
        if (data.pageCssPublished !== undefined)
            store.pageCssPublished = data.pageCssPublished;
        store.pageHtmlDraft = data.pageHtmlDraft ?? data.html ?? store.pageHtmlDraft;
        store.pageCssDraft = data.pageCssDraft ?? data.css ?? store.pageCssDraft;
        // 9. SALVAMENTO COM TRY-CATCH para capturar o erro exato do Banco
        try {
            return await this.storeRepository.save(store);
        }
        catch (error) {
            console.error("Erro fatal ao salvar no banco (TypeORM):", error.message);
            throw new Error(`Erro ao salvar loja: ${error.message}`);
        }
    }
    async publishStore(id) {
        const store = await this.storeRepository.findOne({ where: { id } });
        if (!store)
            throw new Error("Loja não encontrada");
        store.pageHtmlPublished = store.pageHtmlDraft ?? null;
        store.pageCssPublished = store.pageCssDraft ?? null;
        store.ativa = true;
        return await this.storeRepository.save(store);
    }
}
exports.default = new AITemplateService();
