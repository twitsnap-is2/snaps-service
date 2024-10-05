import { db } from "../../utils/db.js";
import { CustomError } from "../../utils/error.js";

export class SnapService {
  async create(data: { username: string; content: string; private: boolean }) {
    const words = data.content.replaceAll(/[,\.!?%\(\)]/g, "").split(" ");
    let hashtags = [];
    let mentions = [];
    for (let i = 0; i < words.length; i++) {
      words[i].charAt(0) === "#" && hashtags.push(words[i]);
      words[i].charAt(0) === "@" && mentions.push(words[i]);
    }

    const snap = await db.snap.create({
      data: {
        username: data.username,
        content: data.content,
        hashtags: hashtags,
        mentions: mentions,
        privado: data.private,
      },
    });
    return snap;
  }

  async getSnaps() {
    return db.snap.findMany({ orderBy: { createdAt: "desc" } });
  }

  async get(id: string) {
    try {
      return await db.snap.findUnique({
        where: { id: id },
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }

  async block(id: string) {
    const snap = await this.get(id);

    try {
      return await db.snap.update({
        where: { id: id },
        data: { blocked: !snap?.blocked },
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }
}
