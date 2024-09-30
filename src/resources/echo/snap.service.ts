import { db } from "../../utils/db.js";

export class SnapService {
  async create(data: { userName: string; content: string }) {
    return db.snap.create({
      data,
    });
  }

  async getSnaps() {
    return db.snap.findMany({ orderBy: { createdAt: "desc" } });
  }

  async get(id: string) {
    return await db.snap.findUnique({
      where: { id: id },
    });
  }
}
