import { EchoService } from "./echo.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { echo } from "../../external/auth.external.js";

export const echoRouter = openAPI.router();

const echoService = new EchoService();

const pingOpenAPI = openAPI.route("GET", "/ping", {
  group: "Echo",
  responses: {
    200: {
      description: "Pong Response",
      schema: z.object({
        message: z.literal("pong"),
      }),
    },
  },
});

echoRouter.openapi(pingOpenAPI, async (c) => {
  const response = await echoService.ping();

  return c.json({ message: response }, 200);
});

const echoOpenAPI = openAPI.route("POST", "/", {
  group: "Echo",
  body: z.object({
    message: z.string(),
  }),
  responses: {
    200: {
      description: "Respond a message",
      schema: z.object({
        message: z.string(),
      }),
    },
  },
});

echoRouter.openapi(echoOpenAPI, async (c) => {
  const body = c.req.valid("json");

  const message = await echoService.echo(body.message);
  return c.json({ message });
});
