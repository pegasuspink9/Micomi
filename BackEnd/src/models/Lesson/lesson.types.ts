export interface LessonCreateInput {
  level_id: number;
  lesson_title: string;
  description: string;
  content: string;
}

export interface LessonUpdateInput {
  level_id: number;
  lesson_title: string;
  description: string;
  content: string;
}
