import { Request, Response } from 'express';
import AIProductService from '../services/AIProductService';
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/ProdutoModels";
import fs from 'fs';
import ProdutoService from '../services/ProdutoService';
import { Store } from "../models/StoreModels";
import { PLAN_LIMITS } from "../config/planLimits";

export class ProductController {
    private aiProductService = new AIProductService();
    private productRepo = AppDataSource.getRepository(Product);

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
            const { store_id } = req.params;


            if (!currentUserId || !store_id) {
                return res.status(400).json({ message: "Dados insuficientes." });
            }

            const storeRepo = AppDataSource.getRepository(Store);
            const store = await storeRepo.findOne({
                where: {
                    id: store_id,
                    usuarioId: currentUserId
                },
                // 1. GARANTA QUE O NOME AQUI SEJA O MESMO DA ENTITY (products)
                relations: ["owner", "products"]
            });

            if (!store) {
                return res.status(404).json({ error: "Loja não encontrada ou acesso negado." });
            }

            // 2. PEGANDO A IMAGEM DO PRODUTO DE FORMA SEGURA
            // Usamos o optional chaining (?.) para evitar o erro "Object is possibly undefined"
            const imagemDaVitrine = store.products?.[0]?.imageUrl || null;

            const tipoPerfil = (store as any).usuario?.tipo_perfil || "empreendedor";
            const planoUser = (req as any).user.plano || "BASICO";
            const plan = (PLAN_LIMITS as any)[planoUser] || PLAN_LIMITS.BASICO;

            // 3. PARSE SEGURO DO JSON
            let layoutData = null;
            if (store.layoutConfig) {
                try {
                    layoutData = typeof store.layoutConfig === 'string'
                        ? JSON.parse(store.layoutConfig)
                        : store.layoutConfig;
                } catch (e) {
                    console.error("Erro ao dar parse no layoutConfig");
                }
            }

            return res.json({
                storeId: store.id,
                storeName: store.name,
                storeSlug: (store as any).slug,
                isPrestador: store.tipo === 'PRESTADOR',
                layoutConfig: layoutData,
                products: store.products || [], // 👈 Adicione isso para o VitrineEditor receber os dados
                imageUrl: store.products?.[0]?.imageUrl || null
            });

        } catch (error: any) {
            console.error("Erro ao carregar contexto:", error.message);
            return res.status(500).json({ error: "Erro interno no servidor." });
        }
    }

    // ✅ 1. LISTAR PRODUTOS (Transformado em Arrow Function para evitar erro de 'this')
    getMeusProdutos = async (req: Request, res: Response) => {
        try {
            const currentUserId = (req as any).user?.usuarioId;

            console.log('produtossssssssssssssssss aqui 2', req.body)

            if (!currentUserId) {
                return res.status(401).json({ message: "Usuário não autenticado." });
            }

            // Busca a loja usando o padrão usuarioId
            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId: currentUserId }
            });

            if (!store) {
                return res.json([]); // Retorna vazio se não houver loja
            }

            // Busca produtos que pertencem a este usuário
            const produtos = await this.productRepo.find({
                where: { usuarioId: currentUserId }
            });

            return res.json(produtos);

        } catch (error: any) {
            console.error("Erro ao buscar meus produtos:", error.message);
            return res.status(500).json({ error: "Erro ao carregar produtos.", details: error.message });
        }
    }

    // ✅ 2. CRIAR COM IA
    createWithAI = async (req: Request, res: Response) => {
        try {
            const { productName, price, categoryId } = req.body;
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store) return res.status(404).json({ error: "Loja não encontrada." });

            const plan = await this.checkPlanLimit(store.id, (req as any).user.plano);
            if (!plan.canUseAI) {
                return res.status(403).json({ error: "Seu plano não permite IA." });
            }

            const aiData = await this.aiProductService.generateProductWithAI(
                store.id, (req as any).user.plano, productName
            );

            const newProduct = this.productRepo.create({
                storeId: store.id,
                usuarioId: usuarioId, // ✅ Salvando o dono do produto
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

    // ✅ 3. CRIAR MANUAL
    createProduto = async (req: Request, res: Response) => {
        try {
            const { name, price, description, categoryId, stock } = req.body;
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store) return res.status(404).json({ error: "Loja não encontrada." });

            const product = new Product();

            product.name = name;
            product.description = description;
            product.price = Number(price);
            product.stock = Number(stock);
            product.storeId = store.id;
            product.usuarioId = usuarioId;
            product.categoryId = categoryId || null;

            // 🔥 AGORA CORRETO
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
            const { id } = req.params;
            const usuarioId = (req as any).user?.usuarioId;


            if (!id || !usuarioId) {
                return res.status(400).json({
                    error: "ID do produto ou identificação do usuário ausentes."
                });
            }

            // 1. Busca o produto e verifica se ele pertence ao usuário
            const produtoExistente = await this.productRepo.findOne({
                where: { id, usuarioId }
            });

            if (!produtoExistente) {
                return res.status(404).json({ error: "Produto não encontrado ou você não tem permissão para editá-lo." });
            }

            const { name, price, description, categoryId, stock, status, link_contato, layoutConfig } = req.body;
            const files = (req.files as unknown) as { [fieldname: string]: Express.Multer.File[] } || {};

            // 2. Atualiza os dados básicos
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

            // 5. Salva as alterações
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

    // ✅ 4. DELETAR
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const usuarioId = (req as any).user?.usuarioId;

            const store = await AppDataSource.getRepository(Store).findOne({
                where: { usuarioId }
            });

            if (!store || !id) return res.status(404).json({ error: "Produto ou Loja não encontrada." });

            const result = await ProdutoService.deleteProduto(id, store.id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    };
}