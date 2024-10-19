import { Hono } from "hono";
import { describe, expect, test } from "vitest";
import { CustomError, errorHandler, handleCustomErrorJSON } from "./error.js";
import { openAPI } from "./open-api.js";
import { z } from "zod";

describe("Utils - Errors", () => {
  test("Error handler Generic Error", async () => {
    const hono = new Hono();
    hono.onError(errorHandler);
    hono.get("/", (c) => {
      throw new Error("Test error");
    });

    const res = await hono.request("/");
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.title).toBe("Unexpected Internal Error");
    expect(body.detail).toBe("Generic internal error ocurred.");
    expect(body.status).toBe(500);
  });

  test("Error handler Custom Error", async () => {
    const hono = new Hono();
    hono.onError(errorHandler);
    hono.get("/", (c) => {
      throw new CustomError({
        title: "Test error",
        status: 400,
        detail: "Test error",
      });
    });

    const res = await hono.request("/");
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.title).toBe("Test error");
    expect(body.detail).toBe("Test error");
    expect(body.status).toBe(400);
  });

  test("Error handler Parse JSON Custom Error", async () => {
    const hono = new Hono();
    hono.onError(errorHandler);
    hono.use(handleCustomErrorJSON);
    hono.get("/", (c) => {
      throw new CustomError({
        title: "Test error",
        status: 400,
        detail: "Test error",
      }).toJSON(c);
    });

    const res = await hono.request("/");
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.title).toBe("Test error");
    expect(body.detail).toBe("Test error");
    expect(body.status).toBe(400);
  });

  test("Error handler Parse JSON Generic Error", async () => {
    const hono = new Hono();
    hono.onError(errorHandler);
    hono.use(handleCustomErrorJSON);
    hono.get("/", (c) => {
      throw new CustomError({
        title: "Test error",
        status: 400,
        detail: "Test error",
      }).toJSON(c);
    });

    const res = await hono.request("/");
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.title).toBe("Test error");
    expect(body.detail).toBe("Test error");
    expect(body.status).toBe(400);
  });
});

describe("Utils - Open API", () => {
  test("Correctly validated", async () => {
    const hono = openAPI.router();
    hono.onError(errorHandler);

    hono.openapi(
      openAPI.route("POST", "/:param", {
        body: z.object({
          message: z.string(),
        }),
        params: z.object({
          param: z.string(),
        }),
        query: z.object({
          query: z.string(),
        }),
        responses: {
          200: {
            description: "OK",
            schema: z.object({
              message: z.string(),
              param: z.string(),
              query: z.string(),
            }),
          },
        },
      }),
      (c) => {
        const params = c.req.valid("param");
        const query = c.req.valid("query");
        const body = c.req.valid("json");
        return c.json({
          message: body.message,
          param: params.param,
          query: query.query,
        });
      }
    );

    const res = await hono.request("/a?query=b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "c" }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toBe("c");
    expect(body.param).toBe("a");
    expect(body.query).toBe("b");
  });

  test("Correctly validated with invalid body", async () => {
    const hono = openAPI.router();
    hono.onError(errorHandler);

    hono.openapi(
      openAPI.route("POST", "/", {
        body: z.object({
          id: z.number(),
          message: z.string(),
          createdAt: z.string(),
        }),
        responses: {
          200: {
            description: "OK",
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      }),
      (c) => {
        const body = c.req.valid("json");
        return c.json({ message: body.message });
      }
    );

    const res = await hono.request("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: "1", message: "c" }),
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.title).toBe("Invalid request POST /");
    expect(body.detail).toBe(
      "id: Expected number, received string,\ncreatedAt: Required"
    );
    expect(body.status).toBe(400);
  });
});
