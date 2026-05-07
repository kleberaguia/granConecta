// src/controllers/prestadorController.ts
import { Request, Response } from "express";
import prestadorService from "../services/prestadorService";
import sharp from "sharp";
import path from 'path';
import fs from 'fs';

export default {
  async atualizarPerfil(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.usuarioId;
      const data = req.body;

      if (!usuarioId) return res.status(400).json('Usuario não encontrado')

      const prestador = await prestadorService.atualizarPerfil(usuarioId, data);
      return res.json(prestador);
    } catch (err: any) {
      return res.status(400).json({ erro: err.message });
    }
  },

async uploadFoto(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.usuarioId;
      const arquivoOriginal = req.file; // O arquivo que o seu 'upload.ts' acabou de salvar

      if (!arquivoOriginal) throw new Error("FOTO_OBRIGATORIA");
      if (!usuarioId) return res.status(400).json('Usuario não encontrado');

      // 1. Pegamos o caminho onde o seu Multer salvou (finalPath do storageConfig)
      const inputPath = arquivoOriginal.path; 
      
      // 2. Definimos o nome do arquivo otimizado
      const nomeOtimizado = `otimizado-${arquivoOriginal.filename.split('.')[0]}.webp`;
      
      // 3. O caminho de saída será na mesma pasta que o Multer usou
      const outputPath = path.join(arquivoOriginal.destination, nomeOtimizado);

      // 4. SHARP - Redimensiona e converte
      await sharp(inputPath)
        .resize(800, 600, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // 5. Deleta o original pesado (que o Multer salvou antes)
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      // 6. Atualiza o banco com o nome do arquivo que REALMENTE sobrou
      // Importante: Salve o caminho relativo ou apenas o nome, conforme seu padrão
      const prestador = await prestadorService.atualizarFoto(usuarioId, nomeOtimizado);
      
      return res.json(prestador);

    } catch (err: any) {
      console.error("Erro no processamento da imagem:", err);
      return res.status(400).json({ erro: err.message });
    }
  },
  async verPerfil(req: Request, res: Response) {
    const usuarioId = req.user?.usuarioId;
    if (!usuarioId) return res.status(400).json('Usuario não encontrado')
    const perfil = await prestadorService.buscarPerfil(usuarioId);
    return res.json(perfil);
  },


  async getVitrinePublica(req: Request, res: Response){
    try {
      const { categoria } = req.query; // Pega o que vem na URL
      const dados = await prestadorService.getVitrineService(categoria as string);
      return res.json(dados);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao carregar vitrine" });
    }
  }
};
