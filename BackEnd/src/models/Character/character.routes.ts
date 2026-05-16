import express from "express";
import * as CharacterService from "./character.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, CharacterService.getAllCharacters);
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  CharacterService.getCharacterById,
);
router.post("/", authenticate, requireAdmin, CharacterService.createCharacter);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  CharacterService.updateCharacter,
);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  CharacterService.deleteCharacter,
);

export default router;
