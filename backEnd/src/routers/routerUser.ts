import { Router } from "express";
import UserController from "../controller/UserController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';

const routerUser = Router();

/**
 * =========================
 * ROTAS BÁSICAS
 * =========================
 */
routerUser.get("/me", authMiddleware, UserController.getMe);
routerUser.get("/vitrine/:slug", UserController.getVitrineBySlug);
routerUser.get("/pendentes-aprovacao", authMiddleware, UserController.listarPendentes);
routerUser.get("/:id", UserController.getById);
routerUser.get("/", UserController.getAll);

routerUser.post("/", authMiddleware, UserController.create);
routerUser.patch('/track/:id', UserController.trackAction);

/**
 * =========================
 * ATUALIZAÇÃO PERFIL GERAL
 * =========================
 */
routerUser.put(
  "/me/perfil-geral",
  authMiddleware,

  // DEBUG CONTROLADO
  (req, res, next) => {
    console.log("➡️ [PERFIL GERAL] Usuário:", (req as any).user?.usuarioId);
    next();
  },

  upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 },
    { name: 'foto_hero_url', maxCount: 1 }
  ]),

  // DEBUG DE UPLOAD (CRUCIAL)
  (req, res, next) => {
    console.log("📦 FILES RECEBIDOS:", req.files);
    next();
  },

  processImage,

  UserController.atualizarDadosPessoais
);

/**
 * =========================
 * ATUALIZAÇÃO PERFIL PROFISSIONAL
 * =========================
 */
routerUser.put(
  "/me/perfil-profissional",
  authMiddleware,

  (req, res, next) => {
    console.log("➡️ [PERFIL PROFISSIONAL] Usuário:", (req as any).user?.usuarioId);
    next();
  },

  upload.fields([
    { name: 'foto_perfil_url', maxCount: 1 },
    { name: 'foto_hero_url', maxCount: 1 }
  ]),

  (req, res, next) => {
    console.log("📦 FILES RECEBIDOS:", req.files);
    next();
  },

  processImage,

  UserController.atualizarPerfilProfissional
);

/**
 * =========================
 * OUTRAS ROTAS
 * =========================
 */
routerUser.patch("/analisar/:id", authMiddleware, UserController.analisarPerfil);

// Rota genérica de update
routerUser.put("/:id", authMiddleware, UserController.update);
routerUser.delete("/:id", authMiddleware, UserController.delete);

export default routerUser;