"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importamos todas as funções necessárias do seu controller
const PerfilPrestadorController_1 = require("../controller/PerfilPrestadorController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
const multerConfig_1 = require("../config/multerConfig");
const routerPrestador = (0, express_1.Router)();
// --- PÚBLICO ---
routerPrestador.get('/perfil-prestador/vitrine', PerfilPrestadorController_1.getVitrinePublica);
routerPrestador.get('/perfil-prestador/detalhes/:id', PerfilPrestadorController_1.getPerfilPublico);
// --- PRESTADOR ---
routerPrestador.get('/perfil-prestador/usuario/:usuarioId', PerfilPrestadorController_1.getPerfilPublico);
// routerPrestador.post(
//   '/perfil-prestador/:usuarioId',
//   authMiddleware,
//   upload.fields([
//     { name: 'foto_perfil_url', maxCount: 1 },
//     { name: 'foto_hero_url', maxCount: 1 },
//     { name: 'hero_video', maxCount: 1 },
//     { name: 'section_image', maxCount: 1 },
//     { name: 'hero_carousel', maxCount: 3 },
//     { name: 'galeria', maxCount: 20 }
//   ]),
//   salvarPerfil
// );
routerPrestador.post('/perfil-prestador/:usuarioId', authMiddleware_1.authMiddleware, multerConfig_1.upload.any(), // Aceita qualquer campo de arquivo, resolvendo o erro "Unexpected field"
PerfilPrestadorController_1.salvarPerfil);
// --- ADMIN (Usado pelo seu Dashboard) ---
// Agora a função 'aprovar' está disponível e mapeada corretamente
routerPrestador.patch("/admin/perfil-prestador/prestadores/:idPerfil/aprovar", authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, PerfilPrestadorController_1.aprovar);
routerPrestador.patch("/perfil-prestador/html-draft", authMiddleware_1.authMiddleware, PerfilPrestadorController_1.updateHtmlDraft);
exports.default = routerPrestador;
