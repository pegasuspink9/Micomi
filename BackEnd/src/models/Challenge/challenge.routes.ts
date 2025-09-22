import express from "express";
import * as ChallengeService from "./challenge.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", ChallengeService.getAllChallenges);
router.get("/:id", ChallengeService.getChallengeById);
router.post("/", ChallengeService.createChallenge);
router.put("/:id", ChallengeService.updateChallenge);
router.delete("/:id", ChallengeService.deleteChallenge);

export default router;
