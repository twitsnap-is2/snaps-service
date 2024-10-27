import { use } from "hono/jsx";
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
      words[i].trim().charAt(0) === "#" &&
        hashtags.push(words[i].trim().toLowerCase());
      words[i].trim().charAt(0) === "@" &&
        mentions.push(words[i].trim().toLowerCase());
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
      },
      include: {
        medias: true,
      },
    });

    return { ...snap, likes: 0 };
  }

  async getSnaps(
    filters: {
      username?: string;
      hashtag?: string;
      content?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    },
    requestingUserId?: string
  ) {
    const snaps = await db.snap.findMany({
      include: {
        medias: true,
        _count: { select: { likes: true } },
        likes: {
          select: { userId: true },
          where: { userId: requestingUserId ?? "__no_user__" },
        },
      },
      take: filters.limit ?? 20,
      where: {
        username: { equals: filters.username, mode: "insensitive" },
        hashtags: filters.hashtag
          ? { has: filters.hashtag.toLowerCase() }
          : undefined,
        content: filters.content
          ? { contains: filters.content, mode: "insensitive" }
          : undefined,
        createdAt: {
          gt: filters.dateFrom,
          lt: filters.dateTo,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return snaps.map(({ _count, likes, ...snap }) => ({
      ...snap,
      likes: _count.likes,
      likedByUser: likes.length > 0,
    }));
  }

  async get(id: string, requestingUserId?: string) {
    try {
      const snap = await db.snap.findUnique({
        include: {
          medias: true,
          _count: { select: { likes: true } },
          likes: {
            select: { userId: true },
            where: { userId: requestingUserId ?? "__no_user__" },
          },
        },
        where: { id: id },
      });
      if (!snap) {
        return null;
      }
      const { _count, likes, ...snapData } = snap;
      return {
        ...snapData,
        likes: _count.likes,
        likedByUser: likes.length > 0,
      };
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

  async edit(
    id: string,
    content: string,
    isPrivate: boolean,
    medias: { path: string; mimeType: string }[]
  ) {
    const words = content.replaceAll(/[,\.!?%\(\)]/g, "").split(" ");
    let hashtags = [];
    let mentions = [];
    for (let i = 0; i < words.length; i++) {
      words[i].trim().charAt(0) === "#" &&
        hashtags.push(words[i].trim().toLowerCase());
      words[i].trim().charAt(0) === "@" &&
        mentions.push(words[i].trim().toLowerCase());
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
}
