export interface LessonCreateInput {
  level_id: number;
  page_number: number;
  page_url: string;
}

export interface LessonUpdateInput {
  level_id?: number;
  page_number?: number;
  page_url?: string;
}
