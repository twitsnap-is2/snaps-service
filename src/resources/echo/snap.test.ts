import { describe, expect, test } from "vitest";
import { app } from "../../index.js";
import { assert } from "console";
import { z } from "zod";
import { snapSchema } from "./snap.router.js";

const getAllSchema = z.object({ data: snapSchema.array() });

const getSnapsSchema = describe("GET /snaps/", () => {
  test("Get Snaps Correctly", async () => {
    const res = await app.request("/snaps");
    expect(res.status).toBe(200);
    const body = await res.json();
    console.log("Aca va el body: ", body);
    expect(body[0].userName).toBe("User 1");
    //expect(body[0].content).toBe("Snap 2");
  });
});

/*
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
*/
