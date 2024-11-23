import { describe, expect, test } from "vitest";
import { app } from "../../index.js";
import { db } from "../../utils/db.js";

describe("PUT /like/:snapId", () => {
  test("Like snap correctly", async () => {
    const snap = await db.snap.findFirst();
    if (!snap) throw new Error("Snap not found");

    const res = await app.request(`/likes/${snap.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });

    const body = await res.json();
    expect(body.userId).toBe("1");

    const resGetSnap = await app.request(`/snaps/${snap.id}`);
    const bodyGetSnap = await resGetSnap.json();
    expect(bodyGetSnap.likes).toEqual(1);
  });

  test("Like snap already liked", async () => {
    const snap = await db.snap.findFirst();
    if (!snap) throw new Error("Snap not found");

    await app.request(`/likes/${snap.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });

    const res = await app.request(`/likes/${snap.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });

    expect(res.status).toBe(200);
  });

  test("Like snap not found", async () => {
    const res = await app.request("/likes/1000", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /like/:snapId", () => {
  test("Dislike snap correctly", async () => {
    const [, snap] = await db.snap.findMany();

    if (!snap) throw new Error("Snap not found");

    await app.request(`/likes/${snap.id}`, {
      method: "DELETE",
    });

    await app.request(`/likes/${snap.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });

    const resLikedSnap = await app.request(`/snaps/${snap.id}`);
    const bodyLikedSnap = await resLikedSnap.json();
    expect(bodyLikedSnap.likes).toEqual(1);

    await app.request(`/likes/${snap.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });

    const resDislikedSnap = await app.request(`/snaps/${snap.id}`);
    const bodyDislikedSnap = await resDislikedSnap.json();
    expect(bodyDislikedSnap.likes).toEqual(0);
  });

  test("Dislike snap not found", async () => {
    console.log("HOLA");
    const res = await app.request("/likes/1000", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "1" }),
    });
    expect(res.status).toBe(400);
  });
});
