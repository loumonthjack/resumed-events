import { PrismaClient } from "@prisma/client";
import { createId as cuid } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

export { prisma };

async function createSession(userId: string) {
  const sessionCode = Math.floor(100000 + Math.random() * 900000);
  // create a session
  // TODO prisma.session.create need verification???
  await prisma.session.create({
    data: {
      id: `ssn_${cuid()}`,
      User: {
        connect: {
          id: userId,
        },
      },
      code: sessionCode,
      createdAt: new Date(),
    },
  });
  return sessionCode;
}

export default {
  createSession,
};
