import express from "express";
import * as LessonController from "./lesson.controller";
import {
  authenticate,
  requireAdmin,
} from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/", authenticate, LessonController.getAllLessons);
router.get("/:id", authenticate, LessonController.getLessonById);
router.post("/", authenticate, requireAdmin, LessonController.createLesson);
router.put("/:id", authenticate, requireAdmin, LessonController.updateLesson);
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  LessonController.deleteLesson
);

export default router;
