import { PrismaClient } from "@prisma/client";
import { ChallengeCreateInput, ChallengeUpdateInput } from "./challenge.types";

const prisma = new PrismaClient();

export const getAllChallenges = async () => {
  return prisma.challenge.findMany({
    include: {
      level: true,
    },
  });
};

export const getChallengeById = async (id: number) => {
  return prisma.challenge.findUnique({
    where: { challenge_id: id },
    include: { level: true },
  });
};

export const createChallenge = async (data: ChallengeCreateInput) => {
  return prisma.challenge.create({ data });
};

export const updateChallenge = async (
  id: number,
  data: ChallengeUpdateInput
) => {
  return prisma.challenge.update({ where: { challenge_id: id }, data });
};

export const deleteChallenge = async (id: number) => {
  return prisma.challenge.delete({ where: { challenge_id: id } });
};
