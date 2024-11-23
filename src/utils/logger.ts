import { env } from "../env.js";

export function info(msg: any, ...rest: any[]) {
  if (env.ENV === "test") return;
  console.log(`\x1b[34m[${new Date().toISOString().split(".")[0]}] \x1b[32mINFO\x1b[0m`, msg, ...rest);
}

export function error(msg: any, ...rest: any[]) {
  if (env.ENV === "test") return;
  console.error(`\x1b[34m[${new Date().toISOString().split(".")[0]}] \x1b[31mERROR\x1b[0m`, msg, ...rest);
}

export const logger = {
  info,
  error,
};
