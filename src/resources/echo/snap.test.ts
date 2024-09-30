import { describe, expect, test } from "vitest";
import { app } from "../../index.js";
import { assert } from "console";
import { z } from "zod";
import { snapSchema } from "./snap.router.js";

const getAllSchema = z.object({ data: snapSchema.array() });

describe("GET /snaps/", () => {
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

  test("POST /snap no content", async () => {
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
  });

  test("POST /snap content empty or too long", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: "User 1",
        content: "",
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Could not create snap",
      detail: "You must provide the content for the snap",
      instance: "/snaps",
      status: 400,
    });
  });

  test("POST /snap content too long", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: "User 1",
        content: "a".repeat(141),
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Could not create snap",
      detail: "Content too long, should be less than 140 characters",
      instance: "/snaps",
      status: 400,
    });
  });
});

describe("GET /snaps/:id", () => {
  test("Get snap correctly", async () => {
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
    const body = await res.json();

    const resGetSnap = await app.request(`/snaps/${body.id}`);
    expect(resGetSnap.status).toBe(200);
    const bodyGetSnap = await resGetSnap.json();
    expect(bodyGetSnap.userName).toBe("User 1");
    expect(bodyGetSnap.content).toBe("Snap 1");
  });

  test("Get snap not found", async () => {
    const res = await app.request(`/snaps/1234`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Snap not found",
      detail: "Snap not found",
      instance: "/snaps/1234",
      status: 400,
    });
  });
});
