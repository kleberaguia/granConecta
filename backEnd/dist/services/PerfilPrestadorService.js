"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// PerfilPrestadorService.ts
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
const openai_1 = __importDefault(require("openai"));
const data_source_1 = require("../config/data-source");
const PerfilPrestadorModel_1 = require("../models/PerfilPrestadorModel");
const StoreModels_1 = require("../models/StoreModels");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
/**
 * =========================================================
 * OpenAI client (singleton)
 * =========================================================
 */
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
function getOpenAIModel() {
    return process.env.OPENAI_MODEL || "gpt-4o";
}
function stripAllScripts(html) {
    return String(html || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}
function stripAllScriptsExceptTailwind(html) {
    const allowTailwind = /https?:\/\/cdn\.tailwindcss\.com\/?$/i;
    return String(html || "").replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
        const attrStr = String(attrs || "");
        const bodyStr = String(body || "").trim();
        // Se tiver corpo => é inline => remove
        if (bodyStr.length > 0)
            return "";
        // Se tiver src => só permite tailwind
        const srcMatch = attrStr.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
        const src = srcMatch?.[1] || "";
        if (src && allowTailwind.test(src))
            return `<script src="https://cdn.tailwindcss.com"></script>`;
        return "";
    });
}
/**
 * =========================================================
 * Helpers (parse / ids / guards)
 * =========================================================
 */
function safeJsonParse(x) {
    try {
        return typeof x === "string" ? JSON.parse(x) : x;
    }
    catch {
        return null;
    }
}
function isObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}
function makeId() {
    try {
        return (0, crypto_1.randomUUID)();
    }
    catch {
        return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
}
/**
 * =========================================================
 * Screenshot-to-Code helpers (HTML extraction + sanitização)
 * =========================================================
 */
function extractHtml(raw) {
    if (!raw)
        return "";
    const cleaned = raw.replace(/```html/gi, "").replace(/```/g, "").trim();
    const matchDoctype = cleaned.match(/<!doctype html[\s\S]*<\/html>/i);
    if (matchDoctype)
        return matchDoctype[0].trim();
    const matchHtml = cleaned.match(/<html[\s\S]*<\/html>/i);
    if (matchHtml)
        return matchHtml[0].trim();
    return cleaned;
}
/**
 * ✅ NOVO: injeta script do editor HTML (troca imagens e bg via upload)
 * - assinado com data-editor="true" para passar no sanitizer
 * - usa /store/upload
 */
function injectHtmlEditorScript(html) {
    const script = `
<script data-editor="true">
(function () {
  const API_UPLOAD = "/store/upload";

  function getToken() {
    try { return localStorage.getItem("token"); } catch { return null; }
  }

  async function uploadFile(file) {
    const form = new FormData();
    form.append("file", file);

    const headers = {};
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const resp = await fetch(API_UPLOAD, { method: "POST", headers, body: form });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) throw new Error(data.error || data.message || "Falha no upload");
    return data.url || data.path;
  }

  function pickImage(onPick) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.onchange = () => {
      const f = input.files && input.files[0];
      input.remove();
      if (f) onPick(f);
    };
    input.click();
  }

  // IMG
  document.addEventListener("click", function (e) {
    const img = e.target && e.target.closest && e.target.closest('[data-edit="image"]');
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();

    pickImage(async (file) => {
      try {
        img.style.opacity = "0.6";
        const url = await uploadFile(file);
        img.setAttribute("src", url);
      } catch (err) {
        alert((err && err.message) || "Erro ao enviar imagem");
      } finally {
        img.style.opacity = "1";
      }
    });
  }, true);

  // BG
  document.addEventListener("click", function (e) {
    const el = e.target && e.target.closest && e.target.closest('[data-edit="bg"]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();

    pickImage(async (file) => {
      try {
        el.style.opacity = "0.85";
        const url = await uploadFile(file);
        el.style.backgroundImage = "url('" + url + "')";
      } catch (err) {
        alert((err && err.message) || "Erro ao enviar imagem");
      } finally {
        el.style.opacity = "1";
      }
    });
  }, true);
})();
</script>
`.trim();
    // evita duplicar
    if (/data-editor\s*=\s*["']true["']/.test(html))
        return html;
    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, `${script}\n</body>`);
    }
    return html + "\n" + script;
}
/**
 * ✅ Sanitização básica para evitar XSS
 * Agora permite SOMENTE o script assinado do editor (data-editor="true")
 */
function sanitizeHtmlBasic(html, opts) {
    if (!html)
        return "";
    const allowTailwindCdn = opts?.allowTailwindCdn ?? true;
    const allowScripts = opts?.allowScripts ?? false; // ✅ default: NÃO permitir scripts
    const allowInlineEditorScript = opts?.allowInlineEditorScript ?? false; // ✅ default: NÃO permitir inline editor
    let out = html;
    out = out.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
        const attrStr = String(attrs || "");
        const bodyStr = String(body || "").trim();
        if (!allowScripts)
            return "";
        const isEditorScript = /\bdata-editor\s*=\s*["']true["']/i.test(attrStr);
        // inline script -> remove (exceto editor assinado, se você QUISER permitir)
        if (bodyStr.length > 0) {
            if (allowInlineEditorScript && isEditorScript) {
                const safeAttrs = attrStr
                    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
                    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
                return `<script${safeAttrs}>${body}</script>`;
            }
            return "";
        }
        // externo -> whitelist (tailwind)
        const srcMatch = attrStr.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
        const src = srcMatch?.[1] ? String(srcMatch[1]) : "";
        if (!src)
            return "";
        if (allowTailwindCdn && /https?:\/\/cdn\.tailwindcss\.com\/?$/i.test(src)) {
            const safeAttrs = attrStr
                .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
                .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
            return `<script${safeAttrs}></script>`;
        }
        return "";
    });
    // remove handlers on*
    out = out.replace(/\son\w+="[^"]*"/gi, "");
    out = out.replace(/\son\w+='[^']*'/gi, "");
    // bloqueia javascript:
    out = out.replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, `$1="#"`);
    // remove iframes/objects/embeds
    out = out.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "");
    out = out.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "");
    out = out.replace(/<embed[\s\S]*?>/gi, "");
    return out;
}
/**
 * Remove coisas comuns que o modelo devolve errado:
 * - blocos markdown
 * - @tailwind directives
 * - garante Tailwind CDN
 * - garante fechamento
 */
function sanitizeGeneratedHtml(input) {
    let s = String(input || "").trim();
    s = s.replace(/```html/gi, "").replace(/```/g, "").trim();
    s = s.replace(/@tailwind\s+base;?/gi, "");
    s = s.replace(/@tailwind\s+components;?/gi, "");
    s = s.replace(/@tailwind\s+utilities;?/gi, "");
    const idx = s.toLowerCase().indexOf("<!doctype html");
    if (idx > 0)
        s = s.slice(idx).trim();
    if (!/<!doctype html>/i.test(s) && /<html[\s>]/i.test(s)) {
        s = "<!DOCTYPE html>\n" + s;
    }
    const hasTailwind = /cdn\.tailwindcss\.com/i.test(s);
    if (!hasTailwind && /<\/head>/i.test(s)) {
        s = s.replace(/<\/head>/i, `  <script src="https://cdn.tailwindcss.com"></script>\n</head>`);
    }
    if (/<body[\s>]/i.test(s) && !/<\/body>/i.test(s))
        s += "\n</body>";
    if (/<html[\s>]/i.test(s) && !/<\/html>/i.test(s))
        s += "\n</html>";
    return s.trim();
}
/**
 * ✅ Corrige bug clássico de aspas no style background-image
 */
function fixBrokenBackgroundUrls(html) {
    let out = String(html || "");
    out = out.replace(/url\("([^"]+)"\)/gi, "url('$1')");
    out = out.replace(/background-image\s*:\s*url\("([^"']+)'?\)\s*;?/gi, "background-image:url('$1');");
    out = out.replace(/background-image\s*:\s*url\("([^"]+)"\s*;/gi, "background-image:url('$1');");
    return out;
}
/**
 * ✅ Aplica constraints em imagens para não estourar layout
 */
function normalizeImageTags(html) {
    let out = String(html || "");
    out = out.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
        const a = String(attrs || "");
        const clsMatch = a.match(/\bclass\s*=\s*["']([^"']*)["']/i);
        const cls = clsMatch?.[1] || "";
        const hasW = /\bw-\S+/.test(cls) || /\bmax-w-\S+/.test(cls) || /\bw\[\S+/.test(cls);
        const hasH = /\bh-\S+/.test(cls) || /\bh\[\S+/.test(cls);
        const hasObj = /\bobject-(cover|contain|fill|none|scale-down)\b/.test(cls);
        if (hasW && hasH && hasObj)
            return `<img${a}>`;
        const baseAdd = "w-full h-auto max-w-full";
        const addObj = hasObj ? "" : " object-cover";
        const addRounded = /\brounded\b/.test(cls) ? "" : " rounded-md";
        const nextClass = (cls ? `${cls} ` : "") + `${baseAdd}${addObj}${addRounded}`.trim();
        if (clsMatch) {
            return `<img${a.replace(clsMatch[0], `class="${nextClass}"`)}>`;
        }
        return `<img${a} class="${nextClass}">`;
    });
    return out;
}
function looksLikeV2(x) {
    return (isObject(x) &&
        x.version === 2 &&
        typeof x.templateKey === "string" &&
        typeof x.templateId === "string" &&
        isObject(x.draft) &&
        Array.isArray(x.draft.blocks));
}
function ensureLayoutV2(current, opts) {
    const parsed = safeJsonParse(current);
    const normalizeBlock = (b) => {
        const type = b?.type || "hero";
        const base = {
            id: String(b?.id || makeId()),
            type,
            props: isObject(b?.props) ? b.props : {},
        };
        if (b?.minPlan)
            base.minPlan = b.minPlan;
        return base;
    };
    if (looksLikeV2(parsed)) {
        const templateId = (parsed.templateId || opts.templateId || "simple");
        const templateKey = String(parsed.templateKey || opts.templateKey || "premium_mecanico");
        const blocksRaw = Array.isArray(parsed.draft?.blocks) ? parsed.draft.blocks : [];
        const blocks = blocksRaw.map(normalizeBlock);
        return {
            version: 2,
            templateId,
            templateKey,
            draft: {
                content: isObject(parsed.draft?.content) ? parsed.draft.content : {},
                blocks,
            },
            ...(parsed.published ? { published: parsed.published } : {}),
        };
    }
    return {
        version: 2,
        templateKey: String(opts.templateKey || "premium_mecanico"),
        templateId: (opts.templateId || "simple"),
        draft: { content: {}, blocks: [] },
    };
}
function upsertBlock(blocks, type, props) {
    const idx = blocks.findIndex((b) => b.type === type);
    if (idx >= 0) {
        const current = blocks[idx];
        if (!current) {
            blocks.push({ id: makeId(), type, props: props || {} });
            return blocks;
        }
        blocks[idx] = {
            id: current.id,
            type: current.type,
            ...(current.minPlan ? { minPlan: current.minPlan } : {}),
            props: { ...(current.props || {}), ...(props || {}) },
        };
        return blocks;
    }
    blocks.push({ id: makeId(), type, props: props || {} });
    return blocks;
}
function applyGeminiToLayoutV2(currentLayoutConfig, ai, fotoHeroUrl, opts) {
    const ensureOpts = {};
    if (opts?.templateId)
        ensureOpts.templateId = opts.templateId;
    if (opts?.templateKey)
        ensureOpts.templateKey = opts.templateKey;
    const next = ensureLayoutV2(currentLayoutConfig, ensureOpts);
    const primary = ai?.primaryColor || "#1976d2";
    const secondary = ai?.secondaryColor || "#ffffff";
    next.draft.content = next.draft.content || {};
    next.draft.content.headline = ai?.heroTitle || next.draft.content.headline || "Bem-vindo";
    next.draft.content.subheadline = ai?.heroSubtitle || next.draft.content.subheadline || "";
    const heroProps = {
        layout: "split",
        bgType: fotoHeroUrl ? "image" : "gradient",
        gradientFrom: primary,
        gradientTo: secondary,
        title: ai?.heroTitle || "Bem-vindo",
        subtitle: ai?.heroSubtitle || "",
        titleColor: "#ffffff",
        subtitleColor: "#e0e0e0",
        buttonText: "Falar no WhatsApp",
        buttonColor: primary,
        buttonTextColor: "#111111",
    };
    if (fotoHeroUrl)
        heroProps.backgroundImage = fotoHeroUrl;
    upsertBlock(next.draft.blocks, "hero", heroProps);
    upsertBlock(next.draft.blocks, "features", {
        title: "Benefícios",
        subtitle: "",
        items: [
            { title: "Atendimento personalizado", description: "Um plano alinhado à sua rotina." },
            { title: "Resultados sustentáveis", description: "Evolução com consistência." },
            { title: "Acompanhamento", description: "Suporte no processo." },
        ],
    });
    upsertBlock(next.draft.blocks, "testimonials", {
        title: "Depoimentos",
        items: [
            { name: "Cliente", role: "", text: "Excelente atendimento e resultados." },
            { name: "Cliente", role: "", text: "Me senti acompanhado do início ao fim." },
        ],
    });
    upsertBlock(next.draft.blocks, "cta", {
        title: "Pronto para começar?",
        subtitle: "Clique no botão e fale comigo agora.",
        buttonText: "Chamar no WhatsApp",
        buttonColor: primary,
        buttonTextColor: "#111111",
    });
    upsertBlock(next.draft.blocks, "footer", {
        columns: [{ title: "Contato", links: [{ label: "WhatsApp" }, { label: "Instagram" }] }],
        copyright: `© ${new Date().getFullYear()}`,
    });
    if (ai?.propaganda)
        next.draft.content.propaganda = ai.propaganda;
    if (Array.isArray(ai?.vitrineItems))
        next.draft.content.vitrineItems = ai.vitrineItems;
    return next;
}
function v2ToPublicPreviewConfig(v2, defaults) {
    const out = {
        style: { ...(defaults?.style || {}) },
        content: { ...(defaults?.content || {}) },
        blocks: Array.isArray(defaults?.blocks) ? [...defaults.blocks] : [],
    };
    const blocks = Array.isArray(v2?.draft?.blocks) ? v2.draft.blocks : [];
    const hero = blocks.find((b) => b?.type === "hero");
    const heroProps = hero?.props || {};
    const brandColor = heroProps.buttonColor || heroProps.gradientFrom || out.style.brandColor || "#1976d2";
    const backgroundColor = heroProps.gradientTo || out.style.backgroundColor || "#ffffff";
    out.style.brandColor = brandColor;
    out.style.backgroundColor = backgroundColor;
    out.content.headline = heroProps.title || out.content.headline;
    out.content.subheadline = heroProps.subtitle || out.content.subheadline;
    const bgImage = heroProps.backgroundImage;
    if (bgImage) {
        let previewHero = out.blocks.find((b) => b?.type === "hero");
        if (!previewHero) {
            previewHero = { id: makeId(), type: "hero", props: {} };
            out.blocks.unshift(previewHero);
        }
        previewHero.props = previewHero.props || {};
        previewHero.props.media = { type: "image", url: bgImage };
    }
    const propaganda = v2?.draft?.content?.propaganda;
    const vitrineItems = v2?.draft?.content?.vitrineItems;
    if (propaganda)
        out.content.propaganda = propaganda;
    if (Array.isArray(vitrineItems))
        out.content.vitrineItems = vitrineItems;
    return out;
}
class PerfilPrestadorService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(PerfilPrestadorModel_1.PerfilPrestador);
    }
    async getByUsuarioId(usuarioId) {
        return await this.repo.findOne({
            where: { usuarioId },
            relations: ["tipoServicoPrincipal", "store"],
        });
    }
    /**
     * ✅ SALVAR PERFIL (V2 OU HTML)
     */
    async savePerfil(usuarioId, dados, arquivos = []) {
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1) Mapear arquivos
            const filesMap = {};
            if (Array.isArray(arquivos)) {
                for (const file of arquivos)
                    filesMap[file.fieldname] = file;
            }
            const iaFile = dados.ia_reference || filesMap["ia_reference"];
            // 2) Buscar ou criar Perfil / Store
            let perfil = await queryRunner.manager.findOne(PerfilPrestadorModel_1.PerfilPrestador, { where: { usuarioId } });
            if (!perfil)
                perfil = queryRunner.manager.create(PerfilPrestadorModel_1.PerfilPrestador, { usuarioId });
            let store = await queryRunner.manager.findOne(StoreModels_1.Store, { where: { usuarioId } });
            if (!store)
                store = queryRunner.manager.create(StoreModels_1.Store, { usuarioId });
            // 3) Layout inicial (V2)
            const incomingLayout = typeof dados.layoutConfig === "string" ? safeJsonParse(dados.layoutConfig) : dados.layoutConfig;
            let layoutInput = incomingLayout ?? store.layoutConfig ?? {};
            const templateId = (dados.templateId || store.templateId || "simple");
            const templateKey = String(dados.templateKey || layoutInput?.templateKey || store?.templateKey || "premium_mecanico");
            // 4) Imagens do usuário (upload)
            const foto_perfil_url = filesMap["foto_perfil_url"]
                ? `/uploads/images/${filesMap["foto_perfil_url"].filename}`
                : dados.foto_perfil_url || perfil.foto_perfil_url;
            const foto_hero_url = filesMap["foto_hero_url"]
                ? `/uploads/images/${filesMap["foto_hero_url"].filename}`
                : dados.foto_hero_url || perfil.foto_hero_url;
            // 5) IA: gerar HTML ou V2
            if (iaFile) {
                const imageBuffer = iaFile.buffer
                    ? iaFile.buffer
                    : iaFile.path && fs_1.default.existsSync(iaFile.path)
                        ? fs_1.default.readFileSync(iaFile.path)
                        : null;
                if (imageBuffer) {
                    try {
                        if (dados.editorMode === "html") {
                            let html = await PerfilPrestadorService.generatePageHtmlFromAI(imageBuffer, iaFile.mimetype || "image/png");
                            // ✅ injeta editor script e sanitiza permitindo o script assinado
                            html = injectHtmlEditorScript(html);
                            html = sanitizeHtmlBasic(html, { allowTailwindCdn: true, allowScripts: true, allowInlineEditorScript: true });
                            store.pageHtmlDraft = html;
                            console.log('aqui depois da IA ', html);
                        }
                        else {
                            const v2 = await PerfilPrestadorService.generateLayoutV2FromAI(imageBuffer, iaFile.mimetype || "image/png", templateKey);
                            v2.templateId = templateId;
                            v2.templateKey = templateKey;
                            const hero = v2?.draft?.blocks?.find((b) => b.type === "hero");
                            if (foto_hero_url && hero?.props) {
                                if (templateKey === "consultoria_imagem_v1") {
                                    if (!hero.props.sideImage) {
                                        hero.props.layout = "split";
                                        hero.props.overlayEnabled = false;
                                        hero.props.bgType = hero.props.bgType || "color";
                                        hero.props.sideImage = foto_hero_url;
                                    }
                                }
                                else {
                                    if (!hero.props.backgroundImage) {
                                        hero.props.bgType = "image";
                                        hero.props.backgroundImage = foto_hero_url;
                                    }
                                }
                            }
                            layoutInput = v2;
                        }
                    }
                    catch (e) {
                        console.warn("⚠️ Falha IA. Aplicando fallback.", e);
                        if (dados.editorMode !== "html") {
                            layoutInput = applyGeminiToLayoutV2(layoutInput, {}, foto_hero_url, { templateId, templateKey });
                        }
                    }
                }
            }
            else {
                if (dados.editorMode !== "html" && foto_hero_url) {
                    layoutInput = applyGeminiToLayoutV2(layoutInput, {}, foto_hero_url, { templateId, templateKey });
                }
            }
            // 6) Salvar Perfil
            Object.assign(perfil, {
                nome_profissional: dados.nome_profissional || perfil.nome_profissional,
                descricao_bio: dados.descricao_bio || perfil.descricao_bio,
                whatsapp_comercial: dados.telefone_whatsapp || perfil.whatsapp_comercial,
                foto_perfil_url,
                foto_hero_url,
                plano: dados.plano || perfil.plano || "simple",
                tipo_servico_id: dados.tipo_servico_id || perfil.tipo_servico_id,
            });
            await queryRunner.manager.save(perfil);
            // 7) Salvar Store
            const baseStoreData = {
                name: dados.name || dados.nome_profissional || store.name,
                slug: dados.slug || store.slug,
                bannerUrl: foto_hero_url,
                logoUrl: foto_perfil_url,
                usuarioId,
                templateId,
            };
            if (dados.editorMode === "html") {
                Object.assign(store, baseStoreData);
            }
            else {
                Object.assign(store, baseStoreData, { layoutConfig: layoutInput });
            }
            await queryRunner.manager.save(store);
            await queryRunner.commitTransaction();
            return { perfil, store };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    /**
     * ✅ atualizar HTML draft (mantendo script do editor)
     */
    async updateHtmlDraft(usuarioId, html) {
        const storeRepo = data_source_1.AppDataSource.getRepository(StoreModels_1.Store);
        const store = await storeRepo.findOne({ where: { usuarioId } });
        if (!store)
            throw new Error("Store não encontrada.");
        const noScripts = stripAllScripts(html); // ✅ remove QUALQUER <script>
        const safeHtml = sanitizeHtmlBasic(noScripts, {
            allowTailwindCdn: true,
            allowScripts: false, // ✅ garante que não fica script
        });
        store.pageHtmlDraft = safeHtml;
        await storeRepo.save(store);
        return { ok: true };
    }
    async getPublicProfile(usuarioId) {
        const perfil = await this.repo.findOne({
            where: { usuarioId },
            relations: ["store", "usuario", "tipoServicoPrincipal"],
        });
        if (!perfil)
            return null;
        const pageHtmlPublished = perfil?.store?.pageHtmlPublished || perfil?.store?.pageHtmlDraft || null;
        const layoutDefault = {
            style: {
                brandColor: "#1976d2",
                backgroundColor: "#ffffff",
                textColor: "#111111",
                radius: 16,
                containerMaxWidth: 1100,
                fontFamily: "Inter",
            },
            content: {
                businessName: perfil.nome_profissional || "Minha Loja",
                headline: perfil.nome_profissional || "Bem-vindo",
                subheadline: "",
                primaryCta: { text: "Comprar agora" },
            },
            blocks: [],
        };
        const raw = perfil.store?.layoutConfig;
        let layoutConfigProcessado = safeJsonParse(raw);
        if (looksLikeV2(layoutConfigProcessado)) {
            layoutConfigProcessado = v2ToPublicPreviewConfig(layoutConfigProcessado, layoutDefault);
        }
        if (typeof layoutConfigProcessado === "string") {
            try {
                const parsed = JSON.parse(layoutConfigProcessado);
                layoutConfigProcessado = { ...layoutDefault, ...parsed };
            }
            catch {
                layoutConfigProcessado = layoutDefault;
            }
        }
        else if (layoutConfigProcessado && typeof layoutConfigProcessado === "object") {
            layoutConfigProcessado = { ...layoutDefault, ...layoutConfigProcessado };
        }
        else {
            layoutConfigProcessado = layoutDefault;
        }
        return {
            perfil,
            store: perfil.store,
            layout: layoutConfigProcessado,
            pageHtmlPublished,
        };
    }
    async updateStatus(usuarioId, novoStatus) {
        const perfil = await this.repo.findOne({ where: { usuarioId } });
        if (!perfil)
            throw new Error("Perfil não encontrado.");
        perfil.status_aprovacao = novoStatus;
        perfil.ativo = true;
        return await this.repo.save(perfil);
    }
    /**
     * =========================================================
     * ✅ V2
     * =========================================================
     */
    static async generateLayoutV2FromAI(buffer, mimeType, forcedTemplateKey) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY não configurada em process.env.OPENAI_API_KEY");
        }
        const model = getOpenAIModel();
        const dataUrl = `data:${mimeType || "image/png"};base64,${buffer.toString("base64")}`;
        const prompt = `
Você é um gerador de Layout V2 EDITÁVEL.
Analise a imagem e retorne APENAS um JSON válido (SEM markdown, SEM texto fora do JSON).

REGRAS:
- NÃO retorne HTML.
- Use somente os tipos: hero, features, gallery, testimonials, cta, footer.
- Use cores apenas em HEX (#RRGGBB). NÃO use rgba.
- Imagens devem ser URLs públicas (unsplash ou placehold.co).
- Inclua SOMENTE as seções que aparecem visualmente.

IMPORTANTE SOBRE IMAGEM DO HERO:
- Se templateKey for "consultoria_imagem_v1", use hero.props.sideImage
- Caso contrário, use hero.props.backgroundImage (quando houver).

FORMATO:
{
  "version": 2,
  "templateKey": "…",
  "templateId": "premium",
  "draft": {
    "content": { "businessName": "..." },
    "blocks": [
      { "id":"h1","type":"hero","props":{...} }
    ]
  }
}

Retorne apenas JSON.
`.trim();
        const resp = await openai.chat.completions.create({
            model,
            temperature: 0.2,
            // @ts-ignore
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
                    ],
                },
            ],
        });
        const txt = resp.choices?.[0]?.message?.content || "";
        const clean = txt.replace(/```json/gi, "").replace(/```/g, "").trim();
        const match = clean.match(/\{[\s\S]*\}/);
        const jsonText = match ? match[0] : clean;
        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        }
        catch {
            throw new Error("IA não retornou JSON válido.");
        }
        const templateKey = forcedTemplateKey ||
            (typeof parsed?.templateKey === "string" ? parsed.templateKey : "premium_mecanico");
        const allowedTypes = new Set(["hero", "features", "gallery", "testimonials", "cta", "footer"]);
        const rawBlocks = Array.isArray(parsed?.draft?.blocks) ? parsed.draft.blocks : [];
        const blocks = rawBlocks
            .filter((b) => allowedTypes.has(String(b?.type)))
            .map((b) => ({
            id: String(b?.id || makeId()),
            type: String(b?.type),
            props: isObject(b?.props) ? b.props : {},
        }));
        const year = new Date().getFullYear();
        const ensure = (type, props) => {
            const found = blocks.find((b) => b.type === type);
            if (!found)
                blocks.push({ id: makeId(), type, props });
        };
        ensure("hero", {
            layout: "center",
            bgType: "image",
            backgroundImage: "https://placehold.co/1600x900/png",
            overlayEnabled: true,
            overlayColor: "#000000",
            title: "Bem-vindo",
            subtitle: "",
            titleColor: "#ffffff",
            subtitleColor: "#ffffff",
            buttonText: "Falar no WhatsApp",
            buttonColor: "#ffcc00",
            buttonTextColor: "#111111",
        });
        ensure("cta", {
            title: "Pronto para começar?",
            subtitle: "Clique e fale comigo agora.",
            buttonText: "Chamar no WhatsApp",
            buttonColor: "#ffcc00",
            buttonTextColor: "#111111",
            backgroundColor: "#f5f5f5",
            whatsappNumber: "5511999999999",
            whatsappMessage: "Olá! Quero um orçamento.",
        });
        ensure("footer", {
            variant: "social",
            companyName: parsed?.draft?.content?.businessName || "Minha Empresa",
            backgroundColor: "#111111",
            smallText: `© ${year} — Todos os direitos reservados`,
        });
        const order = ["hero", "features", "gallery", "testimonials", "cta", "footer"];
        blocks.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
        return {
            version: 2,
            templateKey,
            templateId: String(parsed?.templateId || "premium"),
            draft: {
                content: isObject(parsed?.draft?.content) ? parsed.draft.content : {},
                blocks,
            },
        };
    }
    /**
     * =========================================================
     * ✅ HTML (Screenshot-to-Code)
     * =========================================================
     */
    static async generatePageHtmlFromAI(buffer, mimeType) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY não configurada em process.env.OPENAI_API_KEY");
        }
        const model = getOpenAIModel();
        const dataUrl = `data:${mimeType || "image/png"};base64,${buffer.toString("base64")}`;
        function instrumentHtml(html) {
            let idCounter = 0;
            let out = html;
            // Textos editáveis
            out = out.replace(/<(h1|h2|h3|h4|h5|h6|p|span|a|button|li|label|small|strong|em)(\s[^>]*)?>/gi, (_match, tag, attrs) => {
                const a = String(attrs || "");
                const hasDataEdit = /data-edit\s*=\s*["']text["']/i.test(a);
                const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(a);
                const addId = hasId ? "" : ` id="el_${idCounter++}"`;
                const addData = hasDataEdit ? "" : ` data-edit="text"`;
                return `<${tag}${a}${addId}${addData}>`;
            });
            // Imagens editáveis
            out = out.replace(/<img(\s[^>]*)?>/gi, (_match, attrs) => {
                const a = String(attrs || "");
                const hasDataEdit = /data-edit\s*=\s*["']image["']/i.test(a);
                const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(a);
                const addId = hasId ? "" : ` id="img_${idCounter++}"`;
                const addData = hasDataEdit ? "" : ` data-edit="image"`;
                return `<img${a}${addId}${addData}>`;
            });
            // Backgrounds editáveis (data-edit="bg")
            out = out.replace(/<([a-z0-9]+)([^>]*?)\sstyle\s*=\s*["']([^"']*)["']([^>]*)>/gi, (full, tag, before, style, after) => {
                const hasBg = /background-image\s*:\s*url\(|background\s*:\s*url\(/i.test(style);
                if (!hasBg)
                    return full;
                const attrsAll = `${before} style="${style}"${after}`;
                const already = /data-edit\s*=\s*["']bg["']/i.test(attrsAll);
                const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(attrsAll);
                const addId = hasId ? "" : ` id="bg_${idCounter++}"`;
                const addData = already ? "" : ` data-edit="bg"`;
                return `<${tag}${before}${addId}${addData} style="${style}"${after}>`;
            });
            // CSS hints
            if (/<\/head>/i.test(out)) {
                out = out.replace(/<\/head>/i, `
<style>
  [data-edit="text"][contenteditable="true"]{
    outline: 1px dashed rgba(124,77,255,.55);
    outline-offset: 2px;
  }
  [data-edit="image"], [data-edit="bg"]{ cursor: pointer; }
</style>
</head>`);
            }
            return out;
        }
        const prompt = `
Gere um HTML COMPLETO (sem markdown) igual ao screenshot.

REGRAS OBRIGATÓRIAS:
- Incluir Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Layout desktop fiel: container max-w-[1100px] mx-auto
- Seção "Serviços": 4 cards no desktop (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
- Seção "Testemunhos": 2 colunas no desktop (grid-cols-1 md:grid-cols-2)
- Deve existir HERO com imagem de FUNDO usando:
  style="background-image:url('https://...');"
  (use aspas simples dentro do url)
  e marque com data-edit="bg"
- Imagens dos cards: class="w-full h-28 object-cover rounded-md"
- Todas as imagens <img>: data-edit="image"
- Textos (h1,h2,h3,p,a,button,li): data-edit="text" E contenteditable="true"
- Use placehold.co quando precisar

PROIBIDO (REGRA CRÍTICA):
- NÃO inclua NENHUM <script> além do Tailwind CDN.
- NÃO inclua <script data-editor> nem qualquer JS.
- Se você incluir qualquer <script> inline, sua resposta será considerada inválida.

Retorne apenas HTML.
`.trim();
        const resp = await openai.chat.completions.create({
            model,
            temperature: 0.2,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
                    ],
                },
            ],
        });
        const raw = resp.choices?.[0]?.message?.content || "";
        let html = extractHtml(raw);
        html = stripAllScripts(html); // ✅ REMOVE QUALQUER SCRIPT
        html = sanitizeGeneratedHtml(html);
        html = sanitizeHtmlBasic(html, {
            allowTailwindCdn: true,
            allowScripts: false, // 🔥 agora pode ser false
        });
        html = fixBrokenBackgroundUrls(html);
        html = normalizeImageTags(html);
        html = instrumentHtml(html);
        return html.trim();
    }
    /**
     * ✅ Layout JSON simples (mantive)
     */
    static async generateLayoutJsonFromAI(buffer, mimeType) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY não configurada em process.env.OPENAI_API_KEY");
        }
        const model = getOpenAIModel();
        const dataUrl = `data:${mimeType || "image/png"};base64,${buffer.toString("base64")}`;
        const prompt = `Você é um especialista em UX/UI. Analise a imagem da landing page e extraia a identidade visual e conteúdo para um JSON.
REGRAS:
1. Identifique a COR PRIMÁRIA predominante nos botões e chamadas.
2. Identifique a COR SECUNDÁRIA do fundo ou detalhes.
3. Extraia o TÍTULO (Headline) e SUBTÍTULO.
4. Identifique itens de "Vitrine"/"Serviços".

Retorne APENAS o JSON:
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "heroTitle": "Título",
  "heroSubtitle": "Subtítulo",
  "heroType": "image",
  "propaganda": { "ativo": true, "texto": "..." },
  "vitrineItems": [
    { "title": "Serviço 1", "price": "0.00", "description": "..." }
  ]
}
Sem explicações, sem markdown.`;
        const resp = await openai.chat.completions.create({
            model,
            temperature: 0.2,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
                    ],
                },
            ],
        });
        const responseText = resp.choices?.[0]?.message?.content || "";
        const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
            return JSON.parse(cleanJson);
        }
        catch {
            const match = cleanJson.match(/\{[\s\S]*\}/);
            if (match)
                return JSON.parse(match[0]);
            return {
                primaryColor: "#1976d2",
                secondaryColor: "#ffffff",
                heroTitle: "Meu Perfil Profissional",
                heroSubtitle: "",
                heroType: "image",
                propaganda: { ativo: false, texto: "" },
                vitrineItems: [],
            };
        }
    }
    async listVitrine(categoriaBusca) {
        const query = this.repo
            .createQueryBuilder("perfil")
            .leftJoinAndSelect("perfil.store", "store")
            .where("perfil.ativo = :ativo", { ativo: true });
        if (categoriaBusca)
            query.andWhere("perfil.tipo_servico_id = :cat", { cat: categoriaBusca });
        return await query.getMany();
    }
}
exports.default = new PerfilPrestadorService();
