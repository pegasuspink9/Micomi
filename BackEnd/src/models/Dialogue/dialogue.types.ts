export interface DialogueCreateInput {
  level_id: number;
  script?: string;
}

export interface DialogueUpdateInput {
  level_id?: number;
  script?: string;
}
