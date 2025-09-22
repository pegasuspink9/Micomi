import express from "express";
import * as AuthController from "../middleware/auth.controller";

const router = express.Router();

router.post("/refresh", AuthController.refreshAccessToken);
router.post("/logout", AuthController.logout);

export default router;
