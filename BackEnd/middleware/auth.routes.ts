import express from "express";
import * as OAuthController from "../middleware/auth.controller";
import {
  oauthLimiter,
  refreshLimiter,
  passwordResetLimiter,
  passwordResetEmailLimiter,
} from "../middleware/rateLimit.middleware";

const router = express.Router();

// Mobile Google OAuth endpoint
router.post("/google/mobile", oauthLimiter, OAuthController.googleMobileAuth);

// Mobile Facebook OAuth endpoint
router.post(
  "/facebook/mobile",
  oauthLimiter,
  OAuthController.facebookMobileAuth,
);

// Refresh Token
router.post("/refresh", refreshLimiter, OAuthController.refreshToken);

// Logout
router.post("/logout", OAuthController.logout);

// Request Reset (User enters email)
router.post(
  "/forgot-password",
  passwordResetLimiter,
  passwordResetEmailLimiter,
  OAuthController.requestPasswordReset,
);

// Confirm Reset (User submits token from email + new password)
router.post(
  "/reset-password",
  passwordResetLimiter,
  OAuthController.resetPassword,
);
export default router;
