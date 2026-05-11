"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageLandingController = void 0;
const fs_1 = __importDefault(require("fs"));
const LandingPageService_1 = require("../services/LandingPageService");
/**
 * Utilitário para extrair o buffer independente da configuração do Multer (Disk ou Memory)
 */
function getFileBuffer(file) {
    if (!file)
        return null;
    const anyFile = file;
    // ✅ memoryStorage (Buffer direto na memória)
    if (anyFile.buffer)
        return anyFile.buffer;
    // ✅ diskStorage (Lê o arquivo salvo temporariamente no disco)
    if (file.path && fs_1.default.existsSync(file.path)) {
        return fs_1.default.readFileSync(file.path);
    }
    return null;
}
class PageLandingController {
    constructor() {
        this.landingService = new LandingPageService_1.LandingPageService();
        this.generateFromImage = async (req, res) => {
            try {
                const authReq = req;
                // [cite: 2026-01-10] Uso padronizado de usuarioId
                const usuarioId = authReq.user?.usuarioId;
                if (!usuarioId) {
                    return res.status(401).json({ error: "Não autorizado" });
                }
                // Captura o ID do template escolhido pelo usuário (ex: 'wellness_gold')
                // Se não enviar nada, podemos definir um padrão ou retornar erro
                const { templateId, condominioId } = req.body; // Adicione o condominioId aqui
                if (!templateId) {
                    return res.status(400).json({ error: "O templateId é obrigatório para definir o estilo visual." });
                }
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: "Arquivo não enviado" });
                }
                const buffer = getFileBuffer(file);
                if (!buffer) {
                    return res.status(400).json({
                        error: "Não foi possível ler o arquivo. Verifique a configuração do Multer.",
                    });
                }
                const mimeType = file.mimetype || "image/png";
                // Chamada sincronizada com o Service atualizado
                const out = await this.landingService.generateLanding({
                    usuarioId,
                    // Repasse para o service
                    templateId,
                    imageBuffer: buffer,
                    mimeType,
                });
                // Limpeza de arquivos temporários se estiver usando diskStorage
                if (file.path && fs_1.default.existsSync(file.path)) {
                    try {
                        fs_1.default.unlinkSync(file.path);
                    }
                    catch {
                        // ignore error on unlink
                    }
                }
                return res.json(out); // Retorna { html, css, spec }
            }
            catch (e) {
                console.error("generate-from-image error:", e);
                return res.status(500).json({ error: e?.message || "Erro interno ao gerar landing page" });
            }
        };
    }
}
exports.PageLandingController = PageLandingController;
