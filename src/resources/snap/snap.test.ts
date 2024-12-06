import { describe, expect, test } from "vitest";
import { app } from "../../index.js";
import { env } from "../../env.js";
import { title } from "process";
import { defaultMaxListeners } from "events";

describe("GET /snaps/", () => {
  test("Get snaps correctly", async () => {
    const res = await app.request("/snaps");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].username).toBe("User 1");
    expect(body[0].content).toBe("Snap 1");
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
        content:
          "Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona",
        isPrivate: false,
        medias: [],
        mentions: [{ userId: "100", username: "NeymarJr" }],
      }),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.userId).toBe("1");
    expect(body.username).toBe("Messi");
    expect(body.content).toBe(
      "Gran partido del equipo hoy! @NeymarJr hizo un golazo! #Barcelona"
    );
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

describe("PUT /snaps/block/", () => {
  test("Block Snap successfully", async () => {
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

    const resBlockSnap = await app.request(`/snaps/block/${body.id}`, {
      method: "PUT",
    });
    expect(resBlockSnap.status).toBe(200);
    const blockedBody = await resBlockSnap.json();
    expect(blockedBody.id).toBe(body.id);
  });

  test("Block snap not found", async () => {
    const res = await app.request(`snaps/block/1234`, {
      method: "PUT",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Snap not found",
      detail: "Snap not found",
      instance: "/snaps/block/1234",
      status: 400,
    });
  });

  test("Block a snap already blocked", async () => {
    const snap = await app.request("/snaps", {
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
    const body = await snap.json();
    const resBlockSnap = await app.request(`/snaps/block/${body.id}`, {
      method: "PUT",
    });
    expect(resBlockSnap.status).toBe(200);

    const anotherBlock = await app.request(`/snaps/block/${body.id}`, {
      method: "PUT",
    });
    expect(anotherBlock.status).toBe(200);
  });
});

describe("POST /snaps/share/", () => {
  test("Correctly share a snap", async () => {
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
    const resBody = await res.json();

    const shareSnap = await app.request(`/snaps/share/${resBody.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "1",
        username: "User 1",
      }),
    });
    expect(shareSnap.status).toBe(201);
    const sharedSnap = await shareSnap.json();
    expect(sharedSnap.userId).toEqual(resBody.userId);
    expect(sharedSnap.username).toEqual(resBody.username);
  });
});

describe("DELETE /snaps/share/", async () => {
  test("Delete a shared snap successfully");
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

  const resDelete = await app.request(`/snaps/share/${body.id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "1",
      username: "User 1",
    }),
  });
  expect(resDelete.status).toBe(200);
  const deletedSnap = await resDelete.json();
  expect(deletedSnap.id).toEqual(body.id);
});

describe("GET /snaps/shares/user/", async () => {
  test("Get shared snaps correctly");
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

  const resShare = await app.request(`/snaps/shares/user/${body.id}`, {
    method: "GET",
  });
  expect(resShare.status).toBe(200);
  const sharedSnaps = await resShare.json();
  expect(sharedSnaps.length).toBe(0);
});

describe("GET /snaps/likes/user/", async () => {
  test("Get likes correctly");
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

  const resLike = await app.request(`/snaps/likes/user/${body.id}`, {
    method: "GET",
  });
  expect(resLike.status).toBe(200);
  const likes = await resLike.json();
  expect(likes.length).toBe(0);
});

describe("POST /snaps/answer/", async () => {
  test("Answer a snap correctly");
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

  const resAnswer = await app.request(`/snaps/answer/${body.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "1",
      username: "User 1",
      content: "Answer 1",
      isPrivate: false,
      medias: [],
      mentions: [],
    }),
  });

  expect(resAnswer.status).toBe(201);
  const answer = await resAnswer.json();
  expect(answer.userId).toEqual("1");
  expect(answer.username).toEqual("User 1");
  expect(answer.content).toEqual("Answer 1");
});

describe("GET /snaps/answers/", async () => {
  test("Get answers correctly");
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

  const resAnswer = await app.request(`/snaps/answers/${body.id}`, {
    method: "GET",
  });
  expect(resAnswer.status).toBe(200);
  const answers = await resAnswer.json();
  expect(answers.length).toBe(0);
});
