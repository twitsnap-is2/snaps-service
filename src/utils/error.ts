import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { BlankEnv, HTTPResponseError, Next } from "hono/types";
import { StatusCode } from "hono/utils/http-status";
import { logger } from "./logger.js";
import { env } from "../env.js";
import { z } from "@hono/zod-openapi";

export type CustomErrorProps = {
  type?: string;
  status: StatusCode;
  title: string;
  detail: string;
  errors?: Record<string, string>;
};

export const errorSchema = z.object({
  type: z
    .string()
    .openapi({ description: "Error type", example: "about:blank" }),
  title: z
    .string()
    .openapi({
      description: "Error title",
      example: "Unexpected Internal Error",
    }),
  status: z.number().openapi({ description: "HTTP status code", example: 500 }),
  detail: z
    .string()
    .openapi({
      description: "Error detail",
      example: "Generic internal error ocurred.",
    }),
  instance: z
    .string()
    .optional()
    .openapi({ description: "Request path", example: "/echo" }),
  errors: z
    .record(z.string())
    .optional()
    .openapi({
      description: "Error details",
      example: { "path.to.error": "Error message" },
    }),
});

// The CustomError class is a custom error class that extends HTTPException, it is used to represent errors in the application.
// It can be thrown at any point in the application to return a custom error response.
// Has a toJSON method that returns the error as a JSON object as specified at RFC 7807.
export class CustomError extends HTTPException {
  type: string;
  title: string;
  detail: string;
  errors?: Record<string, string>;

  // The constructor of the CustomError class, it receives an object with the following properties:
  // - type: The type of the error, defaults to "about:blank".
  // - status: The status code of the error.
  // - title: The title of the error. (should be the same for all errors of the same type)
  // - detail: The detail of the error. (can specific to the error instance)
  constructor({
    type = "about:blank",
    detail,
    title,
    status,
    errors,
  }: CustomErrorProps) {
    super(status);
    this.name = "CustomError";
    this.title = title;
    this.type = type;
    this.detail = detail;
    this.errors = errors;
  }

  // The toJSON method returns the error as a JSON object as specified at RFC 7807.
  toJSON(c: Context<BlankEnv, any, {}>) {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: c.req.path,
      ...(this.errors ? { errors: this.errors } : {}),
    };
  }

  // The log method logs the error to the console using the logger.
  log() {
    logger.error(`${this.status} - ${this.title}: ${this.detail}`);
  }
}

// The errorHandler function is middleware that handles errors in the application.
// It returns a JSON response with the error as a JSON object as specified at RFC 7807.
// If the error is an instance of SnapError, it returns the error as is.
// If not, it returns a generic internal error.
export function errorHandler(
  error: Error | HTTPResponseError,
  c: Context<BlankEnv, any, {}>
) {
  let customError: CustomError;
  if (error instanceof CustomError) {
    customError = error;
    logger.error(error.toJSON(c));
  } else {
    logger.error(error?.message);
    customError = new CustomError({
      title: "Unexpected Internal Error",
      status: 500,
      detail: "Generic internal error ocurred.",
    });
  }

  if (env.ENV !== "test") customError.log();
  return c.json(customError.toJSON(c), customError.status);
}

export async function handleCustomErrorJSON(
  c: Context<BlankEnv, any, {}>,
  next: Next
) {
  try {
    await next();
  } catch (error) {
    const parsed = errorSchema.safeParse(error);
    if (parsed.success) {
      throw new CustomError(parsed.data as CustomErrorProps);
    }
    throw error;
  }
}
