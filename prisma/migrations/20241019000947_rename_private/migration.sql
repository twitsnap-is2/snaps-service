/*
  Warnings:

  - You are about to drop the column `privado` on the `Snap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Snap" DROP COLUMN "privado",
ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT false;
