import { EchoService } from "./echo.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";

export const echoRouter = openAPI.router();

const echoService = new EchoService();

const pingOpenAPI = openAPI.get("/ping", {
  responses: {
    200: openAPI.jsonRes({
      description: "Pong!",
      schema: z.object({
        message: z.literal("pong"),
      }),
    }),
  },
});

echoRouter.openapi(pingOpenAPI, async (c) => {
  const response = await echoService.ping();
  return c.json({ message: response }, 200);
});

const echoOpenAPI = openAPI.post("/", {
  request: openAPI.jsonReq({
    schema: z.object({
      message: z.string(),
    }),
  }),
  responses: {
    200: openAPI.jsonRes({
      description: "Respond a message",
      schema: z.object({
        message: z.string(),
      }),
    }),
    400: openAPI.error({ description: "Bad Input Error" }),
  },
});

echoRouter.openapi(echoOpenAPI, async (c) => {
  const body = c.req.valid("json");
  const message = await echoService.echo(body.message);
  return c.json({ message: message }, 200);
});
