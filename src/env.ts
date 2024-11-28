import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

// Validate and load environment variables, provide defaults,
// coerce values to the correct type and throw if missing required variables
export const env = createEnv({
  server: {
    ENV: z.enum(["development", "production", "test"]),
    HOSTNAME: z.coerce.string().default("localhost"),
    PORT: z.coerce.number().default(3000),
    API_KEY: z.string(),
    API_SERVICE_MANAGER: z.string().url(),
    RABBIT_URL: z.string().url(),
    POSTGRES_HOST: z.string(),
    POSTGRES_NAME: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_PORT: z.string(),
    DATABASE_URL: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
