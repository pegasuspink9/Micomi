import bcrypt from "bcrypt";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (plain: string, hashed: string) =>
  bcrypt.compare(plain, hashed);
