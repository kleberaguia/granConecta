import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

// ✅ Diretório raiz para uploads
const uploadRoot = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    // Elevado para 750MB para suportar vídeos grandes de alta definição
    fileSize: 500 * 1024 * 1024,
    fieldSize: 500 * 1024 * 1024
  }
});

/**
 * Salva vídeos diretamente no disco (sem Sharp)
 */
const saveVideo = async (file: Express.Multer.File) => {
  const originalname = file.originalname || "video";
  const extension = path.extname(originalname) || '.mp4';

  const cleanName = originalname
    .split(".")[0]
    ?.replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");

  const fileName = `${Date.now()}-${cleanName}${extension}`;
  const dir = path.join(uploadRoot, 'videos');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fullPath = path.join(dir, fileName);

  // Essencial para memoryStorage: gravar o buffer fisicamente
  fs.writeFileSync(fullPath, file.buffer);
  return `/uploads/videos/${fileName}`;
};

/**
 * Processa e salva imagens usando Sharp
 */
const saveImage = async (
  file: Express.Multer.File,
  width: number,
  height: number
) => {
  const originalname = file.originalname || "imagem";
  const cleanName = originalname
    .split(".")[0]
    ?.replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");

  const fileName = `${Date.now()}-${cleanName}.webp`;
  const dir = path.join(uploadRoot, 'images');




  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fullPath = path.join(dir, fileName);

  await sharp(file.buffer)
    .resize(width, height, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(fullPath);

  return `/uploads/images/${fileName}`;
};

/**
 * Salva material visual da Landing Page preservando a proporção original.
 *
 * Diferente de saveImage(), não força 1200x600 e não recorta com fit: "cover".
 * Apenas limita imagens muito grandes e converte para WebP.
 *
 * Isso permite que a CreativeDirection decida depois se a imagem funciona melhor
 * como retrato profissional, hero, ambiente, produto, galeria etc.
 */
const saveLandingMaterialImage = async (file: Express.Multer.File) => {
  const originalname = file.originalname || "material";
  const cleanName =
    originalname
      .split(".")[0]
      ?.replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "") || "material";

  const fileName = `${Date.now()}-${cleanName}.webp`;
  const dir = path.join(uploadRoot, "landing-materials");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fullPath = path.join(dir, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toFile(fullPath);

  return `/uploads/landing-materials/${fileName}`;
};


/**
 * ============================================================
 * CLASSIFICADOS
 * ============================================================
 *
 * Preserva a proporção original da foto do produto.
 * Não utiliza "cover", portanto não corta notebook,
 * celular, bicicleta, móvel etc.
 */
const saveClassificadoImage = async (
  file: Express.Multer.File
): Promise<string> => {
  if (!file.mimetype.startsWith("image/")) {
    throw new Error(
      `Arquivo de classificado não suportado: ${file.mimetype}`
    );
  }

  const originalname =
    file.originalname || "classificado";

  const cleanName =
    originalname
      .split(".")[0]
      ?.replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "") ||
    "classificado";

  const fileName =
    `${Date.now()}-${cleanName}.webp`;

  const dir = path.join(
    uploadRoot,
    "classificados"
  );

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }

  const fullPath =
    path.join(dir, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 84,
    })
    .toFile(fullPath);

  return `/uploads/classificados/${fileName}`;
};

export const processImage = async (req: Request, res: Response, next: NextFunction) => {
  try {

    // 1. Tratamento para single upload (req.file)
    if (req.file) {
      let relativePath;
      if (req.file.mimetype.startsWith('video/')) {
        relativePath = await saveVideo(req.file);
      } else if (req.file.mimetype.startsWith('image/')) {
        relativePath = await saveImage(req.file, 1200, 600);
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${req.file.mimetype}`);
      }

      const fileName = relativePath.split('/').pop();
      if (fileName) {
        (req.file as any).filename = fileName;
        (req.file as any).path = relativePath;
      }
    }

    // 2. Tratamento para multiple uploads (req.files)
    let files: { [fieldname: string]: Express.Multer.File[] } = {};

    if (Array.isArray(req.files)) {
      files = {
        default: req.files, // mantém compatibilidade
        files: req.files    // adiciona suporte ao mural
      };
    } else if (req.files && typeof req.files === "object") {
      files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
    }

    // Suporte para vídeo de perfil ou fundo de seção
    if (files['video_perfil'] || files['video']) {
      const videoFile = (files['video_perfil']?.[0] || files['video']?.[0]);
      if (videoFile && videoFile.mimetype.startsWith('video/')) {
        const videoPath = await saveVideo(videoFile);
        req.body.fundo_video_url = videoPath;
        // Injeta no objeto do arquivo para retorno no controller
        (videoFile as any).path = videoPath;
      }
    }

    // Suporte para campo genérico 'files' (usado em alguns forms)
    if (files['files']) {
      const urls = [];
      for (const file of files['files']) {
        let relativePath;

        if (file.mimetype.startsWith('video/')) {
          relativePath = await saveVideo(file);
        } else {
          relativePath = await saveImage(file, 1200, 600);
        }

        const fileName = relativePath.split('/').pop();
        if (fileName) {
          (file as any).filename = fileName;
          (file as any).path = relativePath;
        }
        urls.push(relativePath);
      }
      req.body.files_urls = urls;
    }

    // Materiais visuais para o Gerador de Landing Pages.
    // Este campo preserva a proporção das imagens para uso posterior pela
    // CommercialStrategy / CreativeDirection / VisualContext.
    if (files['landing_materials']) {
      const urls: string[] = [];

      for (const file of files['landing_materials']) {
        let relativePath: string;

        if (file.mimetype.startsWith('video/')) {
          relativePath = await saveVideo(file);
        } else if (file.mimetype.startsWith('image/')) {
          relativePath = await saveLandingMaterialImage(file);
        } else {
          throw new Error(
            `Tipo de material da Landing Page não suportado: ${file.mimetype}`
          );
        }

        const fileName = relativePath.split('/').pop();

        if (fileName) {
          (file as any).filename = fileName;
          (file as any).path = relativePath;
        }

        urls.push(relativePath);
      }

      req.body.landing_materials_urls = urls;
    }

    // Foto de Perfil (Imagem)
    const perfil = files.foto_perfil?.[0] || files.foto_perfil_url?.[0];
    if (perfil && perfil.mimetype.startsWith('image/')) {
      req.body.foto_perfil_url = await saveImage(perfil, 500, 500);
    }

    // Foto Hero (Imagem)
    const hero = files.foto_hero?.[0] || files.foto_hero_url?.[0];
    if (hero && hero.mimetype.startsWith('image/')) {
      req.body.foto_hero_url = await saveImage(hero, 1200, 600);
    }

    // Carousel de Imagens
    if (files.hero_carousel) {
      const urls = [];
      for (const file of files.hero_carousel) {
        if (file.mimetype.startsWith('image/')) {
          urls.push(await saveImage(file, 1200, 600));
        }
      }
      req.body.hero_carousel_urls = urls;
    }


    // ============================================================
    // FOTOS DOS CLASSIFICADOS
    // ============================================================

    if (files["classificado_imagens"]) {
      const imagens =
        files["classificado_imagens"];

      if (imagens.length > 8) {
        throw new Error(
          "CLASSIFICADO_MAXIMO_8_IMAGENS"
        );
      }

      const urls: string[] = [];

      for (const file of imagens) {
        if (
          !file.mimetype.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            "CLASSIFICADO_ARQUIVO_INVALIDO"
          );
        }

        const relativePath =
          await saveClassificadoImage(
            file
          );

        const fileName =
          relativePath
            .split("/")
            .pop();

        if (fileName) {
          (file as any).filename =
            fileName;

          (file as any).path =
            relativePath;
        }

        urls.push(relativePath);
      }

      req.body.classificado_imagens_urls =
        urls;
    }

    next();
  } catch (err) {
    console.error("❌ Erro no processImage:", err);
    next(err);
  }
};