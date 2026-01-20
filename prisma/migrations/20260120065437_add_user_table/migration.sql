-- CreateTable
CREATE TABLE "movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "genre" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "runTime" INTEGER,
    "Overview" TEXT,

    CONSTRAINT "movie_pkey" PRIMARY KEY ("id")
);
