"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PageService_1 = require("../services/PageService");
class PageController {
    constructor() {
        // ✅ 1. LISTAR TODAS
        this.getAllPages = async (req, res) => {
            try {
                const pages = await this.pageService.findAllPages();
                return res.status(200).json(pages);
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ error: 'Erro ao buscar páginas' });
            }
        };
        // ✅ 2. BUSCAR POR SLUG (Essencial para carregar a Vitrine)
        this.getPageBySlug = async (req, res) => {
            try {
                // Prioriza params (para rotas /public/:slug e /details/:slug)
                let slug = req.params.slug || req.query.slug;
                if (!slug || typeof slug !== "string") {
                    return res.status(400).json({ message: "Slug inválido ou não fornecido." });
                }
                slug = slug.trim().toLowerCase(); // Normalização opcional
                const page = await this.pageService.findPageBySlug(slug);
                if (!page) {
                    return res.status(404).json({ message: "Página não encontrada." });
                }
                return res.json(page);
            }
            catch (error) {
                console.error("Erro interno ao buscar página:", error);
                return res.status(500).json({ message: "Erro interno do servidor." });
            }
        };
        // ✅ 3. CRIAR PÁGINA (Com suporte a Categoria e Conteúdo)
        this.createPage = async (req, res) => {
            try {
                // Desestruturamos para garantir que estamos pegando tudo
                const { slug, title, layout, category, content } = req.body;
                // Validação
                if (!slug || !title) {
                    return res.status(400).json({ message: "Slug e Título são obrigatórios." });
                }
                // Monta o objeto PageData
                const pageData = {
                    slug,
                    title,
                    layout: layout || [], // Garante array vazio se não vier
                    category: category || "Geral", // Default
                    content: content || ""
                };
                const newPage = await this.pageService.savePage(pageData);
                return res.status(201).json(newPage);
            }
            catch (error) {
                console.error("Erro ao criar página:", error);
                // Tratamento de duplicidade (Slug único)
                if (error.code === '23505' || error.errno === 1062) {
                    return res.status(409).json({ message: "Uma página com este slug já existe." });
                }
                return res.status(500).json({ message: "Erro interno do servidor." });
            }
        };
        // ✅ 4. ATUALIZAR PÁGINA
        this.updatePage = async (req, res) => {
            try {
                const slugFromParams = req.params.slug;
                const slugFromBody = req.body.slug;
                const targetSlug = slugFromParams || slugFromBody;
                if (!targetSlug) {
                    return res.status(400).json({ message: "Slug da página não fornecido." });
                }
                const { title, layout, category, content } = req.body;
                if (!title) {
                    return res.status(400).json({ message: "O Título é obrigatório." });
                }
                const pageData = {
                    slug: targetSlug, // Mantém o slug original (ou o novo se permitir mudar)
                    title,
                    layout: layout || [],
                    category: category || "Geral",
                    content: content || ""
                };
                const updatedPage = await this.pageService.savePage(pageData);
                if (!updatedPage) {
                    return res.status(404).json({ message: "Página não encontrada para atualização." });
                }
                return res.json(updatedPage);
            }
            catch (error) {
                console.error("Erro ao atualizar página:", error);
                return res.status(500).json({ message: "Erro interno do servidor." });
            }
        };
        this.pageService = new PageService_1.PageService();
    }
}
exports.default = new PageController();
