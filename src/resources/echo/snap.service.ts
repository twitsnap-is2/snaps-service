import { db } from "../../utils/db.js";

export class SnapService {
  async createSnap(data: { userName: string; content: string }) {
    return db.snap.create({
      data,
    });
  }

  async getSnaps() {
    return db.snap.findMany({ orderBy: { createdAt: "desc" } });
  }

  async get(id: string) {
    console.log("id", id);
    const snap = await db.snap.findUnique({
      where: { id: id },
    });
    if (!snap) {
      throw new Error("Snap not found");
    }
    return snap;
  }
}
