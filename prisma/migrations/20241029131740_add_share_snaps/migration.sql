-- AlterTable
ALTER TABLE "Snap" ADD COLUMN     "sharedId" TEXT;

-- AddForeignKey
ALTER TABLE "Snap" ADD CONSTRAINT "Snap_sharedId_fkey" FOREIGN KEY ("sharedId") REFERENCES "Snap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
