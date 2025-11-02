-- AlterTable: Add new fields to Trade table
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "price" TEXT;
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "marketCap" TEXT;
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "asterAmount" TEXT;
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "tokenAmount" TEXT;

-- CreateTable: TokenHolder
CREATE TABLE IF NOT EXISTS "token_holders" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "firstTxAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTxAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comment
CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "replyTo" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CommentLike
CREATE TABLE IF NOT EXISTS "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserFavorite
CREATE TABLE IF NOT EXISTS "user_favorites" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OHLCVData
CREATE TABLE IF NOT EXISTS "ohlcv_data" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "close" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "trades" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ohlcv_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSession
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "signature" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "token_holders_tokenAddress_holderAddress_key" ON "token_holders"("tokenAddress", "holderAddress");
CREATE INDEX IF NOT EXISTS "token_holders_tokenAddress_idx" ON "token_holders"("tokenAddress");
CREATE INDEX IF NOT EXISTS "token_holders_holderAddress_idx" ON "token_holders"("holderAddress");
CREATE INDEX IF NOT EXISTS "token_holders_percentage_idx" ON "token_holders"("percentage");

-- CreateIndex for Comments
CREATE INDEX IF NOT EXISTS "comments_tokenAddress_idx" ON "comments"("tokenAddress");
CREATE INDEX IF NOT EXISTS "comments_userAddress_idx" ON "comments"("userAddress");
CREATE INDEX IF NOT EXISTS "comments_createdAt_idx" ON "comments"("createdAt");
CREATE INDEX IF NOT EXISTS "comments_replyTo_idx" ON "comments"("replyTo");

-- CreateIndex for CommentLikes
CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_commentId_userAddress_key" ON "comment_likes"("commentId", "userAddress");
CREATE INDEX IF NOT EXISTS "comment_likes_commentId_idx" ON "comment_likes"("commentId");
CREATE INDEX IF NOT EXISTS "comment_likes_userAddress_idx" ON "comment_likes"("userAddress");

-- CreateIndex for UserFavorites
CREATE UNIQUE INDEX IF NOT EXISTS "user_favorites_userAddress_tokenAddress_timeframe_key" ON "user_favorites"("userAddress", "tokenAddress", "timeframe");
CREATE INDEX IF NOT EXISTS "user_favorites_userAddress_idx" ON "user_favorites"("userAddress");
CREATE INDEX IF NOT EXISTS "user_favorites_tokenAddress_idx" ON "user_favorites"("tokenAddress");

-- CreateIndex for OHLCVData
CREATE UNIQUE INDEX IF NOT EXISTS "ohlcv_data_tokenAddress_timeframe_timestamp_key" ON "ohlcv_data"("tokenAddress", "timeframe", "timestamp");
CREATE INDEX IF NOT EXISTS "ohlcv_data_tokenAddress_idx" ON "ohlcv_data"("tokenAddress");
CREATE INDEX IF NOT EXISTS "ohlcv_data_timeframe_idx" ON "ohlcv_data"("timeframe");
CREATE INDEX IF NOT EXISTS "ohlcv_data_timestamp_idx" ON "ohlcv_data"("timestamp");

-- CreateIndex for UserSessions
CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_nonce_key" ON "user_sessions"("nonce");
CREATE INDEX IF NOT EXISTS "user_sessions_userAddress_idx" ON "user_sessions"("userAddress");
CREATE INDEX IF NOT EXISTS "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");
