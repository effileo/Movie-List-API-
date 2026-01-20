/*
  Warnings:

  - You are about to drop the column `rating` on the `movie` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WatchListStatus" AS ENUM ('PLANNED', 'WATCHING', 'COMPLETED', 'DROPPED');

-- AlterTable
ALTER TABLE "movie" DROP COLUMN "rating";

-- CreateTable
CREATE TABLE "watchListItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "status" "WatchListStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,

    CONSTRAINT "watchListItem_pkey" PRIMARY KEY ("id")
);
