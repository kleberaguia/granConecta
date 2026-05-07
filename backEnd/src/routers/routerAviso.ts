import { Router } from "express";
import AvisoController from "../controller/AvisoController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerAviso = Router();

// Tudo em /api/avisos exige auth
routerAviso.use(authMiddleware);

/**
 * GET /api/avisos
 * Lista avisos visíveis para o usuário logado (CONDOMINIO/REDE/ALVO)
 * Obs: não exponha condominio_id via query para morador (deixe o controller bloquear)
 */
routerAviso.get("/", AvisoController.index);

/**
 * POST /api/avisos
 * Cria um aviso.
 * Body pode ter: titulo, conteudo, tipo, prioridade, visibilidade, targets[]
 */
routerAviso.post("/", AvisoController.store);

/**
 * PATCH /api/avisos/:id/status
 * Atualiza status do aviso (ATIVO/ENCERRADO/ARQUIVADO).
 */
routerAviso.patch("/:id/status", AvisoController.updateStatus);

/**
 * POST /api/avisos/:id/visto
 * Marca como visto (para sumir da Home e diminuir contador)
 */
routerAviso.post("/:id/visto", AvisoController.marcarVisto);

export default routerAviso;
