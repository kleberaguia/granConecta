import { Router } from "express";
import BusinessCatalogController from "../controller/BusinessCatalogController";

const businessCatalogRoutes = Router();

businessCatalogRoutes.get(
  "/public/:storeId/services",
  BusinessCatalogController.listPublicServices,
);

export default businessCatalogRoutes;