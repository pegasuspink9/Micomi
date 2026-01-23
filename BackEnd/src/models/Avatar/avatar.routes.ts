import { Router } from "express";
import * as AvatarController from "./avatar.controller";
import {
  authenticate,
  requirePlayer,
} from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePlayer,
  AvatarController.getAvailableAvatars
);

router.post(
  "/select/:avatarId",
  authenticate,
  requirePlayer,
  AvatarController.selectPlayerAvatar
);

export default router;
