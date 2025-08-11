import { PrismaClient } from "@prisma/client";
import { ShopCreateInput, ShopUpdateInput } from "./shop.types";

const prisma = new PrismaClient();

export const getAllShop = async () => {
  return prisma.shop.findMany();
};

export const getShopById = async (id: number) => {
  return prisma.shop.findUnique({ where: { shop_id: id } });
};

export const createShop = async (data: ShopCreateInput) => {
  const isPotion =
    data.potion_type &&
    data.potion_price &&
    data.potion_health_boost &&
    data.potion_description;
  const isCharacter = data.character_id !== null && data.character_price;
  if (!isPotion && !isCharacter) {
    throw new Error("Must provide either potion or character fields");
  }
  if (isPotion && isCharacter) {
    throw new Error("Cannot provide both potion and character fields");
  }

  return prisma.shop.create({ data });
};

export const updateShop = async (id: number, data: ShopUpdateInput) => {
  return prisma.shop.update({ where: { shop_id: id }, data });
};

export const deleteShop = async (id: number) => {
  return prisma.shop.delete({ where: { shop_id: id } });
};
