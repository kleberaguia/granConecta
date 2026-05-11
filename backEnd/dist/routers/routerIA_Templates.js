"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AI_TemplatesController_1 = require("../controller/AI_TemplatesController");
const multerConfig_1 = require("../config/multerConfig");
const routerIA_Templates = (0, express_1.Router)();
const aiController = new AI_TemplatesController_1.AI_TemplateController();
// Definimos os campos de upload uma única vez para reutilizar nas rotas
const uploadFields = multerConfig_1.upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 }, // Logo da loja
    { name: 'foto_hero_url', maxCount: 1 } // Banner/Capa da loja
]);
// --- Rotas de Listagem e Geração ---
routerIA_Templates.get("/templates", aiController.listTemplates);
routerIA_Templates.post("/generate", aiController.generate);
routerIA_Templates.post("/templates/generateOutroEstilo", aiController.generateOutroEstilo);
/**
 * 🔥 NOVO: ROTA DE ATUALIZAÇÃO INDIVIDUAL DE COMPONENTES
 * Usada pela função refreshSection() do Frontend para trocar apenas
 * uma parte do site (Hero, Galeria, Depoimentos, etc) via AJAX.
 */
routerIA_Templates.post("/refresh-component", aiController.refreshComponent);
/**
 * 1. ROTA DE CRIAÇÃO (POST /save-store)
 * Usada quando o Prestador não tem loja ainda.
 */
routerIA_Templates.post('/save-store', multerConfig_1.processImage, uploadFields, aiController.salvarCustomizacao);
/**
 * 2. ROTA DE ATUALIZAÇÃO (POST /save-store/:id)
 * Usada para Empreendedores ou Prestadores que já possuem ID.
 */
routerIA_Templates.post('/save-store/:id', multerConfig_1.processImage, uploadFields, aiController.salvarCustomizacao);
exports.default = routerIA_Templates;
