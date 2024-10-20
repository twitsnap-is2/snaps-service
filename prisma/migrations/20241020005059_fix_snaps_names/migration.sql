/*
  Warnings:

  - You are about to drop the column `blocked` on the `Snap` table. All the data in the column will be lost.
  - You are about to drop the column `private` on the `Snap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Snap" DROP COLUMN "blocked",
DROP COLUMN "private",
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
