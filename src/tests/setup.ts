import { execSync } from "child_process";
import { afterAll, beforeAll } from "vitest";
import { db } from "../utils/db.js";

beforeAll(async () => {
  execSync("npx prisma migrate reset --force");
  await db.snap.create({
    data: {
      userName: "User 1",
      content: "Snap 1",
    },
  });
  await db.snap.create({
    data: {
      userName: "User 2",
      content: "Snap 2",
    },
  });
});

afterAll(async () => {
  await db.snap.deleteMany();
});
