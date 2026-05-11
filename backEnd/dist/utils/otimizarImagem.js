"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otimizarImagem = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const otimizarImagem = async (file) => {
    const novoNome = `${file.filename.split('.')[0]}.webp`;
    const outputPath = path_1.default.resolve(file.destination, 'otimizadas', novoNome);
    // Garante que a pasta existe
    if (!fs_1.default.existsSync(path_1.default.resolve(file.destination, 'otimizadas'))) {
        fs_1.default.mkdirSync(path_1.default.resolve(file.destination, 'otimizadas'));
    }
    await (0, sharp_1.default)(file.path)
        .resize(800, 600, {
        fit: 'cover', // Corta as bordas para preencher sem esticar
        position: 'center'
    })
        .webp({ quality: 80 }) // Converte para WebP com 80% de qualidade (imperceptível)
        .toFile(outputPath);
    // Opcional: deletar a imagem original pesada após processar
    fs_1.default.unlinkSync(file.path);
    return novoNome;
};
exports.otimizarImagem = otimizarImagem;
