import express from "express";
import * as ChallengeController from "./challenge.controller";

const router = express.Router();

router.get("/", ChallengeController.getAllChallenges);
router.get("/:id", ChallengeController.getChallengeById);
router.post("/", ChallengeController.createChallenge);
router.put("/:id", ChallengeController.updateChallenge);
router.delete("/:id", ChallengeController.deleteChallenge);

export default router;
