/*
  Warnings:

  - A unique constraint covering the columns `[userId,movieId]` on the table `watchListItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "watchListItem_userId_movieId_key" ON "watchListItem"("userId", "movieId");
