import express from "express";
import * as CharacterController from "./character.controller";

const router = express.Router();

router.get("/", CharacterController.getAllCharacters);
router.get("/:id", CharacterController.getCharacterById);
router.post("/", CharacterController.createCharacter);
router.put("/:id", CharacterController.updateCharacter);
router.delete("/:id", CharacterController.deleteCharacter);

export default router;
