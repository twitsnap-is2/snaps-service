import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { b } from "vitest/dist/chunks/suite.CcK46U-P.js";
import { CustomError, errorSchema } from "../../utils/error.js";
import { custom } from "zod";

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
    400: {
      description: "Could not create snap",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(postSnapOpenAPI, async (c) => {
  const body = c.req.valid("json");
  // TODO: Definir maximo de caracteres en twitsnap
  const contentLength = body.content.length;
  if (contentLength === 0 || contentLength > 140) {
    throw new CustomError({
      title: "Could not create snap",
      status: 400,
      detail:
        contentLength === 0
          ? "You must provide the content for the snap"
          : "Content too long, should be less than 140 characters",
    });
  }

  const response = await snapService.create(body);
  if (!response) {
    throw new CustomError({
      title: "Could not create snap",
      status: 400,
      detail: "Could not create snap",
    });
  }

  return c.json(response, 201);
});
