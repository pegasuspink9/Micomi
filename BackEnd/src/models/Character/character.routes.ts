import express from "express";
import * as CharacterService from "./character.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", CharacterService.getAllCharacters);
router.get("/:id", CharacterService.getCharacterById);
router.post("/", CharacterService.createCharacter);
router.put("/:id", CharacterService.updateCharacter);
router.delete("/:id", CharacterService.deleteCharacter);

export default router;
