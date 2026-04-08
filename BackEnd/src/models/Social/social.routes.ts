import { Router } from "express";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";
import * as SocialController from "./social.controller";

const router = Router();

router.post(
  "/friend-requests/:playerId",
  authenticate,
  requirePlayer,
  SocialController.sendFriendRequest,
);

router.get(
  "/friend-requests/incoming",
  authenticate,
  requirePlayer,
  SocialController.getIncomingFriendRequests,
);

router.post(
  "/friend-requests/:requestId/accept",
  authenticate,
  requirePlayer,
  SocialController.acceptFriendRequest,
);

router.post(
  "/friend-requests/:requestId/decline",
  authenticate,
  requirePlayer,
  SocialController.declineFriendRequest,
);

router.get(
  "/friends",
  authenticate,
  requirePlayer,
  SocialController.getFriends,
);

router.get(
  "/profile/:playerId",
  authenticate,
  requirePlayer,
  SocialController.getPublicPlayerProfile,
);

export default router;
