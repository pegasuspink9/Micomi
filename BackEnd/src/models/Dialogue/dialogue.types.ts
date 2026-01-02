export interface DialogueCreateInput {
  level_id: number;
  micomi_line?: string;
  enemy_line?: string;
}

export interface DialogueUpdateInput {
  level_id?: number;
  micomi_line?: string;
  enemy_line?: string;
}
