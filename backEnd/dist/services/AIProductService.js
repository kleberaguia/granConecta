"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const StoreModels_1 = require("../models/StoreModels");
const ProdutoModels_1 = require("../models/ProdutoModels");
const OrderModels_1 = require("../models/OrderModels");
const planLimits_1 = require("../config/planLimits");
const openai_1 = __importDefault(require("openai"));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const models = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-2.0-flash-exp:free"
];
// 🔥 helper slug
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + "-" + Date.now();
}
class AIStoreService {
    constructor() {
        this.storeRepo = data_source_1.AppDataSource.getRepository(StoreModels_1.Store);
        this.productRepo = data_source_1.AppDataSource.getRepository(ProdutoModels_1.Product);
        this.orderRepo = data_source_1.AppDataSource.getRepository(OrderModels_1.Order);
        this.openai = new openai_1.default({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENAI_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "GranConecta",
            }
        });
    }
    // 🔥 IA com fallback entre modelos
    async callAIWithRetry(prompt) {
        let lastError;
        for (const model of models) {
            for (let i = 0; i < 2; i++) {
                try {
                    const completion = await this.openai.chat.completions.create({
                        model,
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.7,
                    });
                    return completion.choices?.[0]?.message?.content || "";
                }
                catch (error) {
                    lastError = error;
                    const status = error?.status || error?.response?.status;
                    if (status === 429 || status === 504 || error.message?.includes("aborted")) {
                        const waitTime = (i + 1) * 2000;
                        console.log(`Retry ${i + 1} (${model}) em ${waitTime}ms`);
                        await sleep(waitTime);
                        continue;
                    }
                    break; // tenta próximo modelo
                }
            }
        }
        throw new Error(`IA falhou: ${lastError?.message}`);
    }
    // =========================
    // PEDIDOS
    // =========================
    async getOrdersByOwnerId(userId) {
        return await this.orderRepo.find({
            where: {
                store: {
                    owner: { id: String(userId) }
                }
            },
            relations: ["items", "items.product", "customer"],
            order: { createdAt: "DESC" }
        });
    }
    // =========================
    // PRODUTOS
    // =========================
    async generateProductWithAI(storeId, userPlan, productInput) {
        const plan = planLimits_1.PLAN_LIMITS[userPlan] || planLimits_1.PLAN_LIMITS.BASICO;
        const currentProductCount = await this.productRepo.count({
            where: { store: { id: storeId } }
        });
        if (currentProductCount >= plan.maxProducts) {
            throw new Error(`Limite de produtos atingido para o plano ${userPlan}.`);
        }
        const prompt = `Crie uma descrição de venda altamente persuasiva para: "${productInput}".`;
        const description = await this.callAIWithRetry(prompt);
        return {
            name: productInput,
            description: description || "Descrição não gerada."
        };
    }
    // =========================
    // STORE
    // =========================
    async getStoreByUserId(userId) {
        if (!userId)
            return null;
        return await this.storeRepo.findOne({
            where: { owner: { id: userId } },
            relations: ["products"]
        });
    }
    // 🔥 GARANTE STORE (UPSERT REAL)
    async garantirStore(userId, userName) {
        let store = await this.storeRepo.findOne({
            where: { owner: { id: userId } }
        });
        if (store)
            return store;
        // cria nova
        store = this.storeRepo.create({
            owner: { id: userId },
            name: userName || "Minha Loja",
            slug: generateSlug(userName || "minha-loja"),
            tipo: "PRESTADOR"
        });
        return await this.storeRepo.save(store);
    }
    // =========================
    // IA + STORE
    // =========================
    async generateAndSaveStore(userId, data) {
        if (!userId)
            throw new Error("Usuário não identificado.");
        // 🔥 garante store antes de tudo
        let store = await this.garantirStore(userId, data.name);
        const prompt = `
Crie um JSON de layout para uma loja com:
Nome: ${data.name}
Segmento: ${data.segment}
Público: ${data.targetAudience}

Retorne apenas JSON válido.
`;
        const content = await this.callAIWithRetry(prompt);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error("IA retornou formato inválido.");
        let aiJson;
        try {
            aiJson = JSON.parse(jsonMatch[0]);
        }
        catch {
            throw new Error("Erro ao parsear JSON da IA.");
        }
        // 🔥 UPDATE seguro
        store.name = data.name;
        store.slug = generateSlug(data.name);
        store.layoutConfig = aiJson;
        return await this.storeRepo.save(store);
    }
}
exports.default = AIStoreService;
