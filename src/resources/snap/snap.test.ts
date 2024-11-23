import { describe, expect, test } from "vitest";
import { app } from "../../index.js";

import { execSync } from "child_process";
import { afterAll, beforeAll } from "vitest";
import { db } from "../../utils/db.js";

beforeAll(async () => {
  execSync("npx prisma migrate reset --force");
  await db.snap.create({
    data: {
      userId: "1",
      username: "User 1",
      content: "Snap 1",
    },
  });
  await db.snap.create({
    data: {
      userId: "2",
      username: "User 2",
      content: "Snap 2",
    },
  });
});

afterAll(async () => {
  await db.mention.deleteMany();
  await db.snap.deleteMany();
});

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
        userId: "1",
        username: "Messi",
        content: "Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona",
        isPrivate: false,
        medias: [],
        mentions: [{ userId: "100", username: "NeymarJr" }],
      }),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.userId).toBe("1");
    expect(body.username).toBe("Messi");
    expect(body.content).toBe("Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona");
    expect(body.hashtags).toEqual(["#barcelona"]);
    expect(body.medias).toEqual([]);
    expect(body.mentions.length).toBe(1);
    expect(body.mentions[0].userId).toBe("100");
    expect(body.mentions[0].username).toBe("NeymarJr");
    expect(body.isPrivate).toBe(false);
  });

  test("POST /snap no content", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "1",
        username: "User 1",
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Invalid request POST /snaps",
      detail: `content: Required,
isPrivate: Required,
medias: Required,
mentions: Required`,
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
        userId: "1",
        username: "User 1",
        content: "",
        isPrivate: false,
        medias: [],
        mentions: [],
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
        userId: "1",
        username: "User 1",
        content: "a".repeat(281),
        isPrivate: false,
        medias: [],
        mentions: [],
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
        userId: "1",
        username: "User 1",
        content: "Snap 1",
        isPrivate: false,
        medias: [],
        mentions: [],
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
    expect(bodyGetSnap.isPrivate).toBe(false);
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

describe("DELETE /snaps/:id", () => {
  test("Delete snap correctly", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "1",
        username: "User 1",
        content: "Snap 1",
        isPrivate: false,
        medias: [],
        mentions: [],
      }),
    });
    const body = await res.json();

    const resDeleteSnap = await app.request(`/snaps/${body.id}`, {
      method: "DELETE",
    });
    expect(resDeleteSnap.status).toBe(200);
    expect(await resDeleteSnap.json()).toEqual({ id: body.id });
  });

  test("Delete snap not found", async () => {
    const res = await app.request(`/snaps/1234`, {
      method: "DELETE",
    });
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

describe("PUT /snaps/:id", () => {
  test("Update snap correctly", async () => {
    const res = await app.request("/snaps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "1",
        username: "User 1",
        content: "Snap 1",
        isPrivate: false,
        medias: [],
        mentions: [],
      }),
    });
    const body = await res.json();

    const resUpdateSnap = await app.request(`/snaps/${body.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Snap 1 updated",
        isPrivate: true,
      }),
    });
    expect(resUpdateSnap.status).toBe(200);

    const resGetSnap = await app.request(`/snaps/${body.id}`);
    const bodyGetSnap = await resGetSnap.json();
    expect(bodyGetSnap.username).toBe("User 1");
    expect(bodyGetSnap.content).toBe("Snap 1 updated");
  });

  test("Update snap not found", async () => {
    const resUpdateSnap = await app.request(`/snaps/1234`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "Snap 1 updated",
        isPrivate: true,
      }),
    });
    expect(resUpdateSnap.status).toBe(400);
    expect(await resUpdateSnap.json()).toEqual({
      type: "about:blank",
      title: "Snap not found",
      detail: "Snap not found",
      instance: "/snaps/1234",
      status: 400,
    });
  });
});
