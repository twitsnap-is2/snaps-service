import { setHours, setMinutes } from "date-fns";
import { db } from "../../utils/db.js";
import { CustomError } from "../../utils/error.js";

export class SnapService {
  async create(data: {
    username: string;
    content: string;
    private: boolean;
    medias: { path: string; mimeType: string }[];
  }) {
    const words = data.content.replaceAll(/[,\.!?%\(\)]/g, "").split(" ");
    let hashtags = [];
    let mentions = [];
    for (let i = 0; i < words.length; i++) {
      words[i].charAt(0) === "#" && hashtags.push(words[i].toLowerCase());
      words[i].charAt(0) === "@" && mentions.push(words[i].toLowerCase());
    }

    const snap = await db.snap.create({
      data: {
        username: data.username,
        content: data.content,
        hashtags: hashtags,
        mentions: mentions,
        privado: data.private,
        medias: {
          createMany: {
            data: data.medias.map((media) => ({
              path: media.path,
              mimeType: media.mimeType,
            })),
          },
        },
      },
      include: {
        medias: true,
      },
    });

    return snap;
  }

  async getSnaps(filters: {
    username?: string;
    hashtag?: string;
    content?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const snaps = await db.snap.findMany({
      include: { medias: true },
      where: {
        username: { equals: filters.username, mode: "insensitive" },
        hashtags: filters.hashtag
          ? { has: filters.hashtag.toLowerCase() }
          : undefined,
        content: filters.content
          ? { contains: filters.content, mode: "insensitive" }
          : undefined,
        createdAt: {
          gte: filters.dateFrom
            ? setMinutes(setHours(filters.dateFrom, 0), 0)
            : undefined,
          lte: filters.dateTo
            ? setMinutes(setHours(filters.dateTo, 23), 59)
            : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return snaps;
  }

  async get(id: string) {
    try {
      return await db.snap.findUnique({
        include: { medias: true },
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
        select: { id: true },
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
