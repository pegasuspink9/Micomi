import express from "express";
import * as ThemeShopService from "./theme.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, ThemeShopService.getAllThemes);
router.get("/:id", authenticate, requireAdmin, ThemeShopService.getThemeById);

router.post("/", authenticate, requireAdmin, ThemeShopService.createTheme);
router.put("/:id", authenticate, requireAdmin, ThemeShopService.updateTheme);
router.delete("/:id", authenticate, requireAdmin, ThemeShopService.deleteTheme);

export default router;
