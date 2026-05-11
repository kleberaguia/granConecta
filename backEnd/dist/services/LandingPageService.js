"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingPageService = void 0;
const dotenv_1 = require("dotenv");
const node_fetch_1 = __importDefault(require("node-fetch"));
const AIStoreService_1 = require("./AIStoreService");
(0, dotenv_1.config)();
class LandingPageService {
    constructor() {
        this.storeService = new AIStoreService_1.AIStoreService();
    }
    /**
     * Gera uma landing page completa a partir de uma imagem processada pela IA.
     */
    async generateLanding(opts) {
        const { usuarioId, condominio_id, templateId, imageBuffer, mimeType } = opts;
        // Converte o buffer da imagem para Data URL para envio à IA
        const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
        // Chamada à IA para gerar o código estruturado
        const { html, css } = await this.generateFullPageWithAI(imageDataUrl, templateId);
        // Persistência no banco de dados usando o padrão usuarioId e condominioId opcional
        await this.storeService.updateHtmlDraft(usuarioId, html, css);
        return { html, css };
    }
    /**
     * Comunica com o OpenRouter/Gemini para transformar a imagem em HTML/CSS real.
     */
    async generateFullPageWithAI(imgUrl, templateId) {
        // Certifique-se de que GEMINI_API_KEY ou OPENROUTER_API_KEY está no seu .env
        const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
        try {
            console.log("Iniciando processamento visual com Gemini 2.0 Flash...");
            const response = await (0, node_fetch_1.default)("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "GranConecta AI Builder"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [
                        {
                            role: "system",
                            content: `Você é um Designer UI/UX e Desenvolvedor Frontend Sênior especializado em Landing Pages de alto padrão.

OBJETIVO:
Recriar o layout da imagem enviada com máxima fidelidade (mínimo 95% de semelhança visual).

DIRETRIZES ESTÉTICAS:

PALETA DE CORES: Extraia as cores exatas da imagem (ex: tons de creme, dourado, verde oliva suave). Use variáveis CSS para estas cores.

TIPOGRAFIA:

Para joias/estética: Use fontes Serif elegantes (ex: 'Playfair Display').

Para textos de apoio: Use fontes Sans-serif limpas (ex: 'Inter').

ESPAÇAMENTO: Use 'whitespace' (espaço em branco) generoso. Mínimo 100px de padding entre grandes seções para um look sofisticado.

COMPONENTES:

Navbar: Transparente ou com blur, logo refinado à esquerda.

Hero: Layout assimétrico se a imagem mostrar isso, com tipografia grande e refinada.

Cards: Se houver produtos (como as joias), use sombras muito leves (soft shadows) e bordas arredondadas sutis (4px a 8px).

REGRAS TÉCNICAS PARA O EDITOR:

Adicione data-edit="text" em cada parágrafo, título, link ou botão.

Adicione data-edit="bg" nas seções que possuem cor ou imagem de fundo.

Adicione data-edit="image" em todas as tags <img>.

NÃO use a imagem original. Substitua por URLs do Unsplash que combinem com o tema (ex: https://www.google.com/search?q=https://images.unsplash.com/photo-1515562141207-7a88fb7ce338 para joias).

FORMATO DE SAÍDA:
Retorne estritamente um objeto JSON: {"html": "...", "css": "..."}.`
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Crie o código HTML e CSS para este site baseado no estilo visual desta imagem. Divida em Navbar, Hero, Features e Footer. Retorne apenas o objeto JSON."
                                },
                                { type: "image_url", image_url: { url: imgUrl } }
                            ]
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Erro na API (${response.status}): ${errorData}`);
            }
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error("A IA não retornou nenhuma opção de conteúdo.");
            }
            const rawContent = data.choices[0].message.content;
            // Limpeza de possíveis marcações de Markdown que a IA possa enviar por engano
            const cleanJson = rawContent.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            // Envolvemos o conteúdo num container para isolamento e organização no editor
            const htmlFinal = `
                <div class="ai-generated-page">
                    ${parsed.html}
                </div>
            `.trim();
            return {
                html: htmlFinal,
                css: parsed.css || ""
            };
        }
        catch (error) {
            console.error("Erro no processamento da IA:", error.message);
            // Retorna o layout padrão caso a comunicação falhe
            return this.getFallbackPage();
        }
    }
    /**
     * Gera um layout de emergência caso a IA falhe ou a imagem seja inválida.
     */
    getFallbackPage() {
        return {
            html: `
            <div class="ai-generated-page">
                <nav class="navbar">
                    <span data-edit="text" style="font-weight: bold;">Sua Marca</span>
                </nav>
                <section class="hero" data-edit="bg">
                    <h1 data-edit="text">Bem-vindo à sua nova loja</h1>
                    <p data-edit="text">Não conseguimos ler a imagem agora, mas você pode começar a editar este layout padrão clicando nos textos.</p>
                    <button data-edit="text">Saiba Mais</button>
                </section>
                <section class="features" style="display: flex; gap: 20px; padding: 40px;">
                    <div style="flex: 1;"><h3 data-edit="text">Diferencial 1</h3><p data-edit="text">Descrição aqui.</p></div>
                    <div style="flex: 1;"><h3 data-edit="text">Diferencial 2</h3><p data-edit="text">Descrição aqui.</p></div>
                    <div style="flex: 1;"><h3 data-edit="text">Diferencial 3</h3><p data-edit="text">Descrição aqui.</p></div>
                </section>
                <footer class="footer">
                    <p data-edit="text">© 2026 Todos os direitos reservados.</p>
                </footer>
            </div>
            `,
            css: `
                .ai-generated-page { font-family: 'Inter', sans-serif; color: #333; }
                .navbar { padding: 20px; background: #fff; border-bottom: 1px solid #eee; }
                .hero { padding: 80px 20px; text-align: center; background: #f4f7f6; }
                .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
                .hero button { padding: 12px 24px; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
                .footer { padding: 40px; text-align: center; background: #333; color: #fff; }
            `
        };
    }
}
exports.LandingPageService = LandingPageService;
