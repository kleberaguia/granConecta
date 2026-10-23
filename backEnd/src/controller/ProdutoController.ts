import { Request, Response } from 'express';
import AIProductService from '../services/AIProductService';
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/ProdutoModels";
import ProdutoService from '../services/ProdutoService';
import { Store } from "../models/StoreModels";
import { PLAN_LIMITS } from "../config/planLimits";

export class ProductController {
    private aiProductService = new AIProductService();
    private productRepo = AppDataSource.getRepository(Product);

    /**
     * Normaliza IDs recebidos pela rota.
     * Evita que strings como "undefined" e "null" cheguem às consultas SQL.
     */
    private normalizeRouteId(value: unknown): string | null {
        if (typeof value !== "string") {
            return null;
        }

        const normalized = value.trim();

        if (
            !normalized ||
            normalized.toLowerCase() === "undefined" ||
            normalized.toLowerCase() === "null"
        ) {
            return null;
        }

        return normalized;
    }

    private async checkPlanLimit(storeId: string, planoUser: string) {
        const plan = (PLAN_LIMITS as any)[planoUser] || PLAN_LIMITS.BASICO;
        const currentCount = await this.productRepo.count({ where: { storeId } });

        if (currentCount >= plan.maxProducts) {
            throw new Error(`Limite de produtos atingido para o plano ${planoUser} (${plan.maxProducts} itens).`);
        }
        return plan;
    }


    getEditorContext = async (req: Request, res: Response) => {
        try {
            const currentUserId = (req as any).user?.usuarioId;
            const storeId = this.normalizeRouteId(req.params.store_id);

            if (!currentUserId || !storeId) {
                console.warn("[PRODUCT CONTEXT] Dados inválidos para carregar contexto", {
                    store_id: req.params.store_id,
                    currentUserId: currentUserId || null
                });

                return res.status(400).json({
                    message: "Dados insuficientes.",
                    details: "store_id inválido."
                });
            }

            const storeRepo = AppDataSource.getRepository(Store);

            /*
             * IMPORTANTE:
             * Não carregamos owner/products via relations aqui.
             *
             * O JOIN automático anterior comparava colunas com collations
             * diferentes (utf8mb4_0900_ai_ci x utf8mb4_unicode_ci), gerando:
             * "Illegal mix of collations".
             *
             * A loja e os produtos são carregados separadamente, evitando
             * o JOIN problemático sem alterar o restante do fluxo.
             */
            const store = await storeRepo.findOne({
                where: {
                    id: storeId,
                    usuarioId: currentUserId
                }
            });

            if (!store) {
                return res.status(404).json({
                    error: "Loja não encontrada ou acesso negado."
                });
            }

            const products = await this.productRepo.find({
                where: { storeId: store.id },
                order: { createdAt: "DESC" as any }
            });

            // Parse seguro do layoutConfig.
            let layoutData = null;

            if (store.layoutConfig) {
                try {
                    layoutData =
                        typeof store.layoutConfig === "string"
                            ? JSON.parse(store.layoutConfig)
                            : store.layoutConfig;
                } catch (error) {
                    console.error("[PRODUCT CONTEXT] Erro ao dar parse no layoutConfig", {
                        storeId: store.id
                    });
                }
            }

            return res.json({
                storeId: store.id,
                storeName: store.name,
                storeSlug: (store as any).slug,
                isPrestador: store.tipo === "PRESTADOR",
                layoutConfig: layoutData,
                products,
                imageUrl: products?.[0]?.imageUrl || null
            });

        } catch (error: any) {
            console.error("[PRODUCT CONTEXT] Erro ao carregar contexto:", error.message);
            return res.status(500).json({
                error: "Erro interno no servidor.",
                details: error.message
            });
        }
    };


    getProdutosPublicosPorLoja = async (req: Request, res: Response) => {
        try {
            const storeId = this.normalizeRouteId(req.params.store_id);

            if (!storeId) {
                return res.status(400).json({ message: "ID da loja é obrigatório." });
            }

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { id: storeId, ativa: true } as any,
            });

            if (!store) {
                return res.status(404).json({ message: "Loja não encontrada." });
            }

            const produtos = await this.productRepo.find({
                where: { storeId, status: true } as any,
                order: { createdAt: "DESC" as any },
            });

            return res.json({ products: produtos });
        } catch (error: any) {
            console.error("Erro ao buscar produtos públicos da loja:", error.message);
            return res.status(500).json({
                error: "Erro ao carregar produtos da loja.",
                details: error.message,
            });
        }
    }
    // âœ… 1. LISTAR PRODUTOS (Transformado em Arrow Function para evitar erro de 'this')
    getMeusProdutos = async (req: Request, res: Response) => {
        try {
            const currentUserId = (req as any).user?.usuarioId;

            if (!currentUserId) {
                return res.status(401).json({ message: "UsuÃ¡rio nÃ£o autenticado." });
            }

            // Busca a loja usando o padrÃ£o usuarioId
            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId: currentUserId }
            });

            if (!store) {
                return res.json([]); // Retorna vazio se nÃ£o houver loja
            }

            // Busca produtos que pertencem a este usuÃ¡rio
            const produtos = await this.productRepo.find({
                where: { usuarioId: currentUserId }
            });

            return res.json(produtos);

        } catch (error: any) {
            console.error("Erro ao buscar meus produtos:", error.message);
            return res.status(500).json({ error: "Erro ao carregar produtos.", details: error.message });
        }
    }

    // âœ… 2. CRIAR COM IA
    createWithAI = async (req: Request, res: Response) => {
        try {
            const { productName, price, categoryId } = req.body;
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store) return res.status(404).json({ error: "Loja nÃ£o encontrada." });

            const plan = await this.checkPlanLimit(store.id, (req as any).user.plano);
            if (!plan.canUseAI) {
                return res.status(403).json({ error: "Seu plano nÃ£o permite IA." });
            }

            const aiData = await this.aiProductService.generateProductWithAI(
                store.id, (req as any).user.plano, productName
            );

            const newProduct = this.productRepo.create({
                storeId: store.id,
                usuarioId: usuarioId, // âœ… Salvando o dono do produto
                name: productName,
                price: Number(price),
                categoryId,
                description: aiData.description,
                imageUrl: 'ai-generated-placeholder.png',
                stock: 0
            });

            await this.productRepo.save(newProduct);
            return res.status(201).json({ message: "Criado via IA!", product: newProduct });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };

    // âœ… 3. CRIAR MANUAL
    createProduto = async (req: Request, res: Response) => {
        try {
            const { name, price, description, categoryId, stock } = req.body;
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store) return res.status(404).json({ error: "Loja nÃ£o encontrada." });

            const product = new Product();

            product.name = name;
            product.description = description;
            product.price = Number(price);
            product.stock = Number(stock);
            product.storeId = store.id;
            product.usuarioId = usuarioId;
            product.categoryId = categoryId || null;

            // ðŸ”¥ AGORA CORRETO
            product.imageUrl = req.body.foto_perfil_url || "";
            product.fotoPerfil = req.body.foto_perfil_url || "";
            product.heroUrl = req.body.foto_hero_url || "";

            product.carouselImages = req.body.hero_carousel_urls
                ? JSON.stringify(req.body.hero_carousel_urls)
                : "[]";

            product.galeriaImages = req.body.galeria_urls
                ? JSON.stringify(req.body.galeria_urls)
                : "[]";

            const saved = await this.productRepo.save(product);

            return res.status(201).json(saved);

        } catch (error: any) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }
    };

    updateProduto = async (req: Request, res: Response) => {
        try {
            const id = this.normalizeRouteId(req.params.id);
            const usuarioId = (req as any).user?.usuarioId;


            if (!id || !usuarioId) {
                return res.status(400).json({
                    error: "ID do produto ou identificaÃ§Ã£o do usuÃ¡rio ausentes."
                });
            }

            // 1. Busca o produto e verifica se ele pertence ao usuÃ¡rio
            const produtoExistente = await this.productRepo.findOne({
                where: { id, usuarioId }
            });

            if (!produtoExistente) {
                return res.status(404).json({ error: "Produto nÃ£o encontrado ou vocÃª nÃ£o tem permissÃ£o para editÃ¡-lo." });
            }

            const { name, price, description, categoryId, stock, status, link_contato, layoutConfig } = req.body;
            const files = (req.files as unknown) as { [fieldname: string]: Express.Multer.File[] } || {};

            // 2. Atualiza os dados bÃ¡sicos
            produtoExistente.name = name || produtoExistente.name;
            produtoExistente.description = description || produtoExistente.description;
            produtoExistente.price = price !== undefined ? Number(price) : produtoExistente.price;
            produtoExistente.stock = stock !== undefined ? Number(stock) : produtoExistente.stock;

            if (status !== undefined) {
                (produtoExistente as any).status = String(status) === 'true' || status === true;
            }

            produtoExistente.categoryId = (categoryId && categoryId !== "undefined") ? categoryId : produtoExistente.categoryId;
            (produtoExistente as any).link_contato = link_contato || (produtoExistente as any).link_contato;

            if (layoutConfig) {
                produtoExistente.layoutConfig = typeof layoutConfig === 'string' ? layoutConfig : JSON.stringify(layoutConfig);
            }

            // 3. Atualiza Imagens (Somente se novos arquivos forem enviados)
            const getNewFile = (fieldName: string) => files[fieldName] ? files[fieldName][0]?.filename : null;

            const novaFotoPerfil = getNewFile('foto_perfil');
            if (novaFotoPerfil) {
                produtoExistente.imageUrl = novaFotoPerfil;
                produtoExistente.fotoPerfil = novaFotoPerfil;
            }

            const novaFotoHero = getNewFile('foto_hero');
            if (novaFotoHero) produtoExistente.heroUrl = novaFotoHero;

            const novoVideo = getNewFile('hero_video');
            if (novoVideo) produtoExistente.videoUrl = novoVideo;

            const novaSectionImg = getNewFile('section_image');
            if (novaSectionImg) produtoExistente.sectionImageUrl = novaSectionImg;

            // 4. Arrays (Carousel e Galeria)
            if (files['hero_carousel']) {
                produtoExistente.carouselImages = JSON.stringify(files['hero_carousel'].map(f => f.filename));
            }
            if (files['galeria']) {
                produtoExistente.galeriaImages = JSON.stringify(files['galeria'].map(f => f.filename));
            }

            // 5. Salva as alteraÃ§Ãµes
            const result = await this.productRepo.save(produtoExistente);

            return res.json({
                message: "Produto atualizado com sucesso!",
                product: result
            });

        } catch (error: any) {
            console.error("Erro ao atualizar produto:", error.message);
            return res.status(400).json({ error: error.message });
        }
    };

    // âœ… 4. DELETAR
    delete = async (req: Request, res: Response) => {
        try {
            const id = this.normalizeRouteId(req.params.id);
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store || !id) return res.status(404).json({ error: "Produto ou Loja nÃ£o encontrada." });

            const result = await ProdutoService.deleteProduto(id, store.id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}
