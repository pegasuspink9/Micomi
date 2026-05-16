import express from "express";
import * as AdminController from "./admin.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/login", AdminController.loginAdmin);

router.get("/", authenticate, requireAdmin, AdminController.getAllAdmins);
router.get("/:id", authenticate, requireAdmin, AdminController.getAdminById);
router.post("/register", AdminController.createAdmin);
router.put("/:id", authenticate, requireAdmin, AdminController.updateAdmin);
router.delete("/:id", authenticate, requireAdmin, AdminController.deleteAdmin);

export default router;
