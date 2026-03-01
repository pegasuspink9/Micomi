import express from "express";
import * as ModuleService from "./module.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

// Get all module languages
router.get("/languages", ModuleService.getModuleLanguages);
// Get the module by :/mapId
router.post("/languages/:mapId", ModuleService.getModuleTitlesByMap);
// Get module content by :/moduleId
router.post("/languages/map/:moduleId", ModuleService.getModuleContentById);

router.get("/", ModuleService.getAllModules);
router.get("/:id", ModuleService.getModuleById);
router.post("/", ModuleService.createModule);
router.put("/:id", ModuleService.updateModule);

router.post("/title", ModuleService.createModuleTitle);
router.put("/title/:id", ModuleService.updateModuleTitle);

export default router;
