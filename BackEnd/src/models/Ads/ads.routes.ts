import { Router } from "express";
import { admobRewardCallback } from "./ads.controller";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = Router();

// AdMob Server-Side Verification Webhook
router.get("/admob/reward", authenticate, requirePlayer, admobRewardCallback);

export default router;
