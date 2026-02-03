import express from "express";
import * as ModuleService from "./module.service";
import {
  authenticate,
  requireAdmin,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post(
  "/select-module/:moduleId",
  authenticate,
  requirePlayer,
  ModuleService.selectModule, //Select module route: "/module/select-module/:moduleId"
);

router.get("/", ModuleService.getAllModules);
router.get("/:id", ModuleService.getModuleById);
router.post("/", ModuleService.createModule);
router.put("/:id", ModuleService.updateModule);

router.post("/content/", ModuleService.createContent);
router.put("/content/:id", ModuleService.updateContent);

export default router;
