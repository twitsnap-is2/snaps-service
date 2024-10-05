-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "snapId" TEXT NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_snapId_fkey" FOREIGN KEY ("snapId") REFERENCES "Snap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
