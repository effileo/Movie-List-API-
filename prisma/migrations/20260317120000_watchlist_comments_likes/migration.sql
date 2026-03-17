-- CreateTable
CREATE TABLE "watchlistComment" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlistComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlistLike" (
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlistLike_pkey" PRIMARY KEY ("userId","targetUserId")
);

-- AddForeignKey
ALTER TABLE "watchlistComment" ADD CONSTRAINT "watchlistComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlistComment" ADD CONSTRAINT "watchlistComment_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlistLike" ADD CONSTRAINT "watchlistLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlistLike" ADD CONSTRAINT "watchlistLike_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
