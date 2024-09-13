import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { CustomError } from "./error";

function createRouterOpenAPI() {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const error = new CustomError({
          title: "Invalid request " + c.req.method + " " + c.req.path,
          status: 400,
          detail: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(",\n"),
        });

        return c.json(error.toJSON(c), 400);
      }
    },
  });
}

function errorOpenAPI({ description }: { description: string }) {
  return {
    description: description,
    content: {
      "application/json": {
        schema: z.object({
          type: z.string().openapi({ description: "Error type", example: "about:blank" }),
          title: z.string().openapi({ description: "Error title", example: "Unexpected Internal Error" }),
          status: z.number().openapi({ description: "HTTP status code", example: 500 }),
          detail: z.string().openapi({ description: "Error detail", example: "Generic internal error ocurred." }),
          instance: z.string().openapi({ description: "Request path", example: "/echo" }),
        }),
      },
    },
  };
}

function jsonReqOpenAPI({ schema, description }: { schema: z.ZodTypeAny; description?: string }) {
  return {
    body: {
      required: true,
      content: {
        "application/json": {
          description,
          schema,
        },
      },
    },
  };
}

function jsonResOpenAPI({ schema, description }: { schema: z.ZodTypeAny; description: string }) {
  return {
    description: description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

type CreateRoute = Parameters<typeof createRoute>[0];

function get<T extends Omit<CreateRoute, "path" | "method">>(path: string, props: T) {
  return openAPI.route({
    method: "get" as const,
    path: path,
    ...props,
    responses: {
      ...props.responses,
      500: openAPI.error({ description: "Internal Server Error" }),
    },
  });
}

function put<T extends Omit<CreateRoute, "path" | "method">>(path: string, props: T) {
  return openAPI.route({
    method: "put",
    path: path,
    ...props,
    responses: {
      ...props.responses,
      500: openAPI.error({ description: "Internal Server Error" }),
    },
  });
}

function post<T extends Omit<CreateRoute, "path" | "method">>(path: string, props: T) {
  return openAPI.route({
    method: "post",
    path: path,
    ...props,
    responses: {
      ...props.responses,
      500: openAPI.error({ description: "Internal Server Error" }),
    },
  });
}

export const openAPI = {
  router: createRouterOpenAPI,
  route: createRoute,
  get,
  put,
  post,
  error: errorOpenAPI,
  jsonReq: jsonReqOpenAPI,
  jsonRes: jsonResOpenAPI,
};
