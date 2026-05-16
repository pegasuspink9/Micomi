import express from "express";
import * as ModuleService from "./module.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

// Get all module languages
router.get(
  "/languages",
  authenticate,
  requirePlayer,
  ModuleService.getModuleLanguages,
);
// Get the module by :/mapId
router.post(
  "/languages/:mapId",
  authenticate,
  requirePlayer,
  ModuleService.getModuleTitlesByMap,
);
// Get module content by :/moduleId
router.post(
  "/languages/map/:moduleId",
  authenticate,
  requirePlayer,
  ModuleService.getModuleContentById,
);

router.get("/", authenticate, requireAdmin, ModuleService.getAllModules);
router.get("/:id", authenticate, requireAdmin, ModuleService.getModuleById);
router.post("/", authenticate, requireAdmin, ModuleService.createModule);
router.put("/:id", authenticate, requireAdmin, ModuleService.updateModule);

router.post(
  "/title",
  authenticate,
  requireAdmin,
  ModuleService.createModuleTitle,
);
router.put(
  "/title/:id",
  authenticate,
  requireAdmin,
  ModuleService.updateModuleTitle,
);

export default router;
