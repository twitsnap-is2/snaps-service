import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { BlankEnv, HTTPResponseError, ValidationTargets } from "hono/types";
import { StatusCode } from "hono/utils/http-status";
import { validator } from "hono/validator";
import { z } from "zod";
import { logger } from "./logger.js";
import { env } from "../env.js";

export type CustomErrorProps = {
  type?: string;
  status: StatusCode;
  title: string;
  detail: string;
};

// The CustomError class is a custom error class that extends HTTPException, it is used to represent errors in the application.
// It can be thrown at any point in the application to return a custom error response.
// Has a toJSON method that returns the error as a JSON object as specified at RFC 7807.
export class CustomError extends HTTPException {
  type: string;
  title: string;
  detail: string;

  // The constructor of the CustomError class, it receives an object with the following properties:
  // - type: The type of the error, defaults to "about:blank".
  // - status: The status code of the error.
  // - title: The title of the error. (should be the same for all errors of the same type)
  // - detail: The detail of the error. (can specific to the error instance)
  constructor({ type = "about:blank", detail, title, status }: CustomErrorProps) {
    super(status);
    this.name = "CustomError";
    this.title = title;
    this.type = type;
    this.detail = detail;
  }

  // The toJSON method returns the error as a JSON object as specified at RFC 7807.
  toJSON(c: Context<BlankEnv, any, {}>) {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: c.req.path,
    };
  }

  // The log method logs the error to the console using the logger.
  log() {
    logger.error(`${this.status} - ${this.title}: ${this.detail}`);
  }
}

// The zodValidator function is middleware that creates a validator function using a Zod schema.
// It returns a function that validates the request body or parameters using the schema.
// If the validation fails, it throws a CustomError with the errors.
export function zodValidator<TTarget extends keyof ValidationTargets, TSchema extends z.ZodTypeAny>(
  target: TTarget,
  schema: TSchema
) {
  return validator(target, (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new CustomError({
        title: "Invalid request " + target,
        status: 400,
        detail: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(",\n"),
      });
    }
    return result.data as z.infer<TSchema>;
  });
}

// The errorHandler function is middleware that handles errors in the application.
// It returns a JSON response with the error as a JSON object as specified at RFC 7807.
// If the error is an instance of CustomError, it returns the error as is.
// If not, it returns a generic internal error.
export function errorHandler(error: Error | HTTPResponseError, c: Context<BlankEnv, any, {}>) {
  let customError: CustomError;
  if (error instanceof CustomError) {
    customError = error;
  } else {
    customError = new CustomError({
      title: "Unexpected Internal Error",
      status: 500,
      detail: "Generic internal error ocurred.",
    });
  }

  if (env.ENV !== "test") customError.log();
  return c.json(customError.toJSON(c), customError.status);
}
