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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
