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
}
