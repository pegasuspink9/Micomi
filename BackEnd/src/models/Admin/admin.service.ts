import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateToken } from "../../../utils/token";
import { AdminLoginInput, AdminCreateInput } from "./admin.types";

const prisma = new PrismaClient();

export const getAllAdmins = () => prisma.admin.findMany();
export const getAdminById = (id: number) =>
  prisma.admin.findUnique({ where: { admin_id: id } });

export const createAdmin = async (data: AdminCreateInput) => {
  const hashedPassword = await hashPassword(data.password);

  return prisma.admin.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      created_at: new Date(),
    },
  });
};

export const updateAdmin = async (
  admin_id: number,
  data: Partial<AdminCreateInput>
) => {
  const { password, ...safeData } = data;
  const updateData: any = {
    ...safeData,
  };

  if (password) {
    updateData.password = await hashPassword(password);
  }

  return prisma.admin.update({
    where: { admin_id },
    data: updateData,
  });
};

export const deleteAdmin = (id: number) =>
  prisma.admin.delete({ where: { admin_id: id } });

export const loginAdmin = async ({ email, password }: AdminLoginInput) => {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await comparePassword(password, admin.password))) return null;
  const token = generateToken({ id: admin.admin_id, role: "admin" });
  return { token, admin: { id: admin.admin_id, email: admin.email } };
};
