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
    expect(body[0].username).toBe("User 2");
    expect(body[0].content).toBe("Snap 2");
    expect(body[1].username).toBe("User 1");
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
        username: "Messi",
        content: "Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona",
        private: false,
        medias: [],
      }),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.username).toBe("Messi");
    expect(body.content).toBe("Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona");
    expect(body.mentions).toEqual(["@NeymarJr"]);
    expect(body.hashtags).toEqual(["#Barcelona"]);
    expect(body.medias).toEqual([]);
    expect(body.privado).toBe(false);
  });

  test("POST /snap no content", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "User 1",
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /snaps",
      detail: `content: Required,
private: Required,
medias: Required`,
      instance: "/snaps",
      status: 400,
    });
  });

  test("POST /snap content empty or too long", async () => {
    const resEmptyContent = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "User 1",
        content: "",
        private: false,
        medias: [],
      }),
    });
    expect(resEmptyContent.status).toBe(400);
    expect(await resEmptyContent.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /snaps",
      detail: "content: You must provide the content for the snap",
      instance: "/snaps",
      status: 400,
    });

    const resTooLongContent = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "User 1",
        content: "a".repeat(281),
        private: false,
        medias: [],
      }),
    });
    expect(resTooLongContent.status).toBe(400);
    expect(await resTooLongContent.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /snaps",
      detail: "content: Content too long, should be less than 280 characters",
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
        username: "User 1",
        content: "Snap 1",
        private: false,
        medias: [],
      }),
    });
    const body = await res.json();

    const resGetSnap = await app.request(`/snaps/${body.id}`);
    expect(resGetSnap.status).toBe(200);
    const bodyGetSnap = await resGetSnap.json();
    expect(bodyGetSnap.username).toBe("User 1");
    expect(bodyGetSnap.content).toBe("Snap 1");
    expect(bodyGetSnap.mentions).toEqual([]);
    expect(bodyGetSnap.hashtags).toEqual([]);
    expect(bodyGetSnap.medias).toEqual([]);
    expect(bodyGetSnap.privado).toBe(false);
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
