/*
  Warnings:

  - Changed the type of `createdBy` on the `movie` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `watchListItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "movie" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "watchListItem" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "movie" ADD CONSTRAINT "movie_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchListItem" ADD CONSTRAINT "watchListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchListItem" ADD CONSTRAINT "watchListItem_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
