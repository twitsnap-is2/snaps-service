import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { echo } from "../../external/auth.external.js";

export const snapRouter = openAPI.router();

const snapService = new SnapService();

const snapSchema = z.object({
  userName: z.string(),
  content: z.string(),
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

const postSnapOpenAPI = openAPI.route("POST", "/", {
  group: "Snap",
  body: z.object({
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

  const response = await snapService.creatSnap();

  return c.json(response, 201);
});
