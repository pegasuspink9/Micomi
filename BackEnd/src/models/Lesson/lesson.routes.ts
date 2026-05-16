import express from "express";
import * as LessonService from "./lesson.service";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, requireAdmin, LessonService.getAllLessons);
router.get("/:id", authenticate, requireAdmin, LessonService.getLessonById);
router.post("/", authenticate, requireAdmin, LessonService.createLesson);
router.put("/:id", authenticate, requireAdmin, LessonService.updateLesson);
router.delete("/:id", authenticate, requireAdmin, LessonService.deleteLesson);

export default router;
