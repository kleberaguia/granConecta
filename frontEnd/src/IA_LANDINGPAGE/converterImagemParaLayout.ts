import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Part } from "@google/generative-ai";
import type { LayoutConfig } from "../interfaces/types";
import {config } from 'dotenv'
config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateLayoutFromImage(imageBuffer: Buffer, mimeType: string): Promise<LayoutConfig> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const imagePart: Part = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType
    }
  };

  const prompt = `
    Aja como um desenvolvedor Fullstack. Analise esta imagem e extraia a estrutura para uma landing page.
    Retorne OBRIGATORIAMENTE um JSON no seguinte formato:
    {
      "theme": "modern",
      "colors": { "primary": "hex_da_cor_principal", "background": "#ffffff", "text": "#333333" },
      "sections": [
        { "type": "HERO", "title": "...", "subtitle": "...", "buttonText": "..." },
        { "type": "FEATURES", "items": [{ "title": "...", "description": "..." }] }
      ]
    }
  `;

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();
  
  return JSON.parse(text) as LayoutConfig;
}