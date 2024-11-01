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
        sharedId: null,
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

    return { ...snap, likes: 0, shares: 0};
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
        sharedSnap: {
          include: {
            medias: true,
            _count: { select: { likes: true, sharedBy: true} },
            sharedBy: {
              select: { userId: true },
              where: { userId: requestingUserId ?? "__no_user__" },
            },
            likes: {
              select: { userId: true },
              where: { userId: requestingUserId ?? "__no_user__" },
            },
          }
        },
        medias: true,
        _count: { select: { likes: true, sharedBy: true } },
        sharedBy: {
          select: { userId: true },
          where: { userId: requestingUserId ?? "__no_user__" },
        },
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
    return snaps.map((snap) => {
      const { _count, likes, sharedSnap, sharedBy, ...snapData } = snap;
      let formattedSharedSnap = null;
      if (sharedSnap) {
        const { _count: sharedSnapCount, likes: sharedSnapLikes, sharedBy: sharedSnapBy , ...sharedSnapData } = sharedSnap;
        formattedSharedSnap = {
          ...sharedSnapData,
          likedByUser: sharedSnapLikes.length > 0,
          likes: sharedSnapCount.likes,
          shares: sharedSnapCount.sharedBy,
          sharedByUser: sharedSnapBy.length > 0,
        };
      }
      //console.log(formattedSharedSnap)
    
      return {
        ...snapData,
        likedByUser: likes.length > 0,
        likes: _count.likes,
        sharedSnap: formattedSharedSnap,
        shares: _count.sharedBy,
        sharedByUser: sharedBy.length > 0,
      };
    });
  }

  async get(id: string, requestingUserId?: string) {
    try {
      const snap = await db.snap.findUnique({
        include: {
          sharedSnap: {
            include: {
              medias: true,
              _count: { select: { likes: true, sharedBy: true} },
              likes: {
                select: { userId: true },
                where: { userId: requestingUserId ?? "__no_user__" },
              },
            }
          },
          sharedBy: {
            select: { userId: true },
            where: { userId: requestingUserId ?? "__no_user__" },
          },
          medias: true,
          _count: { select: { likes: true, sharedBy: true} },
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
      const { _count, likes, sharedBy, sharedSnap, ...snapData } = snap;

      let formattedSharedSnap = null;
      console.log(sharedSnap)
      if (sharedSnap) {
        const { _count: sharedSnapCount, likes: sharedSnapLikes, ...sharedSnapData } = sharedSnap;
        formattedSharedSnap = {
          ...sharedSnapData,
          likedByUser: sharedSnapLikes.length > 0,
          likes: sharedSnapCount.likes,
          shares: _count.sharedBy,
        };
      }

      const formattedSnap = {
        ...snapData,
        likedByUser: likes.length > 0,
        likes: _count.likes,
        sharedSnap: formattedSharedSnap,
        shares: _count.sharedBy,
        sharedByUser: sharedBy.length > 0,
      };

      return formattedSnap;
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

  async share(id: string, userId: string, username: string) {
    // Crear el nuevo snap sin include
    const sharedSnap = await db.snap.create({
      data: {
        content: "", // vació para un "share"
        userId: userId,
        username: username,
        hashtags: [],
        mentions: [],
        sharedId: id, // referencia al snap original
      },
    });
  
    return await this.get(sharedSnap.id);
  }

  async deleteShared(id: string, userId: string) {
    try {
      return await db.snap.deleteMany({
        where: { 
          userId: userId,
          sharedSnap: { id: id }
        }
      });
    } catch (error) {
      throw new CustomError({
        title: "Snap not found",
        status: 400,
        detail: "Snap not found",
      });
    }
  }

  async getShares(id: string) {
    let snapShare =  await db.snap.findMany({
      include: {
        sharedSnap: {
          include: {
            medias: true,
            _count: { select: { likes: true, sharedBy: true} },
            sharedBy: {
              select: { userId: true },
              where: { userId: id ?? "__no_user__" },
            },
            likes: {
              select: { userId: true },
              where: { userId: id ?? "__no_user__" },
            },
          }
        },
        medias: true,
        sharedBy: {
          select: { userId: true },
          where: { userId: id ?? "__no_user__" },
        },
        _count: { select: { likes: true, sharedBy: true} },
        likes: {
          select: { userId: true },
          where: { userId: id ?? "__no_user__" },
        },
      },
      where: {
        userId: id,
        sharedId: {not : null},
      },
      orderBy: { createdAt: "desc" }
    });

    return snapShare.map((snap) => {
      const { _count, likes, sharedSnap, sharedBy, ...snapData } = snap;
      let formattedSharedSnap = null;
      if (sharedSnap) {
        const { _count: sharedSnapCount, likes: sharedSnapLikes, sharedBy: sharedSnapBy , ...sharedSnapData } = sharedSnap;
        formattedSharedSnap = {
          ...sharedSnapData,
          likedByUser: sharedSnapLikes.length > 0,
          likes: sharedSnapCount.likes,
          shares: sharedSnapCount.sharedBy,
          sharedByUser: sharedSnapBy.length > 0,
        };
      }

      return {
        ...snapData,
        likedByUser: likes.length > 0,
        likes: _count.likes,
        sharedSnap: formattedSharedSnap,
        shares: _count.sharedBy,
        sharedByUser: sharedBy.length > 0,
      };
    });
  }
    
}
