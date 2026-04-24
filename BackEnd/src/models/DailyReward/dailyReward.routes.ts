import express from "express";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";
import { getDailyReward, claimDailyReward } from "./dailyReward.service";

const router = express.Router();

router.get("/", authenticate, requirePlayer, getDailyReward);
router.post("/:rewardId/claim", authenticate, requirePlayer, claimDailyReward);

export default router;
