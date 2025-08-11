export interface AdminCreateInput {
  email: string;
  password: string;
  username: string;
  created_at: Date;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}
