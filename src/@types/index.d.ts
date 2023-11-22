import PrismaClient from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      session?: PrismaClient.Session;
      user: PrismaClient.User;
      subscription: PrismaClient.Subscription;
    }
  }
}
