import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";

const createPrimsaClient = () => {
  new PrismaClient({
    log:
      env.ENV === "development"
        ? ["warn", "error"]
        : env.ENV === "test"
        ? []
        : ["error"],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrimsaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrimsaClient();

if (env.ENV !== "production") {
  globalForPrisma.prisma = db;
}
