-- AlterTable user: profile fields
ALTER TABLE "user" ADD COLUMN "bio" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "watchlistPublic" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable review
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "movieId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "review" ADD CONSTRAINT "review_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "review_userId_movieId_key" ON "review"("userId", "movieId");

-- CreateTable comment
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "movieId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "comment" ADD CONSTRAINT "comment_pkey" PRIMARY KEY ("id");
