import { db } from "../../utils/db.js";
import { CustomError } from "../../utils/error.js";

export class LikeService {
  async updateLike(snapId: string, userId: string) {
    try {
      const snap = await db.snap.findUnique({
        where: { id: snapId },
        include: { likes: true },
      });
      if (!snap) {
        throw new CustomError({
          title: "Snap not found",
          status: 400,
          detail: "Snap not found",
        });
      }
      const like = snap.likes.find((like) => like.userId === userId);
      if (!like) {
        return await db.likes.create({
          data: {
            snapId: snapId,
            userId: userId,
          },
        });
      }
      return;
    } catch (error) {
      throw new CustomError({
        title: "Error updating likes",
        status: 500,
        detail: "Error updating likes",
      });
    }
  }

  async updateDislike(snapId: string, userId: string) {
    try {
      const snap = await db.snap.findUnique({
        where: { id: snapId },
        include: { likes: true },
      });
      if (!snap) {
        throw new CustomError({
          title: "Snap not found",
          status: 400,
          detail: "Snap not found",
        });
      }
      const like = snap.likes.find((like) => like.userId === userId);
      if (like) {
        return await db.likes.delete({
          where: { id: like.id },
        });
      }
      return;
    } catch (error) {
      throw new CustomError({
        title: "Error updating likes",
        status: 500,
        detail: "Error updating likes",
      });
    }
  }
}
