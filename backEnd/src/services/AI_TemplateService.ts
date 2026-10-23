import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Store } from "../models/StoreModels";
import slugify from "slugify";

type PerfilNegocio = "prestador" | "empreendedor";

export interface Usuarios {
    id: string;
    perfis: PerfilNegocio[];
}

class AITemplateService {
    private storeRepository: Repository<Store>;

    constructor() {
        this.storeRepository = AppDataSource.getRepository(Store);
    }

    async saveStoreProgress(id: string | null, data: any = {}, files: any = null) {
        const clean = (value: any) => {
            if (value === undefined || value === null) return undefined;

            const text = String(value).trim();

            if (!text) return undefined;
            if (text === "undefined") return undefined;
            if (text === "null") return undefined;

            return value;
        };

        const firstClean = (...values: any[]) => {
            for (const value of values) {
                const cleaned = clean(value);
                if (cleaned !== undefined) return cleaned;
            }

            return undefined;
        };

        const settings = data.settings || {};

        const validId =
            clean(id) && String(id).length > 5
                ? String(id)
                : null;

        const usuarioId = clean(data.usuarioId)
            ? String(data.usuarioId)
            : null;

        const tipoRecebido = String(
            firstClean(
                data.tipoStore,
                data.tipo,
                data.store_tipo,
                data.tipo_negocio,
                settings.tipoStore,
                settings.tipo,
                settings.store_tipo,
                "loja",
            ),
        );

        let store: Store | null = null;

        if (validId) {
            store = await this.storeRepository.findOne({
                where: { id: validId },
            });
        }

        if (!store && usuarioId) {
            store = await this.storeRepository
                .createQueryBuilder("store")
                .where("store.usuarioId = :usuarioId", { usuarioId })
                .getOne();
        }

        const isNewStore = !store;

        if (!store) {
            if (!usuarioId) {
                throw new Error("usuarioId é obrigatório para criar uma loja.");
            }

            store = new Store();
            store.usuarioId = usuarioId;
            store.tipo = tipoRecebido;
            store.ativa = false;
        }

        const oldName = store.name;

        const incomingName =
            firstClean(
                data.name,
                data.store_name,
                data.nome_loja,
                settings.name,
                settings.store_name,
            ) || (isNewStore ? "Minha Página" : undefined);

        const incomingSlug = firstClean(
            data.slug,
            data.store_slug,
            settings.slug,
            settings.store_slug,
        );

        if (incomingName) {
            store.name = String(incomingName);
        }

        if (incomingSlug) {
            store.slug = await this.resolveUniqueSlug(String(incomingSlug), store.id);
        } else if (incomingName && (isNewStore || !store.slug || oldName !== incomingName)) {
            store.slug = await this.resolveUniqueSlug(String(incomingName), store.id);
        }

        if (files) {
            if (files["foto_perfil_url"]?.[0]) {
                store.logo_url = `/uploads/images/${files["foto_perfil_url"][0].filename}`;
            }

            if (files["foto_hero_url"]?.[0]) {
                store.capa_url = `/uploads/images/${files["foto_hero_url"][0].filename}`;
            }
        }

        const incomingLogo = firstClean(
            data.logo_url,
            settings.logo_url,
            data.footer_logo_url,
        );

        const incomingCapa = firstClean(
            data.capa_url,
            settings.capa_url,
        );

        if (incomingLogo) {
            store.logo_url = String(incomingLogo);
        }

        if (incomingCapa) {
            store.capa_url = String(incomingCapa);
        }

        if (usuarioId) {
            store.usuarioId = usuarioId;
        }

        if (clean(data.condominio_id)) {
            store.condominio_id = String(data.condominio_id);
        }

        const whatsapp = firstClean(
            data.whatsapp,
            data.telefone_whatsapp,
            data.store_whatsapp,
            data.storeWhatsapp,
            data.lojaWhatsapp,
            data.loja_whatsapp,
            data.numero_whatsapp,
            data.numeroWhatsapp,
            data.telefone,
            data.phone,
            data.celular,
            settings.whatsapp,
            settings.telefone_whatsapp,
            settings.store_whatsapp,
            settings.storeWhatsapp,
            settings.lojaWhatsapp,
            settings.loja_whatsapp,
            settings.numero_whatsapp,
            settings.numeroWhatsapp,
            settings.telefone,
            settings.phone,
            settings.celular,
        );

        if (whatsapp) {
            const whatsappText = String(whatsapp).replace(/\D/g, "");

            const normalizedWhatsapp = whatsappText.startsWith("55")
                ? whatsappText
                : `55${whatsappText}`;

            // ===== COLUNA REAL DA TABELA =====
            store.telefoneWhatsapp = normalizedWhatsapp;

            // Compatibilidade durante a execução
            (store as any).whatsapp = normalizedWhatsapp;
            (store as any).telefone_whatsapp = normalizedWhatsapp;
            (store as any).store_whatsapp = normalizedWhatsapp;
            (store as any).numero_whatsapp = normalizedWhatsapp;

            (store as any).telefone = normalizedWhatsapp;
            (store as any).celular = normalizedWhatsapp;
        }

        const descricao = firstClean(
            data.descricao_loja,
            data.description,
            settings.descricao_loja,
            settings.description,
        );

        if (descricao) {
            store.descricao_loja = String(descricao);
        }

        store.bodyBgColor =
            firstClean(data.bodyBgColor, settings.bodyBgColor) ||
            store.bodyBgColor ||
            "#ffffff";

        store.footerBgColor =
            firstClean(data.footerBgColor, settings.footerBgColor) ||
            store.footerBgColor ||
            "#000000";

        store.footerTextColor =
            firstClean(data.footerTextColor, settings.footerTextColor) ||
            store.footerTextColor ||
            "#ffffff";

        const categoriaid = firstClean(
            data.categoriaid,
            data.categoriaId,
            data.categoria_id,
            data.categoryId,
            data.category_id,
            settings.categoriaid,
            settings.categoriaId,
            settings.categoria_id,
            settings.categoryId,
            settings.category_id,
        );

        const categoria = firstClean(
            data.categoria,
            data.categoria_nome,
            data.category,
            data.category_name,
            settings.categoria,
            settings.categoria_nome,
            settings.category,
            settings.category_name,
        );

        const categoriaTag = firstClean(
            data.categoria_tag,
            data.categoriaTag,
            data.category_tag,
            data.categoryTag,
            settings.categoria_tag,
            settings.categoriaTag,
            settings.category_tag,
            settings.categoryTag,
        );

        const categoriaidNumber =
            categoriaid !== undefined && Number.isFinite(Number(categoriaid))
                ? Number(categoriaid)
                : undefined;

        if (categoriaidNumber !== undefined) {
            store.categoriaid = categoriaidNumber;
        }

        if (categoria) {
            store.categoria = String(categoria);
        }

        if (categoriaTag) {
            store.categoria_tag = String(categoriaTag);
        }

        store.tipo = tipoRecebido;

        if (clean(data.templateId)) {
            store.templateId = String(data.templateId);
        }

        const layoutConfig = {
            ...(typeof store.layoutConfig === "object" && store.layoutConfig
                ? store.layoutConfig
                : {}),
            ...(data.layoutConfig || {}),
            ...(data.customization ? { customization: data.customization } : {}),
            settings: {
                ...(data.layoutConfig?.settings || {}),
                ...(settings || {}),
                ...(whatsapp
                    ? {
                        whatsapp: String(whatsapp),
                        telefone_whatsapp: String(whatsapp),
                        store_whatsapp: String(whatsapp),
                        storeWhatsapp: String(whatsapp),
                        lojaWhatsapp: String(whatsapp),
                        numero_whatsapp: String(whatsapp),
                    }
                    : {}),
                ...(categoriaidNumber !== undefined ? { categoriaid: categoriaidNumber } : {}),
                ...(categoria ? { categoria: String(categoria) } : {}),
                ...(categoriaTag ? { categoria_tag: String(categoriaTag) } : {}),
                tipo: tipoRecebido,
            },
            updatedByEditor: true,
            updatedAt: new Date().toISOString(),
        };

        store.layoutConfig = layoutConfig as any;

        const htmlDraft =
            data.pageHtmlDraft !== undefined
                ? data.pageHtmlDraft
                : data.html !== undefined
                    ? data.html
                    : undefined;

        const htmlPublished =
            data.pageHtmlPublished !== undefined
                ? data.pageHtmlPublished
                : data.publish === true && htmlDraft !== undefined
                    ? htmlDraft
                    : undefined;

        const cssDraft =
            data.pageCssDraft !== undefined
                ? data.pageCssDraft
                : data.css !== undefined
                    ? data.css
                    : undefined;

        if (htmlDraft !== undefined) {
            store.pageHtmlDraft = htmlDraft;
        }

        if (htmlPublished !== undefined) {
            store.pageHtmlPublished = htmlPublished;
            store.ativa = true;
        }

        if (cssDraft !== undefined) {
            store.pageCssDraft = cssDraft;
        }

        if (data.pageCssPublished !== undefined) {
            store.pageCssPublished = data.pageCssPublished;
        }

        if (!store.usuarioId) {
            throw new Error("usuarioId é obrigatório para salvar a loja.");
        }

        if (!store.name) {
            store.name = "Minha Página";
        }

        if (!store.slug) {
            store.slug = await this.resolveUniqueSlug(store.name, store.id);
        }


        console.log('Saveeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee ', store)

        try {
            return await this.storeRepository.save(store);
        } catch (error: any) {
            console.error("Erro fatal ao salvar no banco (TypeORM):", error);
            throw new Error(`Erro ao salvar loja: ${error.message}`);
        }
    }

    async publishStore(id: string) {
        const store = await this.storeRepository.findOne({ where: { id } });

        if (!store) {
            throw new Error("Loja não encontrada");
        }

        store.pageHtmlPublished = store.pageHtmlDraft ?? null;
        store.pageCssPublished = store.pageCssDraft ?? null;
        store.ativa = true;

        return await this.storeRepository.save(store);
    }

    private async resolveUniqueSlug(value: string, currentStoreId?: string): Promise<string> {
        const baseSlug =
            slugify(value, {
                lower: true,
                strict: true,
                trim: true,
            }) || `loja-${Date.now()}`;

        let finalSlug = baseSlug;
        let counter = 1;

        while (true) {
            const existingStore = await this.storeRepository.findOne({
                where: { slug: finalSlug },
            });

            if (!existingStore || existingStore.id === currentStoreId) {
                return finalSlug;
            }

            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
}

export default new AITemplateService();