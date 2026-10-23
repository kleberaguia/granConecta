import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { promises as fs } from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- FUNÇÃO DE IA ---

async function generateTemplateDataWithAI(descricaoDoCliente: string, templateId: string) {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  
  if (!apiKey) {
    console.error("ERRO: OPENROUTER_API_KEY não encontrada no .env");
    return null;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "Você é um Copywriter Sênior. Retorne APENAS um objeto JSON puro com textos persuasivos para uma landing page."
          },
          {
            role: "user",
            content: `Crie o conteúdo para: ${descricaoDoCliente}. 
            Retorne este formato JSON exatamente:
            {
              "NOME_MARCA": "...",
              "TAGLINE": "...",
              "HERO_TITULO_PARTE1": "...",
              "HERO_TITULO_GRADIENTE": "...",
              "HERO_SUBTITULO": "...",
              "CTA_PRINCIPAL": "...",
              "RECURSOS_TITULO": "...",
              "RECURSOS_SUBTITULO": "...",
              "FINAL_CTA_TITULO": "...",
              "FINAL_CTA_SUBTITULO": "..."
            }`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data: any = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("Erro na resposta da IA:", data);
      return null;
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Erro na chamada da IA:", error);
    return null;
  }
}
 
const TEMPLATES_BASE_PATH = path.join(__dirname, "templates");

app.get("/templates", async (req: Request, res: Response) => {
  try {
    console.log("Listando templates em:", TEMPLATES_BASE_PATH);
    const dirents = await fs.readdir(TEMPLATES_BASE_PATH, { withFileTypes: true });
    
    const availableTemplates = dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    res.json({ templates: availableTemplates });
  } catch (error: any) {
    console.error("Erro ao listar templates:", error.message);
    res.status(500).json({ error: "Pasta de templates não encontrada no caminho especificado." });
  }
});

app.post("/generate", async (req: Request, res: Response) => {
  const { templateName, usuarioId, descricaoDoCliente } = req.body;

  try {
    // Como server.ts e templates/ estão ambos na /src, usamos o TEMPLATES_BASE_PATH definido acima
    const templateDir = path.join(TEMPLATES_BASE_PATH, templateName);
    const htmlPath = path.join(templateDir, "structure.html");
    const cssPath = path.join(templateDir, "style.css");

    console.log("Processando template:", templateName);
    console.log("Abrindo arquivo:", htmlPath);

    // 1. Chamar IA
    const aiData = await generateTemplateDataWithAI(descricaoDoCliente, templateName);

    // 2. Ler arquivos físicos
    const htmlContentBase = await fs.readFile(htmlPath, "utf-8");
    const cssContent = await fs.readFile(cssPath, "utf-8");

    let htmlFinal = htmlContentBase;

    // 3. Substituições da IA
    if (aiData) {
      Object.keys(aiData).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        htmlFinal = htmlFinal.replace(regex, aiData[key]);
      });
    }

    // 4. Substituição do usuarioId (Padrão GranConecta)
    htmlFinal = htmlFinal.replace(/{{USUARIO_ID}}/g, usuarioId || "user_2026_99");

    res.json({ html: htmlFinal, css: cssContent });

  } catch (error: any) {
    console.error("Erro ao gerar página:", error.message);
    res.status(500).json({ 
      error: "Erro ao processar template.", 
      message: error.message,
      pathTentado: error.path 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📂 Pasta de templates configurada em: ${TEMPLATES_BASE_PATH}`);
});