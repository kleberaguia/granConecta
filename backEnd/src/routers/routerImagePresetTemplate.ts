import { Router } from "express";

import { ImagePresetTemplateController } from "../controller/ImagePresetTemplateController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { upload } from "../config/multerConfig";

const routerImagePresetTemplate = Router();
const controller = new ImagePresetTemplateController();

routerImagePresetTemplate.post("/templates/presets/editorial-commerce",
    upload.single("image"),
  (req, res) => controller.generateEditorialCommerce(req, res),
);

export default routerImagePresetTemplate;
