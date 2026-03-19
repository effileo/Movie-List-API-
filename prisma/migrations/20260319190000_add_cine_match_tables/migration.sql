-- Cine-Match + notification enum (diff from live DB → schema)
-- Run: npx prisma migrate deploy   (or migrate dev)

-- CreateEnum
CREATE TYPE "CineMatchSessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "CineMatchInviteStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CINE_MATCH_INVITE';

-- CreateTable
CREATE TABLE "cineMatchLike" (
    "userId" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cineMatchInvite" (
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "status" "CineMatchInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- CreateTable
CREATE TABLE "cineMatchSession" (
    "id" TEXT NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "status" "CineMatchSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cineMatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cineMatchSessionSwipe" (
    "sessionId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "cineMatchLike_userId_idx" ON "cineMatchLike"("userId");

-- CreateIndex
CREATE INDEX "cineMatchLike_tmdbId_idx" ON "cineMatchLike"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "cineMatchLike_userId_tmdbId_key" ON "cineMatchLike"("userId", "tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "cineMatchInvite_sessionId_key" ON "cineMatchInvite"("sessionId");

-- CreateIndex
CREATE INDEX "cineMatchInvite_toUserId_idx" ON "cineMatchInvite"("toUserId");

-- CreateIndex
CREATE INDEX "cineMatchInvite_fromUserId_idx" ON "cineMatchInvite"("fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "cineMatchInvite_fromUserId_toUserId_key" ON "cineMatchInvite"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "cineMatchSessionSwipe_sessionId_idx" ON "cineMatchSessionSwipe"("sessionId");

-- CreateIndex
CREATE INDEX "cineMatchSessionSwipe_userId_idx" ON "cineMatchSessionSwipe"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cineMatchSessionSwipe_sessionId_userId_tmdbId_key" ON "cineMatchSessionSwipe"("sessionId", "userId", "tmdbId");

-- AddForeignKey
ALTER TABLE "cineMatchLike" ADD CONSTRAINT "cineMatchLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cineMatchInvite" ADD CONSTRAINT "cineMatchInvite_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cineMatchInvite" ADD CONSTRAINT "cineMatchInvite_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cineMatchInvite" ADD CONSTRAINT "cineMatchInvite_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cineMatchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cineMatchSessionSwipe" ADD CONSTRAINT "cineMatchSessionSwipe_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cineMatchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cineMatchSessionSwipe" ADD CONSTRAINT "cineMatchSessionSwipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
