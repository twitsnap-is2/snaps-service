import { serve } from "@hono/node-server";
import { logger as honoLogger } from "hono/logger";
import { logger } from "./utils/logger.js";
import { env } from "./env.js";
import { trimTrailingSlash } from "hono/trailing-slash";
import { echoRouter } from "./resources/echo/echo.router.js";
import { swaggerUI } from "@hono/swagger-ui";
import { openAPI } from "./utils/open-api.js";

export const app = openAPI.router();

app.use(
  honoLogger((msg, ...rest) => {
    logger.info(msg, ...rest);
  })
);

app.use(trimTrailingSlash());

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Echo Service",
  },
});
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "Bearer",
});

app.get("/swagger", swaggerUI({ url: "/openapi.json" }));

app.route("/echo", echoRouter);

serve({ fetch: app.fetch, port: env.PORT, hostname: env.HOSTNAME }, () => {
  console.log(`Running at: http://${env.HOSTNAME}:${env.PORT}`);
  console.log(`Swagger UI at: http://${env.HOSTNAME}:${env.PORT}/swagger`);
});
