import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { ImageTemplateValidator } from "./ImageTemplateValidator";
import type {
  ImageTemplateMode,
  ImageTemplateSpec,
} from "./ImageTemplateTypes";

type OpenRouterVisionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AnalyzeImageInput = {
  imagePath: string;
  name?: string;
  mode?: ImageTemplateMode;
  storeId?: string;
};

type ImageInput = {
  dataUrl: string;
  mimeType: string;
  originalFileName: string;
};

export class ImageTemplateAnalyzer {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    apiKey = process.env.OPENROUTER_API_KEY || "",
    model =
      process.env.OPENROUTER_VISION_MODEL ||
      "openai/gpt-4o-mini",
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze({
    imagePath,
    name,
    mode = "institutional",
    storeId,
  }: AnalyzeImageInput): Promise<ImageTemplateSpec> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY nao configurada.");
    }

    const image = await this.readImageAsDataUrl(imagePath);
    const requestedName = name?.trim() || "Template por imagem";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.FRONTEND_URL || "http://localhost:5173",
          "X-OpenRouter-Title":
            "GranConecta Image Template Decoder",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: 12000,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: this.buildSystemPrompt(),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: this.buildUserPrompt(requestedName, mode),
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image.dataUrl,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    const data = (await response.json()) as OpenRouterVisionResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "Nao foi possivel analisar a imagem.",
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(
        "A visao nao retornou a estrutura do template.",
      );
    }

    const parsedSpec = this.parseJson(content);

    const validatedSpec = ImageTemplateValidator.validate({
      ...parsedSpec,
      id: parsedSpec.id || crypto.randomUUID(),
      name: requestedName || parsedSpec.name,
      mode,
      metadata: {
        ...parsedSpec.metadata,
        createdAt: new Date().toISOString(),
        generatedBy: "ai",
        storeId,
        sourceImagePath: imagePath,
        sourceImageName: image.originalFileName,
        sourceImageMimeType: image.mimeType,
      },
    });

    console.log("IMAGE TEMPLATE DECODED:", {
      id: validatedSpec.id,
      name: validatedSpec.name,
      mode: validatedSpec.mode,
      sections: validatedSpec.sections.map((section) => ({
        id: section.id,
        type: section.type,
        elements: section.elements.length,
        backgroundAssetId: section.layout.backgroundAssetId,
      })),
      assets: validatedSpec.assets.map((asset) => ({
        id: asset.id,
        role: asset.role,
        url: asset.url,
        crop: asset.crop,
      })),
    });

    return validatedSpec;
  }

  private buildUserPrompt(
    name: string,
    mode: ImageTemplateMode,
  ): string {
    return `
Analise a imagem enviada como uma captura completa de landing page.

Nome do template: ${name}
Modo solicitado: ${mode}

Sua tarefa NAO e criar uma pagina nova.
Sua tarefa e somente separar e descrever os elementos visuais existentes.

Decodifique a captura de cima para baixo:
1. Separe as faixas visuais em secoes.
2. Classifique cada secao: header, hero, products, services, about, gallery, testimonials, cta, faq, footer ou custom.
3. Para cada secao, estime:
   - altura visual relativa;
   - largura util do conteudo;
   - quantidade de colunas;
   - alinhamento;
   - paddings;
   - gap;
   - cor de fundo;
   - imagem de fundo, se existir;
   - overlay, se existir.
4. Para cada texto legivel, crie um elemento heading ou text.
5. Para cada botao visivel, crie um elemento button.
6. Para cada card/produto/servico, represente a grade com product-grid ou service-grid.
7. Para cada imagem visivel, crie um asset com url asset://id e crop percentual.

Regras importantes:
- Nao invente imagens externas.
- Nao use URLs de Unsplash, placeholders ou bancos de imagem.
- Nao transforme uma imagem de fundo em imagem comum.
- Nao transforme uma imagem comum em fundo.
- Nao mude a ordem das secoes.
- Nao simplifique tudo para uma unica grade.
- Nao invente textos longos.
- Se o texto estiver ilegivel, use um texto curto coerente.
- Os valores de crop sempre sao percentuais da imagem inteira, de 0 a 100.
- Retorne somente JSON valido.
    `.trim();
  }

  private buildSystemPrompt(): string {
    return `
Voce e um analisador visual de layouts.
Voce nao deve criar, melhorar, redesenhar nem reinterpretar livremente.
Voce deve apenas inventariar a imagem recebida e transformar a captura em um JSON estrutural.

O JSON precisa seguir exatamente esta estrutura:
{
  "version": "1.0",
  "id": "string",
  "name": "string",
  "mode": "institutional | service | commerce",
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "backgroundColor": "#hex",
    "surfaceColor": "#hex",
    "textColor": "#hex",
    "mutedTextColor": "#hex",
    "headingFont": "Google Font name",
    "bodyFont": "Google Font name",
    "borderRadius": 0
  },
  "assets": [
    {
      "id": "string",
      "type": "image",
      "role": "background | content | product | decorative",
      "url": "asset://unique-id",
      "alt": "descricao visual objetiva",
      "crop": {
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 20
      }
    }
  ],
  "sections": [
    {
      "id": "string",
      "type": "header | hero | products | services | about | gallery | testimonials | cta | faq | footer | custom",
      "layout": {
        "columns": 1,
        "alignment": "left | center | right",
        "contentWidth": 1180,
        "minHeight": 400,
        "paddingTop": 72,
        "paddingRight": 24,
        "paddingBottom": 72,
        "paddingLeft": 24,
        "gap": 32,
        "backgroundColor": "#hex",
        "backgroundAssetId": "asset-id",
        "backgroundPosition": "center",
        "backgroundSize": "cover",
        "overlayColor": "#hex",
        "overlayOpacity": 0
      },
      "elements": [
        {
          "id": "string",
          "type": "heading | text | button | image | product-grid | service-grid | divider | spacer",
          "content": "string",
          "assetId": "asset-id",
          "button": {
            "id": "string",
            "label": "string",
            "href": "#",
            "action": "navigate",
            "variant": "primary"
          },
          "style": {
            "color": "#hex",
            "backgroundColor": "#hex",
            "fontFamily": "Google Font name",
            "fontSize": 16,
            "fontWeight": 400,
            "lineHeight": 1.5,
            "letterSpacing": 0,
            "textAlign": "left | center | right",
            "width": "100%",
            "maxWidth": "600px",
            "borderRadius": 0,
            "shadow": "none"
          }
        }
      ],
      "commerce": {
        "enabled": false,
        "source": "manual",
        "columns": 3,
        "limit": 3,
        "showPrice": true,
        "showDescription": true,
        "showGallery": true,
        "showAddToCart": true
      }
    }
  ],
  "metadata": {
    "createdAt": "",
    "generatedBy": "ai"
  }
}

Regras de leitura visual:
- Header geralmente e a primeira faixa com logo/menu.
- Hero geralmente e a primeira faixa grande com titulo principal e imagem/fundo.
- Products e gallery possuem cards/imagens repetidas em grade.
- About possui texto institucional com uma imagem lateral ou central.
- CTA possui chamada curta e botao.
- Footer fica no final.
- Quando uma faixa tiver uma imagem ocupando quase toda a area, use essa imagem como backgroundAssetId.
- Quando uma imagem estiver dentro de um card, use role "product".
- Quando uma imagem estiver decorativa, use role "decorative".
- Quando houver texto sobre imagem escura/clara, preserve overlayColor e overlayOpacity.
- Nao retorne Markdown.
    `.trim();
  }

  private async readImageAsDataUrl(
    imagePath: string,
  ): Promise<ImageInput> {
    const imageBuffer = await fs.readFile(imagePath);
    const extension = path.extname(imagePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    const mimeType = mimeTypes[extension];

    if (!mimeType) {
      throw new Error("Formato de imagem nao suportado.");
    }

    return {
      dataUrl: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
      mimeType,
      originalFileName: path.basename(imagePath),
    };
  }

  private parseJson(content: string): ImageTemplateSpec {
    const normalized = content
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(normalized) as ImageTemplateSpec;
    } catch {
      throw new Error(
        "A visao retornou um JSON de template invalido.",
      );
    }
  }
}
