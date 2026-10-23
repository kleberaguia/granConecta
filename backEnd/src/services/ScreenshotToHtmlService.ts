//import { toDataUrl } from "../helpers/utils";
import { renderToPng } from "../helpers/renderHtml";

export class ScreenshotToHtmlService {
  async generateFromImage(buffer: Buffer, mimeType: string) {
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.15,
        max_tokens: 2500,
        messages: [
          {
            role: "system",
            content: `
Você é especialista em converter screenshots em HTML e CSS com ALTA fidelidade visual.

Retorne SOMENTE JSON válido:
{
  "html": "...conteúdo do body...",
  "css": "...css completo..."
}

Regras:
- Não use markdown.
- Não explique nada.
- Preserve estrutura, espaçamento e grid.
- Use medidas em px.
- Viewport base: 1440px.
- Não use variáveis desnecessárias.
- Não simplifique.
`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Converta esta imagem em landing page." },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ]
      })
    });

    const json = await response.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      html: parsed.html,
      css: parsed.css
    };
  }
}