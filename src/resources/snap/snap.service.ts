import { db } from "../../utils/db.js";
import { CustomError } from "../../utils/error.js";

export class SnapService {
  async create(data: {
    userId: string;
    username: string;
    content: string;
    isPrivate: boolean;
    medias: { path: string; mimeType: string }[];
  }) {
    const words = data.content.replaceAll(/[,\.!?%\(\)]/g, "").split(" ");
    let hashtags = [];
    let mentions = [];
    for (let i = 0; i < words.length; i++) {
      words[i].trim().charAt(0) === "#" && hashtags.push(words[i].trim().toLowerCase());
      words[i].trim().charAt(0) === "@" && mentions.push(words[i].trim().toLowerCase());
    }

    const snap = await db.snap.create({
      data: {
        userId: data.userId,
        username: data.username,
        content: data.content,
        hashtags: hashtags,
        mentions: mentions,
        isPrivate: data.isPrivate,
        medias: {
          createMany: {
            data: data.medias.map((media) => ({
              path: media.path,
              mimeType: media.mimeType,
            })),
          },
        },
        likes: [],
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
    limit?: number;
  }) {
    const snaps = await db.snap.findMany({
      include: { medias: true },
      take: filters.limit ?? 20,
      where: {
        username: { equals: filters.username, mode: "insensitive" },
        hashtags: filters.hashtag ? { has: filters.hashtag.toLowerCase() } : undefined,
        content: filters.content ? { contains: filters.content, mode: "insensitive" } : undefined,
        createdAt: {
          gt: filters.dateFrom,
          lt: filters.dateTo,
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
        data: { isBlocked: !snap?.isBlocked },
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }

  async delete(id: string) {
    try {
      await db.media.deleteMany({
        where: { snapId: id },
      });
      return await db.snap.delete({
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

  async edit(id: string, content: string, isPrivate: boolean, medias: { path: string; mimeType: string }[]) {
    const words = content.replaceAll(/[,\.!?%\(\)]/g, "").split(" ");
    let hashtags = [];
    let mentions = [];
    for (let i = 0; i < words.length; i++) {
      words[i].trim().charAt(0) === "#" && hashtags.push(words[i].trim().toLowerCase());
      words[i].trim().charAt(0) === "@" && mentions.push(words[i].trim().toLowerCase());
    }

    try {
      return await db.snap.update({
        select: { id: true },
        where: { id: id },
        data: {
          content: content,
          hashtags: hashtags,
          mentions: mentions,
          isPrivate: isPrivate,
          medias: {
            deleteMany: {},
            createMany: {
              data: medias,
            },
          },
        },
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }

  async updateLikeValue(shouldAdd: boolean, id: string, username: string) {
    const snap = await this.get(id);
    if (!snap) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
    const likes = snap.likes;

    try {
      return await db.snap.update({
        select: { id: true },
        where: { id: id },
        data: {
          likes: shouldAdd
            ? { push: username }
            : {
                set: likes.filter((u: string) => u !== username),
              },
        },
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }

  async getLikes(id: string) {
    const snap = await this.get(id);
    if (!snap) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
    return snap.likes;
  }
}
