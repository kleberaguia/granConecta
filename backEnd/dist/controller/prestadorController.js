"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prestadorService_1 = __importDefault(require("../services/prestadorService"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.default = {
    async atualizarPerfil(req, res) {
        try {
            const usuarioId = req.user?.usuarioId;
            const data = req.body;
            if (!usuarioId)
                return res.status(400).json('Usuario não encontrado');
            const prestador = await prestadorService_1.default.atualizarPerfil(usuarioId, data);
            return res.json(prestador);
        }
        catch (err) {
            return res.status(400).json({ erro: err.message });
        }
    },
    async uploadFoto(req, res) {
        try {
            const usuarioId = req.user?.usuarioId;
            const arquivoOriginal = req.file; // O arquivo que o seu 'upload.ts' acabou de salvar
            if (!arquivoOriginal)
                throw new Error("FOTO_OBRIGATORIA");
            if (!usuarioId)
                return res.status(400).json('Usuario não encontrado');
            // 1. Pegamos o caminho onde o seu Multer salvou (finalPath do storageConfig)
            const inputPath = arquivoOriginal.path;
            // 2. Definimos o nome do arquivo otimizado
            const nomeOtimizado = `otimizado-${arquivoOriginal.filename.split('.')[0]}.webp`;
            // 3. O caminho de saída será na mesma pasta que o Multer usou
            const outputPath = path_1.default.join(arquivoOriginal.destination, nomeOtimizado);
            // 4. SHARP - Redimensiona e converte
            await (0, sharp_1.default)(inputPath)
                .resize(800, 600, {
                fit: 'cover',
                position: 'center'
            })
                .webp({ quality: 80 })
                .toFile(outputPath);
            // 5. Deleta o original pesado (que o Multer salvou antes)
            if (fs_1.default.existsSync(inputPath)) {
                fs_1.default.unlinkSync(inputPath);
            }
            // 6. Atualiza o banco com o nome do arquivo que REALMENTE sobrou
            // Importante: Salve o caminho relativo ou apenas o nome, conforme seu padrão
            const prestador = await prestadorService_1.default.atualizarFoto(usuarioId, nomeOtimizado);
            return res.json(prestador);
        }
        catch (err) {
            console.error("Erro no processamento da imagem:", err);
            return res.status(400).json({ erro: err.message });
        }
    },
    async verPerfil(req, res) {
        const usuarioId = req.user?.usuarioId;
        if (!usuarioId)
            return res.status(400).json('Usuario não encontrado');
        const perfil = await prestadorService_1.default.buscarPerfil(usuarioId);
        return res.json(perfil);
    },
    async getVitrinePublica(req, res) {
        try {
            const { categoria } = req.query; // Pega o que vem na URL
            const dados = await prestadorService_1.default.getVitrineService(categoria);
            return res.json(dados);
        }
        catch (error) {
            return res.status(500).json({ error: "Erro ao carregar vitrine" });
        }
    }
};
