/*
  Warnings:

  - You are about to drop the column `likes` on the `Snap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Snap" DROP COLUMN "likes";

-- CreateTable
CREATE TABLE "Likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapId" TEXT NOT NULL,

    CONSTRAINT "Likes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_snapId_fkey" FOREIGN KEY ("snapId") REFERENCES "Snap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
