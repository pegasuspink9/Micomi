export interface LessonCreateInput {
  level_id: number;
  lesson_title: string;
  lesson_description: string;
  lesson_content: string;
}

export interface LessonUpdateInput {
  level_id: number;
  lesson_title: string;
  lesson_description: string;
  lesson_content: string;
}
