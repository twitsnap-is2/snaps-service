import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  return {
    test: {
      env: loadEnv(mode, process.cwd(), ""),
      pool: "forks",
      coverage: {
        reporter: ["text", "html", "json-summary", "json"],
        reportOnFailure: true,
      },
      // fileParallelism: false,
      setupFiles: ["./src/tests/setup.ts"],
    },
  };
});
