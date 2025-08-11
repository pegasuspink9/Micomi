import express from "express";
import * as LessonController from "./lesson.controller";

const router = express.Router();

router.get("/", LessonController.getAllLessons);
router.get("/:id", LessonController.getLessonById);
router.post("/", LessonController.createLesson);
router.put("/:id", LessonController.updateLesson);
router.delete("/:id", LessonController.deleteLesson);

export default router;
