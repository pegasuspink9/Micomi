import { PrismaClient } from "@prisma/client";
import { CharacterCreateInput, CharacterUpdateInput } from "./character.types";

const prisma = new PrismaClient();

export const getAllCharacters = async () => {
  const characters = await prisma.character.findMany();
  console.log("Fetched characters:", characters);
  return characters;
};

export const getCharacterById = async (id: number) => {
  return prisma.character.findUnique({
    where: { character_id: id },
  });
};

export const createCharacter = async (data: CharacterCreateInput) => {
  return prisma.character.create({ data });
};

export const updateCharacter = async (
  id: number,
  data: CharacterUpdateInput
) => {
  return prisma.character.update({ where: { character_id: id }, data });
};

export const deleteCharacter = async (id: number) => {
  return prisma.character.delete({ where: { character_id: id } });
};
