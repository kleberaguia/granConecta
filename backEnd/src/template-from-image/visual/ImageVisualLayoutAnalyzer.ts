import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  ImageVisualLayout,
} from "./ImageVisualLayoutSchema";

import type {
  TemplatePageMode,
} from "../../templates/schema/TemplatePageSchema";

type AnalyzeVisualLayoutInput = {
  imagePath: string;
  name?: string;
  mode?: TemplatePageMode;
};

type ImageInput = {
  dataUrl: string;
  mimeType: string;
  fileName: string;
};

type VisionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class ImageVisualLayoutAnalyzer {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    apiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "",
    model =
      process.env.OPENROUTER_VISION_MODEL ||
      process.env.OPENAI_VISION_MODEL ||
      "openai/gpt-4o-mini",
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(
    input: AnalyzeVisualLayoutInput,
  ): Promise<ImageVisualLayout> {
    if (!this.apiKey) {
      throw new Error("Chave de IA visual nao configurada.");
    }

    const image = await this.readImage(input.imagePath);
    const name = input.name?.trim() || "Template por imagem";
    const mode = input.mode || "institutional";

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
            "GranConecta Visual Layout Analyzer",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: 14000,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: this.systemPrompt(),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: this.userPrompt(name, mode),
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

    const data = (await response.json()) as VisionResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "Nao foi possivel analisar visualmente a imagem.",
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("A IA visual nao retornou JSON.");
    }

    const parsed = this.parseJson(content);

    return this.normalizeLayout({
      ...parsed,
      id: parsed.id || crypto.randomUUID(),
      name,
      mode,
      image: {
        ...parsed.image,
        mimeType: image.mimeType,
        fileName: image.fileName,
        sourcePath: input.imagePath,
      },
      metadata: {
        ...parsed.metadata,
        createdAt: new Date().toISOString(),
        generatedBy: "vision",
      },
    });
  }

  private systemPrompt(): string {
    return `
Voce e um analisador visual de landing pages.
Sua tarefa NAO e criar HTML, NAO e redesenhar, NAO e melhorar a pagina.
Sua tarefa e devolver um JSON estrutural descrevendo exatamente a imagem.

Analise a imagem de cima para baixo e identifique:
- secoes visuais;
- bounds percentuais de cada secao;
- textos, botoes, imagens e cards dentro de cada secao;
- cores principais;
- tipografia aproximada;
- colunas, alinhamentos e direcao de layout;
- imagem de fundo quando existir;
- quais imagens pertencem a cada secao.

Todos os bounds devem usar porcentagem relativa a imagem inteira:
x, y, width, height entre 0 e 100.

Nao use URLs externas.
Nao gere HTML.
Nao use Markdown.
Retorne apenas JSON valido.
    `.trim();
  }

  private userPrompt(
    name: string,
    mode: TemplatePageMode,
  ): string {
    return `
Nome do template: ${name}
Modo: ${mode}

Retorne um objeto JSON neste formato:

{
  "version": "visual-1.0",
  "id": "string",
  "name": "string",
  "mode": "institutional | service | commerce",
  "image": {
    "width": 0,
    "height": 0,
    "mimeType": "",
    "fileName": "",
    "sourcePath": ""
  },
  "theme": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex",
      "mutedText": "#hex",
      "accent": "#hex"
    },
    "fonts": {
      "heading": "Google Font aproximada",
      "body": "Google Font aproximada",
      "accent": "Google Font aproximada"
    },
    "radius": {
      "sm": 4,
      "md": 8,
      "lg": 16,
      "pill": 999
    },
    "spacing": {
      "sectionY": 72,
      "containerX": 24,
      "gap": 32
    }
  },
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 30
      },
      "layout": {
        "direction": "row | column | grid | overlay",
        "columns": 2,
        "align": "left | center | right",
        "contentPosition": "left | center | right",
        "gap": 32,
        "contentWidth": 1180
      },
      "background": {
        "color": "#hex",
        "assetId": "asset-id",
        "overlayColor": "#hex",
        "overlayOpacity": 0
      },
      "texts": [
        {
          "id": "hero-title",
          "role": "title",
          "text": "texto visivel",
          "bounds": {
            "x": 10,
            "y": 10,
            "width": 40,
            "height": 8
          },
          "color": "#hex",
          "fontFamilyHint": "serif | sans | script | display",
          "fontSize": 48,
          "fontWeight": 600,
          "align": "left"
        }
      ],
      "buttons": [
        {
          "id": "hero-button",
          "label": "texto do botao",
          "bounds": {
            "x": 10,
            "y": 24,
            "width": 16,
            "height": 4
          },
          "backgroundColor": "#hex",
          "color": "#hex",
          "borderRadius": 999
        }
      ],
      "assets": [
        {
          "id": "hero-background",
          "role": "background",
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 100,
            "height": 30
          },
          "description": "descricao objetiva da imagem",
          "dominantColor": "#hex"
        }
      ],
      "cards": [
        {
          "id": "card-1",
          "bounds": {
            "x": 10,
            "y": 40,
            "width": 25,
            "height": 20
          },
          "imageAssetId": "asset-id",
          "titleTextId": "text-id",
          "descriptionTextId": "text-id",
          "priceTextId": "text-id",
          "buttonId": "button-id"
        }
      ]
    }
  ],
  "metadata": {
    "createdAt": "",
    "generatedBy": "vision"
  }
}

Regras:
- Crie uma secao para cada faixa visual importante.
- Header/menu deve ser uma secao "navbar".
- Hero deve conter o titulo principal.
- Vitrines/cards devem ser "products" ou "gallery".
- Se houver imagem grande no fundo de uma secao, crie asset role "background" e coloque background.assetId.
- Se houver imagem dentro de card, crie asset role "product" e associe ao card.
- Se a imagem for decorativa, role "decorative".
- Se o texto for ilegivel, use texto curto coerente.
    `.trim();
  }

  private async readImage(imagePath: string): Promise<ImageInput> {
    const buffer = await fs.readFile(imagePath);
    const extension = path.extname(imagePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    const mimeType = mimeMap[extension];

    if (!mimeType) {
      throw new Error("Formato de imagem nao suportado.");
    }

    return {
      dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
      mimeType,
      fileName: path.basename(imagePath),
    };
  }

  private parseJson(content: string): ImageVisualLayout {
    const normalized = content
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(normalized) as ImageVisualLayout;
    } catch {
      throw new Error("A IA visual retornou JSON invalido.");
    }
  }

  private normalizeLayout(
    layout: ImageVisualLayout,
  ): ImageVisualLayout {
    return {
      ...layout,
      version: "visual-1.0",
      sections: Array.isArray(layout.sections)
        ? layout.sections
        : [],
      theme: {
        colors: {
          primary:
            layout.theme?.colors?.primary || "#4f46e5",
          secondary:
            layout.theme?.colors?.secondary || "#c7d2fe",
          background:
            layout.theme?.colors?.background || "#ffffff",
          surface:
            layout.theme?.colors?.surface || "#ffffff",
          text:
            layout.theme?.colors?.text || "#111827",
          mutedText:
            layout.theme?.colors?.mutedText || "#6b7280",
          accent:
            layout.theme?.colors?.accent ||
            layout.theme?.colors?.primary ||
            "#4f46e5",
        },
        fonts: {
          heading:
            layout.theme?.fonts?.heading || "Playfair Display",
          body:
            layout.theme?.fonts?.body || "Montserrat",
          accent:
            layout.theme?.fonts?.accent,
        },
        radius: {
          sm: layout.theme?.radius?.sm ?? 4,
          md: layout.theme?.radius?.md ?? 8,
          lg: layout.theme?.radius?.lg ?? 16,
          pill: layout.theme?.radius?.pill ?? 999,
        },
        spacing: {
          sectionY:
            layout.theme?.spacing?.sectionY ?? 72,
          containerX:
            layout.theme?.spacing?.containerX ?? 24,
          gap:
            layout.theme?.spacing?.gap ?? 32,
        },
      },
    };
  }
}