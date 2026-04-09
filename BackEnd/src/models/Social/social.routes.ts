import { Router } from "express";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";
import * as SocialController from "./social.controller";
import * as PlayerController from "../Player/player.controller";

const router = Router();

router.post(
  "/follow/:playerId",
  authenticate,
  requirePlayer,
  SocialController.followPlayer,
);

router.get(
  "/followers",
  authenticate,
  requirePlayer,
  SocialController.getFollowers,
);

router.get(
  "/followers/:playerId",
  authenticate,
  requirePlayer,
  SocialController.getFollowers,
);

router.post(
  "/follow-back/:playerId",
  authenticate,
  requirePlayer,
  SocialController.followBackPlayer,
);

router.delete(
  "/follow/:playerId",
  authenticate,
  requirePlayer,
  SocialController.unfollowPlayer,
);

router.get(
  "/following",
  authenticate,
  requirePlayer,
  SocialController.getFollowing,
);

router.get(
  "/following/:playerId",
  authenticate,
  requirePlayer,
  SocialController.getFollowing,
);

router.get(
  "/profile/:playerId",
  authenticate,
  requirePlayer,
  SocialController.getPublicPlayerProfile,
);

router.get(
  "/recommendations",
  authenticate,
  requirePlayer,
  PlayerController.getFriendRecommendations,
);

export default router;
