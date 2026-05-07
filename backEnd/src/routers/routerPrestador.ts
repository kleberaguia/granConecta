import { Router } from 'express';
// Importamos todas as funções necessárias do seu controller
import {
  salvarPerfil,
  getVitrinePublica,
  getPerfilPublico,
  aprovar,
  updateHtmlDraft

} from '../controller/PerfilPrestadorController';

import { authMiddleware } from '../middlewares/authMiddleware';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';
import { upload, processImage } from '../config/multerConfig';
import PerfilPrestadorService from '../services/PerfilPrestadorService';

const routerPrestador = Router();

// --- PÚBLICO ---
routerPrestador.get('/perfil-prestador/vitrine', getVitrinePublica);

routerPrestador.get('/perfil-prestador/detalhes/:id', getPerfilPublico);

// --- PRESTADOR ---

routerPrestador.get('/perfil-prestador/usuario/:usuarioId', getPerfilPublico);

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

routerPrestador.post(
  '/perfil-prestador/:usuarioId',
  authMiddleware,
  upload.any(), // Aceita qualquer campo de arquivo, resolvendo o erro "Unexpected field"
  salvarPerfil
);

// --- ADMIN (Usado pelo seu Dashboard) ---
// Agora a função 'aprovar' está disponível e mapeada corretamente
routerPrestador.patch("/admin/perfil-prestador/prestadores/:idPerfil/aprovar", authMiddleware, isAdminMiddleware, aprovar);



routerPrestador.patch("/perfil-prestador/html-draft", authMiddleware,updateHtmlDraft);


export default routerPrestador;