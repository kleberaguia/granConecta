import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "template-references",
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const filename =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, filename);
  },
});

export const imageTemplateUpload = multer({
  storage,

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new Error(
          "Envie uma imagem PNG, JPG ou WEBP.",
        ),
      );

      return;
    }

    callback(null, true);
  },
});