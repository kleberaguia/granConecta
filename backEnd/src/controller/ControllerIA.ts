import type { RequestHandler } from "express";
import fs from "fs";
import OpenAI from "openai";
import { sanitizeHtmlBasic } from "../utils/html/sanitizeHtmlBasic";
import { instrumentHtmlForEditor } from "../utils/html/instrumentHtmlForEditor";
import { ensureHtmlBoilerplate } from "../utils/html/ensureHtmlBoilerplate";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

export class ControllerIA {
  screenshotToCode: RequestHandler = async (req, res) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "Arquivo screenshot não enviado." });

      const buffer: Buffer =
        (file as any).buffer
          ? (file as any).buffer
          : file.path && fs.existsSync(file.path)
            ? fs.readFileSync(file.path)
            : Buffer.from("");

      if (!buffer.length) return res.status(400).json({ error: "Falha ao ler o screenshot." });

      const mime = file.mimetype || "image/png";
      const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

      const prompt = `
Gere um HTML COMPLETO e ESTÁTICO (sem markdown), fiel ao screenshot.

REGRAS:
- NÃO use Tailwind CDN.
- NÃO use scripts (sem <script>).
- Use CSS dentro de <style> no <head>. (pode usar classes utilitárias próprias)
- Layout desktop: container max-width:1100px; margin:0 auto.
- Hero com background-image inline usando aspas simples:
  style="background-image:url('https://placehold.co/1600x900');"
  e marque com data-edit="bg".
- Todas as imagens <img> devem ter data-edit="image".
- Textos (h1..h6,p,span,a,button,li,label,small,strong,em) devem ter data-edit="text".
- Use placehold.co quando precisar.
- Imagens devem ser responsivas (ex.: width:100%; height:auto; object-fit:cover).
- Não usar fontes externas. Use system font stack.

Retorne APENAS o HTML final.
`.trim();

      const resp = await openai.chat.completions.create({
        model: getOpenAIModel(),
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ],
          },
        ],
      });

      let html = resp.choices?.[0]?.message?.content || "";
      html = ensureHtmlBoilerplate(html);

      // Sanitiza (mantém <style>, remove scripts e perigos)
      html = sanitizeHtmlBasic(html, {
        allowScripts: false,
        allowTailwindCdn: false,
      });

      // Instrumenta data-edit e ids
      html = instrumentHtmlForEditor(html);

      return res.json({ ok: true, htmlDraft: html });
    } catch (err: any) {
      console.error("AI screenshotToCode error:", err);
      return res.status(500).json({ error: err?.message || "Erro na IA" });
    }
  };
}