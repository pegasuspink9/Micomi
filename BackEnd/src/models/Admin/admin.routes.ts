import express from "express";
import * as AdminController from "./admin.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.post("/login", AdminController.loginAdmin);

router.get("/", AdminController.getAllAdmins);
router.get("/:id", AdminController.getAdminById);
router.post("/register", AdminController.createAdmin);
router.put("/:id", AdminController.updateAdmin);
router.delete("/:id", AdminController.deleteAdmin);

export default router;
