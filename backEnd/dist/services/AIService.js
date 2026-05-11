"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const DesignStrategies_1 = require("../presets/DesignStrategies");
const StyleModifiers_1 = require("../presets/StyleModifiers");
const MODELS = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-2.0-flash-001"
];
class AIService {
    // =========================
    // CORE IA CALL (ROBUSTO)
    // =========================
    static async fetchAI(messages, temperature = 0.5) {
        if (!this.API_KEY) {
            throw new Error("API Key do OpenRouter não configurada.");
        }
        let lastError;
        for (const model of MODELS) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 20000);
                try {
                    const response = await fetch(this.API_URL, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${this.API_KEY}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://granconecta.com.br",
                            "X-Title": "GranConecta"
                        },
                        body: JSON.stringify({
                            model,
                            temperature,
                            messages,
                            max_tokens: 4000,
                            response_format: { type: "json_object" }
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timeout);
                    if (!response.ok) {
                        const errorText = await response.text();
                        const status = response.status;
                        if (status === 429 || status === 504) {
                            const wait = Math.pow(2, attempt) * 2000;
                            console.warn(`⏳ Rate limit ${model} (${status}) retry em ${wait}ms`);
                            await new Promise(r => setTimeout(r, wait));
                            continue;
                        }
                        throw new Error(`Erro OpenRouter: ${status} - ${errorText}`);
                    }
                    const data = await response.json();
                    let content = data?.choices?.[0]?.message?.content;
                    if (!content) {
                        console.warn("⚠ IA retornou vazio");
                        continue;
                    }
                    // limpa markdown
                    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
                    try {
                        return JSON.parse(content);
                    }
                    catch {
                        const match = content.match(/\{[\s\S]*\}/);
                        if (match)
                            return JSON.parse(match[0]);
                        console.warn("⚠ JSON inválido, tentando próximo modelo...");
                        continue;
                    }
                }
                catch (error) {
                    clearTimeout(timeout);
                    lastError = error;
                    if (error?.name === "AbortError") {
                        console.warn(`⏱ Timeout ${model} tentativa ${attempt}`);
                        continue;
                    }
                    console.warn(`❌ Erro ${model}:`, error.message);
                }
            }
        }
        throw new Error(`❌ Falha total na IA: ${lastError?.message}`);
    }
    // =========================
    // STYLE PROMPTS
    // =========================
    static async processPrompts(descricao) {
        const descricaoLower = descricao.toLowerCase();
        const prompts = [];
        for (const [key, instruction] of Object.entries(StyleModifiers_1.StyleModifiers)) {
            if (descricaoLower.includes(key)) {
                prompts.push(instruction);
            }
        }
        return prompts.length
            ? prompts.join("\n")
            : "Siga as diretrizes padrão da estratégia de design.";
    }
    // =========================
    // LAYOUT CONFIG
    // =========================
    static async extractLayoutConfig(descricao, categoriaTipo) {
        const categorias = Object.keys(DesignStrategies_1.DesignStrategies).join(", ");
        const systemPrompt = `
Você é um especialista em UX/UI.

Responda SOMENTE em JSON válido.

Classifique o tipo de negócio e retorne:

{
  "strategy": "string",
  "isDark": boolean,
  "area": "string"
}

TIPO DE NEGÓCIO: ${categoriaTipo || "não informado"}

CATEGORIAS: ${categorias}

REGRAS:
- FOOD => foco em alimentação
- SERVICO => foco em serviços
- loja => e-commerce
`;
        const res = await this.fetchAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Descrição: ${descricao} (responda em JSON)` }
        ], 0.1);
        const estrategia = DesignStrategies_1.DesignStrategies[res.strategy] || DesignStrategies_1.DesignStrategies.tech;
        return {
            ...estrategia,
            strategyKey: res.strategy || "tech",
            isDark: res.isDark ?? true,
            area: res.area || (categoriaTipo === "FOOD" ? "alimentação" : "serviços"),
            businessType: categoriaTipo?.toLowerCase() || "service"
        };
    }
    // =========================
    // TEMPLATE GENERATION
    // =========================
    static async generateTemplateData(descricao, strategy) {
        const bType = String(strategy.businessType || "servico").toLowerCase();
        const systemPrompt = `
Você é um especialista em UX e Marketing.

Gere dados estruturados em JSON para um template.

Estratégia: ${strategy.label}
Tipo: ${bType}

Responda APENAS JSON válido.
`;
        return this.fetchAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Descrição: ${descricao} (JSON obrigatório)` }
        ], 0.8);
    }
    // =========================
    // STYLE GENERATION
    // =========================
    static async generateStyle(descricao, strategy) {
        const extraInstructions = await this.processPrompts(descricao);
        const systemPrompt = `
                            Você é um Designer UX/UI sênior.
                            Gere um JSON de estilo visual.
                            Estratégia: ${strategy.label}
                            Regras adicionais:
                            ${extraInstructions}
                            Responda APENAS JSON válido.
                            `;
        return this.fetchAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: descricao }
        ], 0.8);
    }
}
exports.AIService = AIService;
AIService.API_URL = "https://openrouter.ai/api/v1/chat/completions";
AIService.API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
