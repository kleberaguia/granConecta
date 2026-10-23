import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload, processImage } from '../config/multerConfig';
import { ControllerIA } from "../controller/ControllerIA";

const routerAI = Router();
const aiController = new ControllerIA();

routerAI.post(
  "/ai/screenshot-to-code",
  authMiddleware,
  processImage,
  upload.single("screenshot"),
  aiController.screenshotToCode
);

export default routerAI;