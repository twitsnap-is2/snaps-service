import { z } from "zod";
import { openAPI } from "../../utils/open-api.js";
import { CustomError, errorSchema } from "../../utils/error.js";
import { LikeService } from "./like.service.js";

export const likeRouter = openAPI.router();

const likeService = new LikeService();

const likeSnapOpenAPI = openAPI.route("PUT", "/{snapId}", {
  group: "Like",
  params: z.object({
    snapId: z.string(),
  }),
  body: z.object({
    userId: z.string(),
  }),
  responses: {
    200: {
      description: "Like a snap",
      schema: z.object({
        id: z.string(),
      }),
    },
    400: {
      description: "Snap not found",
      schema: errorSchema,
    },
    500: {
      description: "Error updating likes",
      schema: errorSchema,
    },
  },
});

likeRouter.openapi(likeSnapOpenAPI, async (c) => {
  const body = c.req.valid("json");
  const params = c.req.valid("param");

  try {
    const response = await likeService.updateLike(params.snapId, body.userId);
    return c.json(response, 200);
  } catch (error) {
    throw error;
  }
});

const dislikeSnapOpenAPI = openAPI.route("PUT", "/dislike/{snapId}", {
  group: "Like",
  params: z.object({
    snapId: z.string(),
  }),
  body: z.object({
    userId: z.string(),
  }),
  responses: {
    200: {
      description: "Dislike a snap",
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

likeRouter.openapi(dislikeSnapOpenAPI, async (c) => {
  const body = c.req.valid("json");
  const params = c.req.valid("param");

  const response = await likeService.updateDislike(params.snapId, body.userId);
  if (!response) {
    throw new CustomError({
      title: "Snap not found",
      status: 400,
      detail: "Snap not found",
    });
  }

  return c.json(response, 200);
});
