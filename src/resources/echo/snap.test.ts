import { describe, expect, test } from "vitest";
import { app } from "../../index.js";
import { assert } from "console";
import { z } from "zod";
import { snapSchema } from "./snap.router.js";

const getAllSchema = z.object({ data: snapSchema.array() });

const getSnapsSchema = describe("GET /snaps/", () => {
  test("Get snaps correctly", async () => {
    const res = await app.request("/snaps");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].userName).toBe("User 2");
    expect(body[0].content).toBe("Snap 2");
    expect(body[1].userName).toBe("User 1");
    expect(body[1].content).toBe("Snap 1");
  });
});

describe("POST /snap", () => {
  test("Post snap correctly", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: "User 1",
        content: "Snap 1",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.userName).toBe("User 1");
    expect(body.content).toBe("Snap 1");
  });

  /*
  test("POST /snap content empty", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: "User 1",
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /snaps",
      detail: "message: Required",
      instance: "/snaps",
      status: 400,
    });
    
  });*/
});
