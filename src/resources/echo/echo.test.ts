import { describe, expect, test } from "vitest";
import { app } from "../..";

describe("GET /echo/ping", () => {
  test("Correctly", async () => {
    const res = await app.request("/echo/ping");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "pong" });
  });
});

describe("POST /echo", () => {
  test("Correctly", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "hello" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "hello" });
  });

  test("No body throws status 400", async () => {
    const res = await app.request("/echo", {
      method: "POST",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /echo",
      detail: "message: Required",
      instance: "/echo",
      status: 400,
    });
  });
});
