export interface CreateModule {
  level_id: number;
  lesson_content: string;
}

export interface UpdateModule {
  level_id?: number;
  lesson_content?: string;
}

export interface CreateModuleTitle {
  module_title: string;
  module_id: number;
}

export interface UpdateModuleTitle {
  module_title?: string;
}
