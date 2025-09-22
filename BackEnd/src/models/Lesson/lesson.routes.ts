import express from "express";
import * as LessonService from "./lesson.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", LessonService.getAllLessons);
router.get("/:id", LessonService.getLessonById);
router.post("/", LessonService.createLesson);
router.put("/:id", LessonService.updateLesson);
router.delete("/:id", LessonService.deleteLesson);

export default router;
