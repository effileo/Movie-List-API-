-- AlterTable
ALTER TABLE "movie" ADD COLUMN "tmdbId" INTEGER,
ADD COLUMN "posterPath" TEXT,
ADD COLUMN "backdropPath" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "movie_tmdbId_key" ON "movie"("tmdbId");
