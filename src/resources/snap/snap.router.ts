import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { b } from "vitest/dist/chunks/suite.CcK46U-P.js";
import { CustomError, errorSchema } from "../../utils/error.js";
import { custom } from "zod";
import { hash } from "crypto";

export const snapRouter = openAPI.router();

const snapService = new SnapService();

export const snapSchema = z.object({
  id: z.string(),
  username: z.string(),
  content: z.string(),
  createdAt: z.string(),
  privado: z.boolean(),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
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
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(getOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const response = await snapService.get(params.id);
  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json(response, 200);
});

const postSnapOpenAPI = openAPI.route("POST", "/", {
  group: "Snap",
  body: z.object({
    username: z.string(),
    content: z
      .string()
      .max(280, "Content too long, should be less than 280 characters")
      .min(1, "You must provide the content for the snap"),
  }),
  responses: {
    201: {
      description: "Snap created",
      schema: z.object({
        username: z.string(),
        content: z.string(),
      }),
    },
    400: {
      description: "Invalid request POST /snaps",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(postSnapOpenAPI, async (c) => {
  const body = c.req.valid("json");

  const response = await snapService.create(body);
  if (!response) {
    throw new CustomError({
      title: "Invalid request POST /snaps",
      status: 400,
      detail: "Invalid request POST /snaps",
    });
  }

  return c.json(response, 201);
});
