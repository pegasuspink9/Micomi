export interface CreateModule {
  level_id: number;
  lesson_content: string;
}

export interface UpdateModule {
  level_id?: number;
  lesson_content?: string;
}
