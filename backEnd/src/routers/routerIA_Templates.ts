import { Router } from 'express';
import { AI_TemplateController } from "../controller/AI_TemplatesController";
import { upload, processImage } from '../config/multerConfig';

const routerIA_Templates = Router();
const aiController = new AI_TemplateController();

//routerIA_Templates.get("/templates", aiController.listTemplates);
routerIA_Templates.get("/templates", (req, res) => aiController.listTemplates(req, res));
// Definimos os campos de upload uma única vez para reutilizar nas rotas
const uploadFields = upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 }, // Logo da loja
    { name: 'foto_hero_url', maxCount: 1 }    // Banner/Capa da loja
]);

// --- Rotas de Listagem e Geração ---
routerIA_Templates.post("/generate", aiController.generate);

routerIA_Templates.post("/generate-variations", aiController.generateVariations);

routerIA_Templates.post("/ai/templates/generate-style",aiController.generateStyle.bind(aiController));

routerIA_Templates.post("/ai/templates/generate-variation", aiController.generateVariation.bind(aiController),
);
routerIA_Templates.post("/templates/preview", aiController.previewTemplate.bind(aiController));

routerIA_Templates.post("/templates/save", aiController.saveTemplate.bind(aiController));
//routerIA_Templates.post("/templates/generateOutroEstilo", aiController.generateOutroEstilo);


/**
 * 🔥 NOVO: ROTA DE ATUALIZAÇÃO INDIVIDUAL DE COMPONENTES
 * Usada pela função refreshSection() do Frontend para trocar apenas
 * uma parte do site (Hero, Galeria, Depoimentos, etc) via AJAX.
 */
// routerIA_Templates.post(
//     "/refresh-component", 
//     aiController.refreshComponent
// );

/**
 * 1. ROTA DE CRIAÇÃO (POST /save-store)
 * Usada quando o Prestador não tem loja ainda. 
 */
// routerIA_Templates.post(
//     '/save-store', 
//     processImage,
//     uploadFields,
//     aiController.salvarCustomizacao
// );

/**
 * 2. ROTA DE ATUALIZAÇÃO (POST /save-store/:id)
 * Usada para Empreendedores ou Prestadores que já possuem ID.
 */
// routerIA_Templates.post(
//     '/save-store/:id', 
//     processImage,
//     uploadFields,
//     aiController.salvarCustomizacao
// );

export default routerIA_Templates;