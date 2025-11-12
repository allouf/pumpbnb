-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "bio" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsernameChange" TIMESTAMP(3),
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "createdTokensCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_follows" (
    "id" TEXT NOT NULL,
    "followerAddress" TEXT NOT NULL,
    "followingAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_follows_followerAddress_idx" ON "user_follows"("followerAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_follows_followingAddress_idx" ON "user_follows"("followingAddress");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_follows_followerAddress_followingAddress_key" ON "user_follows"("followerAddress", "followingAddress");
