import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";

const createPrimsaClient = () => {
  return new PrismaClient({
    log:
      env.ENV === "development"
        ? ["warn", "error"]
        : env.ENV === "test"
        ? []
        : ["error"],
    datasources: {
      db: {
        url: `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_NAME}?schema=public`,
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
