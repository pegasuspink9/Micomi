export interface CreateModule {
  module_title: string;
}

export interface UpdateModule {
  module_title?: string;
}

export interface CreateContent {
  module_id: number;
  module_content: string;
}

export interface UpdateContent {
  module_id: number;
  module_content: string;
}
