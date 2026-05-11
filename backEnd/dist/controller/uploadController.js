"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UploadController {
    async handleUpload(req, res) {
        try {
            const files = req.files;
            // 🔒 Segurança básica
            if (!files || Object.keys(files).length === 0) {
                return res.status(400).json({
                    message: "Nenhum arquivo enviado.",
                });
            }
            // 📦 Helpers
            const mapFiles = (arr) => (arr || []).map((file) => ({
                originalname: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path.replace(/\\/g, "/"), // normaliza Windows
                url: `/${file.path.replace(/\\/g, "/")}`,
            }));
            const singleFile = (arr) => {
                const file = arr?.[0];
                if (!file)
                    return null;
                return {
                    originalname: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path.replace(/\\/g, "/"),
                    url: `/${file.path.replace(/\\/g, "/")}`,
                };
            };
            // 📸 Dados processados
            const imagens = mapFiles(files.files);
            const video = singleFile(files.video_perfil);
            const fotoPerfil = singleFile(files.foto_perfil);
            const fotoHero = singleFile(files.foto_hero);
            // 📤 Resposta padronizada (compatível com seu frontend atual)
            return res.status(200).json({
                success: true,
                // múltiplas imagens
                files: imagens,
                // únicos
                video_perfil: video,
                foto_perfil: fotoPerfil,
                foto_hero: fotoHero,
            });
        }
        catch (error) {
            console.error("Erro no handleUpload:", error);
            return res.status(500).json({
                success: false,
                message: "Erro ao processar upload.",
            });
        }
    }
    // Upload de uma única imagem
    async uploadImage(req, res) {
        const files = req.files;
        const file = files?.foto_perfil?.[0] || files?.foto_hero?.[0];
        if (!file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }
        return res.json({
            message: 'Upload realizado com sucesso!',
            fileName: file.filename,
            originalName: file.originalname,
            path: `/uploads/images/${file.filename}`,
        });
    }
    // Upload de múltiplas imagens
    async uploadImages(req, res) {
        const filesObj = req.files;
        const files = filesObj?.files || [];
        const mapped = files.map((file) => ({
            path: file.path.replace(/\\/g, "/"),
        }));
        return res.json({ files: mapped });
    }
    // Upload de vídeo
    async uploadVideo(req, res) {
        const files = req.files;
        const file = files?.video_perfil?.[0];
        // O middleware processImage salva o caminho em req.body.fundo_video_url
        // ou diretamente no objeto file.path
        const finalPath = file?.path || req.body.fundo_video_url;
        if (!file || !finalPath) {
            return res.status(400).json({
                message: 'Nenhum vídeo enviado ou falha no processamento físico.',
                debug_files: !!file,
                debug_path: !!finalPath
            });
        }
        return res.json({
            message: 'Upload de vídeo realizado com sucesso!',
            // Retornamos o path que o middleware gerou (ex: /uploads/videos/123-video.mp4)
            url: finalPath,
            path: finalPath,
            filename: file.filename || finalPath.split('/').pop(),
            originalName: file.originalname,
        });
    }
}
exports.default = new UploadController();
