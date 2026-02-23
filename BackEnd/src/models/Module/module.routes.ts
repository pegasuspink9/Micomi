import express from "express";
import * as ModuleService from "./module.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", ModuleService.getAllModules);
router.get("/:id", ModuleService.getModuleById);
router.post("/", ModuleService.createModule);
router.put("/:id", ModuleService.updateModule);

export default router;
