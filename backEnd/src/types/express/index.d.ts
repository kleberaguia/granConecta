import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File; // ou Express.Multer.File
      files?: Multer.File[];
    }
  }
}
