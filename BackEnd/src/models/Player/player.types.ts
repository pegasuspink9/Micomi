export interface PlayerLoginInput {
  email: string;
  password: string;
}

export interface PlayerCreateInput {
  email: string;
  password: string;
  username: string;
  player_name: string;
}

export interface PlayerUpdateInput {
  player_name?: string;
  email?: string;
  password?: string;
  username?: string;
  total_points?: number;
  exp_points?: number;
  coins?: number;
  created_at?: Date;
  last_active?: Date;
  days_logged_in?: number;
}
