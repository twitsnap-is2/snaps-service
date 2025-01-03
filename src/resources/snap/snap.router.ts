import { SnapService } from "./snap.service.js";
import { z } from "@hono/zod-openapi";
import { openAPI } from "../../utils/open-api.js";
import { CustomError, errorSchema } from "../../utils/error.js";
import { connectQueue, sendMetric } from "../../external/rabbitmq.js";
import { create } from "domain";
import { env } from "process";

export const snapRouter = openAPI.router();

const snapService = new SnapService();

// Define un esquema base para Snap sin la referencia recursiva
export const baseSnapSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  content: z.string(),
  createdAt: z.string(),
  isPrivate: z.boolean(),
  isBlocked: z.boolean(),
  hashtags: z.array(z.string()),
  likes: z.number(),
  comments: z.number(),
  likedByUser: z.boolean().optional(),
  sharedId: z.string().nullable(),
  parentId: z.string().nullable(),
  shares: z.number(),
  sharedByUser: z.boolean().optional(),
  medias: z.array(
    z.object({
      path: z.string(),
      mimeType: z.string(),
    })
  ),
  mentions: z.array(z.object({ userId: z.string(), username: z.string() })),
});

// Define el esquema completo incluyendo la referencia recursiva a baseSnapSchema
export const snapSchema = baseSnapSchema.extend({
  sharedSnap: baseSnapSchema.nullable(),
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
    mentions: z.array(z.object({ userId: z.string(), username: z.string() })),
  }),
  responses: {
    201: {
      description: "Snap created",
      schema: baseSnapSchema,
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

  const metricData = {
    providedBy: "snaps-service",
    body: {
      content: response.content,
      createdAt: response.createdAt,
      hashtags: response.hashtags,
    },
  };
  if (env.ENV !== "test") {
    sendMetric(metricData, "snaps");
    console.log("Metric data sent to queue");
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
    mentions: z
      .array(z.object({ userId: z.string(), username: z.string() }))
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
    body.medias ?? [],
    body.mentions ?? []
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

const shareSnapOpenAPI = openAPI.route("POST", "/share/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    userId: z.string(),
    username: z.string(),
  }),
  responses: {
    201: {
      description: "Share a snap",
      schema: snapSchema,
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(shareSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await snapService.share(
    params.id,
    body.userId,
    body.username
  );

  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json(response, 201);
});

const deleteShareSnapOpenAPI = openAPI.route("DELETE", "/share/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    userId: z.string(),
    username: z.string(),
  }),
  responses: {
    200: {
      description: "Delete a share",
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

snapRouter.openapi(deleteShareSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await snapService.deleteShared(params.id, body.userId);

  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json({ id: params.id }, 200);
});

const getSanpSharesOpenAPI = openAPI.route("GET", "/shares/user/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  responses: {
    200: {
      description: "Get all shares",
      schema: snapSchema.array(),
    },
  },
});

snapRouter.openapi(getSanpSharesOpenAPI, async (c) => {
  const params = c.req.valid("param");

  const response = await snapService.getShares(params.id);
  return c.json(response, 200);
});

snapRouter.openapi(
  openAPI.route("GET", "/likes/user/{id}", {
    group: "Snap",
    params: z.object({
      id: z.string(),
    }),
    responses: {
      200: {
        description: "Get all likes",
        schema: snapSchema.array(),
      },
    },
  }),
  async (c) => {
    const params = c.req.valid("param");

    const response = await snapService.getLikes(params.id);
    return c.json(response, 200);
  }
);

const answerSnapOpenAPI = openAPI.route("POST", "/answer/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
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
    mentions: z.array(z.object({ userId: z.string(), username: z.string() })),
  }),
  responses: {
    201: {
      description: "Answer created",
      schema: baseSnapSchema,
    },
    400: {
      description: "Invalid request POST /snaps",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(answerSnapOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const body = c.req.valid("json");

  const response = await snapService.create(body, params.id);

  if (!response) {
    throw new CustomError({
      title: "Invalid request POST /snaps",
      status: 400,
      detail: "Invalid request POST /snaps",
    });
  }

  return c.json(response, 201);
});

const getAnswersOpenAPI = openAPI.route("GET", "/answers/{id}", {
  group: "Snap",
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    requestingUserId: z.string().optional(),
  }),
  responses: {
    200: {
      description: "Get all answers from a snap",
      schema: snapSchema.array(),
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
  },
});

snapRouter.openapi(getAnswersOpenAPI, async (c) => {
  const params = c.req.valid("param");
  const query = c.req.valid("query");
  const response = await snapService.getAnswers(
    params.id,
    query.requestingUserId
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
