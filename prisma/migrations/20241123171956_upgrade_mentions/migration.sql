/*
  Warnings:

  - You are about to drop the column `mentions` on the `Snap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Snap" DROP COLUMN "mentions";

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "snapId" TEXT NOT NULL,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_snapId_fkey" FOREIGN KEY ("snapId") REFERENCES "Snap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
