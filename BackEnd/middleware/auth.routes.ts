import express from "express";
import * as OAuthController from "../middleware/auth.controller";

const router = express.Router();

// Mobile Google OAuth endpoint
router.post("/google/mobile", OAuthController.googleMobileAuth);

// Mobile Facebook OAuth endpoint
router.post("/facebook/mobile", OAuthController.facebookMobileAuth);

// Refresh Token
router.post("/refresh", OAuthController.refreshToken);

// Request Reset (User enters email)
router.post("/forgot-password", OAuthController.requestPasswordReset);

// Confirm Reset (User submits token from email + new password)
router.post("/reset-password", OAuthController.resetPassword);
export default router;
