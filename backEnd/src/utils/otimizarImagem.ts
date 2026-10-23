import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export const otimizarImagem = async (file: Express.Multer.File) => {
  const novoNome = `${file.filename.split('.')[0]}.webp`;
  const outputPath = path.resolve(file.destination, 'otimizadas', novoNome);

  // Garante que a pasta existe
  if (!fs.existsSync(path.resolve(file.destination, 'otimizadas'))) {
    fs.mkdirSync(path.resolve(file.destination, 'otimizadas'));
  }

  await sharp(file.path)
    .resize(800, 600, { // Força o tamanho que combinamos
      fit: 'cover',   // Corta as bordas para preencher sem esticar
      position: 'center'
    })
    .webp({ quality: 80 }) // Converte para WebP com 80% de qualidade (imperceptível)
    .toFile(outputPath);

  // Opcional: deletar a imagem original pesada após processar
  fs.unlinkSync(file.path);

  return novoNome;
};