import { afterAll, beforeAll } from "vitest";
import { execSync } from "child_process";
import { db } from "../utils/db.js";

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

afterAll(async () => {
  await db.mention.deleteMany();
  await db.likes.deleteMany();
  await db.media.deleteMany();
  await db.snap.deleteMany();
});
