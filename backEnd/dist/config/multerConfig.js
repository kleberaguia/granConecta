"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
// ✅ Diretório raiz para uploads
const uploadRoot = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadRoot)) {
    fs_1.default.mkdirSync(uploadRoot, { recursive: true });
}
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
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
const saveVideo = async (file) => {
    const originalname = file.originalname || "video";
    const extension = path_1.default.extname(originalname) || '.mp4';
    const cleanName = originalname
        .split(".")[0]
        ?.replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.\-_]/g, "");
    const fileName = `${Date.now()}-${cleanName}${extension}`;
    const dir = path_1.default.join(uploadRoot, 'videos');
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const fullPath = path_1.default.join(dir, fileName);
    // Essencial para memoryStorage: gravar o buffer fisicamente
    fs_1.default.writeFileSync(fullPath, file.buffer);
    return `/uploads/videos/${fileName}`;
};
/**
 * Processa e salva imagens usando Sharp
 */
const saveImage = async (file, width, height) => {
    const originalname = file.originalname || "imagem";
    const cleanName = originalname
        .split(".")[0]
        ?.replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.\-_]/g, "");
    const fileName = `${Date.now()}-${cleanName}.webp`;
    const dir = path_1.default.join(uploadRoot, 'images');
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const fullPath = path_1.default.join(dir, fileName);
    await (0, sharp_1.default)(file.buffer)
        .resize(width, height, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(fullPath);
    return `/uploads/images/${fileName}`;
};
const processImage = async (req, res, next) => {
    try {
        console.log("🔥 processImage rodando");
        // 1. Tratamento para single upload (req.file)
        if (req.file) {
            let relativePath;
            if (req.file.mimetype.startsWith('video/')) {
                relativePath = await saveVideo(req.file);
            }
            else {
                relativePath = await saveImage(req.file, 1200, 600);
            }
            const fileName = relativePath.split('/').pop();
            if (fileName) {
                req.file.filename = fileName;
                req.file.path = relativePath;
            }
        }
        // 2. Tratamento para multiple uploads (req.files)
        let files = {};
        if (Array.isArray(req.files)) {
            files = { default: req.files };
        }
        else if (req.files && typeof req.files === 'object') {
            files = req.files;
        }
        // Suporte para vídeo de perfil ou fundo de seção
        if (files['video_perfil'] || files['video']) {
            const videoFile = (files['video_perfil']?.[0] || files['video']?.[0]);
            if (videoFile && videoFile.mimetype.startsWith('video/')) {
                const videoPath = await saveVideo(videoFile);
                req.body.fundo_video_url = videoPath;
                // Injeta no objeto do arquivo para retorno no controller
                videoFile.path = videoPath;
            }
        }
        // Suporte para campo genérico 'files' (usado em alguns forms)
        if (files['files']) {
            const urls = [];
            for (const file of files['files']) {
                let relativePath;
                if (file.mimetype.startsWith('video/')) {
                    relativePath = await saveVideo(file);
                }
                else {
                    relativePath = await saveImage(file, 1200, 600);
                }
                const fileName = relativePath.split('/').pop();
                if (fileName) {
                    file.filename = fileName;
                    file.path = relativePath;
                }
                urls.push(relativePath);
            }
            req.body.files_urls = urls;
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
        next();
    }
    catch (err) {
        console.error("❌ Erro no processImage:", err);
        next(err);
    }
};
exports.processImage = processImage;
