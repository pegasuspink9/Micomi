import express from "express";
import * as ThemeShopService from "./theme.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", ThemeShopService.getAllThemes);
router.get("/:id", ThemeShopService.getThemeById);

router.post("/", ThemeShopService.createTheme);
router.put("/:id", ThemeShopService.updateTheme);
router.delete("/:id", ThemeShopService.deleteTheme);

export default router;
