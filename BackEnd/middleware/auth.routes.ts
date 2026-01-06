import express from "express";
import * as OAuthController from "../middleware/auth.controller";

const router = express.Router();

// Mobile Google OAuth endpoint
router.post("/google/mobile", OAuthController.googleMobileAuth);

// Mobile Facebook OAuth endpoint
router.post("/facebook/mobile", OAuthController.facebookMobileAuth);

export default router;
