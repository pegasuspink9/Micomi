export interface PlayerLoginInput {
  identifier: string;
  password: string;
}

export interface PlayerCreateInput {
  player_name: string;
  email: string;
  username: string;
  password?: string;
  google_id?: string;
  facebook_id?: string;
}

export interface PlayerEditProfileInput {
  player_name?: string;
  email?: string;
  username?: string;
  password?: string;
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
