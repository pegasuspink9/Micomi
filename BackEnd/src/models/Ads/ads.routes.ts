import { Router } from "express";
import { admobRewardCallback } from "./ads.controller";

const router = Router();

// AdMob Server-Side Verification Webhook
router.get("/admob/reward", admobRewardCallback);

export default router;
