import { Router } from "express";
import multer from "multer";
import { PageLandingController } from "../controller/PageLandingController";
import { authMiddleware } from "../middlewares/authMiddleware"; // ajuste se precisar

const routerPageLanding = Router();
const upload = multer({ storage: multer.memoryStorage() });

const controller = new PageLandingController();

// ✅ IMPORTANTE: o field name tem que bater com o front: fd.append("image", file)
routerPageLanding.post(
  "/generate-from-image",
  authMiddleware,            // se sua rota é privada (opcional)
  upload.single("image"),    // ✅ TEM QUE SER "image"
  controller.generateFromImage
);

export default routerPageLanding;