export interface PlayerLoginInput {
  email: string;
  password: string;
}

export interface PlayerCreateInput {
  email: string;
  password: string;
  username: string;
  created_at?: Date;
  last_active?: Date;
  days_logged_in?: number;
}

export interface PlayerUpdateInput {
  email?: string;
  password?: string;
  username?: string;
  created_at?: Date;
  last_active?: Date;
  days_logged_in?: number;
}
