import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { CustomError, errorSchema } from "../../utils/error.js";
import { id } from "date-fns/locale";

export const snapRouter = openAPI.router();

const snapService = new SnapService();

export const snapSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  content: z.string(),
  createdAt: z.string(),
  isPrivate: z.boolean(),
  isBlocked: z.boolean(),
  hashtags: z.array(z.string()),
  mentions: z.array(z.string()),
  likes: z.number(),
  likedByUser: z.boolean().optional(),
  medias: z.array(
    z.object({
      path: z.string(),
      mimeType: z.string(),
    })
  ),
});

const getSnapsOpenAPI = openAPI.route("GET", "/", {
  group: "Snap",
  query: z.object({
    username: z.string().optional(),
    hashtag: z.string().optional(),
    content: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.coerce.number().optional(),
    requestingUserId: z.string().optional(),
  }),
  responses: {
    200: {
      description: "Get all snaps",
      schema: snapSchema.array(),
    },
  },
});

snapRouter.openapi(getSnapsOpenAPI, async (c) => {
  const query = c.req.valid("query");
  const response = await snapService.getSnaps(query, query.requestingUserId);
  return c.json(response, 200);
});

const getOpenAPI = openAPI.route("GET", "/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    requestingUserId: z.string().optional(),
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
  const query = c.req.valid("query");
  const response = await snapService.get(params.id, query.requestingUserId);
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
    userId: z.string(),
    username: z.string(),
    content: z
      .string()
      .max(280, "Content too long, should be less than 280 characters")
      .min(1, "You must provide the content for the snap"),
    isPrivate: z.boolean(),
    medias: z.array(
      z.object({
        path: z.string(),
        mimeType: z.string(),
      })
    ),
  }),
  responses: {
    201: {
      description: "Snap created",
      schema: snapSchema,
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

const blockSnapOpenAPI = openAPI.route("PUT", "/block/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  responses: {
    200: {
      description: "Block a snap",
      schema: z.object({
        id: z.string(),
      }),
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(blockSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const response = await snapService.block(params.id);
  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json(response, 200);
});

const deleteSnapOpenAPI = openAPI.route("DELETE", "/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  responses: {
    200: {
      description: "Delete a snap",
      schema: z.object({
        id: z.string(),
      }),
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(deleteSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const response = await snapService.delete(params.id);
  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json({ id: response.id }, 200);
});

const editSnapOpenAPI = openAPI.route("PUT", "/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    content: z
      .string()
      .max(280, "Content too long, should be less than 280 characters")
      .min(1, "You must provide the content for the snap"),
    isPrivate: z.boolean(),
    medias: z
      .array(
        z.object({
          path: z.string(),
          mimeType: z.string(),
        })
      )
      .optional(),
  }),
  responses: {
    200: {
      description: "Edit a snap",
      schema: z.object({
        id: z.string(),
      }),
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(editSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");

  const body = c.req.valid("json");

  const response = await snapService.edit(
    params.id,
    body.content,
    body.isPrivate,
    body.medias ?? []
  );

  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json(response, 200);
});
