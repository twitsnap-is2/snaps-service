import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { echo } from "../../external/auth.external.js";
import { b } from "vitest/dist/chunks/suite.CcK46U-P.js";

export const snapRouter = openAPI.router();

const snapService = new SnapService();

export const snapSchema = z.object({
  id: z.string(),
  userName: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

const getSnapsOpenAPI = openAPI.route("GET", "/", {
  group: "Snap",
  responses: {
    200: {
      description: "Get all snaps",
      schema: snapSchema.array(),
    },
  },
});

snapRouter.openapi(getSnapsOpenAPI, async (c) => {
  const response = await snapService.getSnaps();

  return c.json(response, 200);
});

const getOpenAPI = openAPI.route("GET", "/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  responses: {
    200: {
      description: "Get a snap",
      schema: snapSchema,
    },
  },
});

snapRouter.openapi(getOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const response = await snapService.get(params.id);

  return c.json(response, 200);
});

const postSnapOpenAPI = openAPI.route("POST", "/", {
  group: "Snap",
  body: z.object({
    userName: z.string(),
    content: z.string(),
  }),
  responses: {
    201: {
      description: "Snap created",
      schema: z.object({
        userName: z.string(),
        content: z.string(),
      }),
    },
  },
});

snapRouter.openapi(postSnapOpenAPI, async (c) => {
  const body = c.req.valid("json");

  const response = await snapService.createSnap(body);

  return c.json(response, 201);
});
