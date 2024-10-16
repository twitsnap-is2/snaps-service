/*
  Warnings:

  - Added the required column `userId` to the `Snap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Snap" ADD COLUMN     "userId" TEXT NOT NULL;
