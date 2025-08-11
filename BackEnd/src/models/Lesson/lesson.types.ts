export interface LessonCreateInput {
  map_id: number;
  level_id: number;
  lesson_title: string;
  description: string;
  content: string;
}

export interface LessonUpdateInput {
  map_id: number;
  level_id: number;
  lesson_title: string;
  description: string;
  content: string;
}
