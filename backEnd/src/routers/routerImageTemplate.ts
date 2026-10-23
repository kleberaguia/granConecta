import { Router } from "express";

import { imageTemplateUpload } from "../config/imageTemplateUpload";
import { ImageTemplateController } from "../controller/ImageTemplateController";
import { authMiddleware } from "../middlewares/authMiddleware";

const routerImageTemplate = Router();
const imageTemplateController = new ImageTemplateController();

routerImageTemplate.post(
  "/templates/from-image",
  authMiddleware,
  imageTemplateUpload.single("image"),
  (req, res) => imageTemplateController.generate(req, res),
);

export default routerImageTemplate;
