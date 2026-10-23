import { DesignStrategies } from "../presets/DesignStrategies";
import { StyleModifiers } from "../presets/StyleModifiers";
import { SafeJsonParse } from "../utils/safeJsonParse";

const MODELS = [
  "openai/gpt-4o-mini",
  "anthropic/claude-3-haiku",
  "google/gemini-2.0-flash-001",
];

export class AIService {
  private static readonly API_URL =
    "https://openrouter.ai/api/v1/chat/completions";

  private static readonly API_KEY = (
    process.env.OPENROUTER_API_KEY || ""
  ).trim();

  private static async fetchAI(messages: any[], temperature = 0.5) {
    if (!this.API_KEY) {
      throw new Error("API Key do OpenRouter não configurada.");
    }

    let lastError: any;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
          const response = await fetch(this.API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://granconecta.com.br",
              "X-Title": "GranConecta",
            },
            body: JSON.stringify({
              model,
              temperature,
              messages,
              max_tokens: 4000,
              response_format: {
                type: "json_object",
              },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!response.ok) {
            const errorText = await response.text();
            const status = response.status;

            if (status === 429 || status === 504) {
              const wait = Math.pow(2, attempt) * 2000;

              console.warn(
                `Rate limit ${model} (${status}) retry em ${wait}ms`,
              );

              await new Promise((resolve) => setTimeout(resolve, wait));
              continue;
            }

            throw new Error(`Erro OpenRouter: ${status} - ${errorText}`);
          }

          const data: any = await response.json();

          let content = data?.choices?.[0]?.message?.content;

          if (!content) {
            console.warn("IA retornou vazio");
            continue;
          }

          content = String(content)
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          try {
            const parsed = SafeJsonParse.parse(content);

            if (parsed && Object.keys(parsed).length > 0) {
              return parsed;
            }
          } catch {
            const match = content.match(/\{[\s\S]*\}/);

            if (match) {
              return JSON.parse(match[0]);
            }

            console.warn("JSON inválido, tentando próximo modelo...");
            continue;
          }
        } catch (error: any) {
          clearTimeout(timeout);
          lastError = error;

          if (error?.name === "AbortError") {
            console.warn(`Timeout ${model} tentativa ${attempt}`);
            continue;
          }

          console.warn(`Erro ${model}:`, error?.message || error);
        }
      }
    }

    throw new Error(`Falha total na IA: ${lastError?.message || lastError}`);
  }

  static async processPrompts(descricao: string): Promise<string> {
    const descricaoLower = String(descricao || "").toLowerCase();
    const prompts: string[] = [];

    for (const [key, instruction] of Object.entries(StyleModifiers)) {
      if (descricaoLower.includes(key)) {
        prompts.push(String(instruction));
      }
    }

    return prompts.length
      ? prompts.join("\n")
      : "Siga as diretrizes padrão da estratégia de design.";
  }

  static async extractLayoutConfig(descricao: string, categoriaTipo?: string) {
    const categories = Object.keys(DesignStrategies).join(", ");

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

CATEGORIAS: ${categories}

REGRAS:
- FOOD => foco em alimentação
- SERVICO => foco em serviços
- loja => e-commerce
`;

    const res = await this.fetchAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Descrição: ${descricao} (responda em JSON)`,
        },
      ],
      0.1,
    );

    const estrategia =
      (DesignStrategies as any)[res.strategy] || (DesignStrategies as any).tech;

    return {
      ...estrategia,
      strategyKey: res.strategy || "tech",
      isDark: res.isDark ?? true,
      area:
        res.area ||
        (categoriaTipo === "FOOD" ? "alimentação" : "serviços"),
      businessType: categoriaTipo?.toLowerCase() || "service",
    };
  }

  static async generateStyle(descricao: string, strategy: any) {
    const extraInstructions = await this.processPrompts(descricao);

    const systemPrompt = `
Você é um Designer UX/UI sênior.

Gere um JSON de estilo visual.

Estratégia:
${strategy?.label || "Estratégia padrão"}

Regras adicionais:
${extraInstructions}

Responda APENAS JSON válido.
`;

    return this.fetchAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: descricao,
        },
      ],
      0.8,
    );
  }

  static async generateServiceLayoutVariations(input: {
    layoutBase: any;
    description: string;
    businessName?: string;
    businessSegment?: string;
    businessType?: string;
    answers?: any;
    businessMaterials?: any;
    colors?: any;
    limit?: number;
  }) {
    const {
      layoutBase,
      description,
      businessName,
      businessSegment,
      businessType,
      answers,
      businessMaterials,
      colors,
    } = input;

    const limit = Math.min(
      Math.max(Number(input.limit || 5), 1),
      5,
    );

    if (!layoutBase?.id) {
      throw new Error(
        "layoutBase é obrigatório para gerar variações de serviço.",
      );
    }

    const systemPrompt = `
Você é um Diretor de Arte, UX/UI Designer e Web Designer sênior
responsável pelas páginas profissionais do GranConecta.

Sua tarefa NÃO é inventar um novo tipo de página.

Você recebeu um LAYOUT-BASE PROFISSIONAL já aprovado.
Esse layout-base define a arquitetura, a qualidade visual,
a hierarquia e as regras obrigatórias da página.

Crie ${limit} VARIAÇÕES PROFISSIONAIS a partir desse mesmo layout-base.

==================================================
LAYOUT-BASE APROVADO
==================================================

${JSON.stringify(layoutBase, null, 2)}

==================================================
REGRAS ABSOLUTAS
==================================================

1. Preserve a identidade estrutural do layout-base.

2. As variações devem pertencer à mesma família visual
   e ao mesmo segmento do layout-base.

3. NÃO transforme página de serviço em:
   - e-commerce
   - marketplace
   - catálogo genérico de produtos
   - landing page de outro segmento.

4. As ${limit} variações precisam ser VISUALMENTE diferentes.

5. Não faça apenas troca de cores.

Varie de maneira controlada:
- composição do hero;
- proporção entre texto e imagem;
- alinhamento;
- tratamento das imagens;
- ritmo vertical;
- apresentação dos cards;
- superfícies;
- bordas;
- sombras;
- tipografia;
- destaque dos CTAs;
- organização visual das seções;
- alternância de fundos;
- composição de galeria quando aplicável.

6. Preserve as seções essenciais definidas pelo layout-base.

7. Só altere a ordem de seções quando isso estiver permitido
   pela variationPolicy do layout-base.

8. NÃO invente:
- profissionais;
- formação;
- registro profissional;
- CRP;
- CNPJ;
- endereço;
- preços;
- serviços;
- depoimentos;
- avaliações;
- métricas;
- anos de experiência;
- números de clientes;
- certificações;
- horários;
- resultados clínicos.

9. Quando um dado não existir:
- não invente;
- marque a seção como dependente de conteúdo real;
- ou reduza sua prioridade visual.

10. Utilize o material real fornecido pelo negócio.

11. Se existirem boas fotografias:
dê protagonismo visual a elas.

12. Evite:
- títulos gigantes ocupando a tela inteira;
- cards genéricos repetitivos;
- excesso de gradientes;
- excesso de sombras;
- aparência de template barato;
- grandes áreas vazias sem intenção;
- texto artificial;
- seções sem função;
- elementos decorativos aleatórios.

13. A primeira dobra deve parecer uma página profissional
de alto nível.

14. A página precisa funcionar em desktop e mobile.

15. CTAs devem respeitar o objetivo de uma página de serviço:
agendamento, orçamento, contato, WhatsApp ou atendimento,
conforme o contexto real.

==================================================
DIFERENÇA ENTRE AS VARIAÇÕES
==================================================

Variação 1:
interpretação mais fiel e equilibrada do layout-base.

Variação 2:
mais editorial e sofisticada, com fotografia mais protagonista.

Variação 3:
mais acolhedora/humana ou emocional, quando compatível
com o segmento.

Variação 4:
mais minimalista e premium, com maior respiro e simplicidade.

Variação 5:
mais orientada à conversão, mantendo a elegância
e a arquitetura do layout-base.

Essas direções NÃO substituem as regras específicas
do layout-base.

==================================================
FORMATO DE RESPOSTA
==================================================

Retorne SOMENTE JSON válido neste formato:

{
  "layoutBaseId": "${layoutBase.id}",
  "segmentFamily": "${layoutBase.segmentFamily}",
  "variations": [
    {
      "id": "string",
      "name": "string",
      "description": "string",

      "layoutBaseId": "${layoutBase.id}",
      "segmentFamily": "${layoutBase.segmentFamily}",

      "visualDirection": "string",

      "composition": {
        "heroLayout": "string",
        "heroTextWidth": "string",
        "heroImageWidth": "string",
        "heroAlignment": "string",
        "imageTreatment": "string",
        "sectionRhythm": "string",
        "cardTreatment": "string",
        "surfaceTreatment": "string"
      },

      "typography": {
        "headingStyle": "string",
        "bodyStyle": "string",
        "scale": "string"
      },

      "visualStyle": {
        "mood": "string",
        "contrast": "string",
        "radius": "string",
        "shadow": "string",
        "spacing": "string"
      },

      "colors": {
        "strategy": "string",
        "primary": "string",
        "secondary": "string",
        "background": "string",
        "surface": "string",
        "text": "string",
        "accent": "string"
      },

      "sections": [
        {
          "type": "string",
          "variant": "string",
          "visualIntent": "string"
        }
      ],

      "hero": {
        "variant": "string",
        "visualIntent": "string",
        "imageRole": "string",
        "ctaEmphasis": "string"
      },

      "mobile": {
        "heroStack": "string",
        "sectionSpacing": "string",
        "cards": "string",
        "ctaBehavior": "string"
      }
    }
  ]
}

Retorne EXATAMENTE ${limit} variações.
`;

    const userPrompt = `
DADOS REAIS DO NEGÓCIO

Nome:
${businessName || "não informado"}

Segmento:
${businessSegment || layoutBase.segmentFamily || "não informado"}

Tipo:
${businessType || "serviço"}

Descrição fornecida pelo cliente:
${description || "não informada"}

Respostas do Gerador:
${JSON.stringify(answers || {}, null, 2)}

Materiais disponíveis:
${JSON.stringify(businessMaterials || {}, null, 2)}

Paleta já fornecida:
${JSON.stringify(colors || {}, null, 2)}

Crie as ${limit} variações seguindo rigorosamente
o layout-base aprovado.
`;

    const result = await this.fetchAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      0.7,
    );

    const variations = Array.isArray(result?.variations)
      ? result.variations.slice(0, limit)
      : [];

    if (!variations.length) {
      throw new Error(
        "IA não retornou variações válidas para o layout-base.",
      );
    }

    return {
      layoutBaseId: layoutBase.id,
      layoutBaseName: layoutBase.name,
      segmentFamily: layoutBase.segmentFamily,
      variations,
    };
  }
}