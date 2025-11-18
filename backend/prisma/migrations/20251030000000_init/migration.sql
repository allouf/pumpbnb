-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "bondingCurve" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "graduatedAt" TIMESTAMP(3),
    "isGraduated" BOOLEAN NOT NULL DEFAULT false,
    "isNsfw" BOOLEAN NOT NULL DEFAULT false,
    "ipfsHash" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "discord" TEXT,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_address_key" ON "tokens"("address");
CREATE INDEX "tokens_creator_idx" ON "tokens"("creator");
CREATE INDEX "tokens_createdAt_idx" ON "tokens"("createdAt");
CREATE INDEX "tokens_isGraduated_idx" ON "tokens"("isGraduated");
CREATE INDEX "tokens_isNsfw_idx" ON "tokens"("isNsfw");
CREATE INDEX "tokens_blockNumber_idx" ON "tokens"("blockNumber");

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "trader" TEXT NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "amountIn" TEXT NOT NULL,
    "amountOut" TEXT NOT NULL,
    "fee" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "price" TEXT,
    "marketCap" TEXT,
    "asterAmount" TEXT,
    "tokenAmount" TEXT,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trades_txHash_key" ON "trades"("txHash");
CREATE INDEX "trades_tokenAddress_idx" ON "trades"("tokenAddress");
CREATE INDEX "trades_trader_idx" ON "trades"("trader");
CREATE INDEX "trades_timestamp_idx" ON "trades"("timestamp");
CREATE INDEX "trades_blockNumber_idx" ON "trades"("blockNumber");

-- Add ForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "token_stats" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceUsd" TEXT NOT NULL DEFAULT '0',
    "marketCap" TEXT NOT NULL,
    "marketCapUsd" TEXT NOT NULL DEFAULT '0',
    "volume24h" TEXT NOT NULL,
    "volume24hUsd" TEXT NOT NULL DEFAULT '0',
    "trades24h" INTEGER NOT NULL DEFAULT 0,
    "holders" INTEGER NOT NULL DEFAULT 0,
    "liquidity" TEXT NOT NULL,
    "liquidityUsd" TEXT NOT NULL DEFAULT '0',
    "priceChange24h" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_stats_tokenAddress_key" ON "token_stats"("tokenAddress");
CREATE INDEX "token_stats_volume24h_idx" ON "token_stats"("volume24h");
CREATE INDEX "token_stats_volume24hUsd_idx" ON "token_stats"("volume24hUsd");
CREATE INDEX "token_stats_marketCap_idx" ON "token_stats"("marketCap");
CREATE INDEX "token_stats_marketCapUsd_idx" ON "token_stats"("marketCapUsd");
CREATE INDEX "token_stats_updatedAt_idx" ON "token_stats"("updatedAt");

-- Add ForeignKey
ALTER TABLE "token_stats" ADD CONSTRAINT "token_stats_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "user_portfolios" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "averageBuyPrice" TEXT NOT NULL DEFAULT '0',
    "totalInvested" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_portfolios_userAddress_idx" ON "user_portfolios"("userAddress");
CREATE INDEX "user_portfolios_tokenAddress_idx" ON "user_portfolios"("tokenAddress");
CREATE UNIQUE INDEX "user_portfolios_userAddress_tokenAddress_key" ON "user_portfolios"("userAddress", "tokenAddress");

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watchlists_userAddress_idx" ON "watchlists"("userAddress");
CREATE UNIQUE INDEX "watchlists_userAddress_tokenAddress_key" ON "watchlists"("userAddress", "tokenAddress");

-- CreateTable
CREATE TABLE "graduation_events" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "asterCollected" TEXT NOT NULL,
    "wbnbReceived" TEXT NOT NULL,
    "lpTokensBurned" TEXT NOT NULL,
    "pancakeSwapPair" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "graduation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "graduation_events_tokenAddress_key" ON "graduation_events"("tokenAddress");
CREATE UNIQUE INDEX "graduation_events_txHash_key" ON "graduation_events"("txHash");
CREATE INDEX "graduation_events_timestamp_idx" ON "graduation_events"("timestamp");
CREATE INDEX "graduation_events_blockNumber_idx" ON "graduation_events"("blockNumber");

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTokensCreated" INTEGER NOT NULL DEFAULT 0,
    "totalTokensGraduated" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" TEXT NOT NULL DEFAULT '0',
    "totalFees" TEXT NOT NULL DEFAULT '0',
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_stats_date_key" ON "platform_stats"("date");
CREATE INDEX "platform_stats_date_idx" ON "platform_stats"("date");

-- CreateTable
CREATE TABLE "indexer_state" (
    "id" TEXT NOT NULL,
    "lastIndexedBlock" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_holders" (
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

-- CreateIndex
CREATE INDEX "token_holders_tokenAddress_idx" ON "token_holders"("tokenAddress");
CREATE INDEX "token_holders_holderAddress_idx" ON "token_holders"("holderAddress");
CREATE INDEX "token_holders_percentage_idx" ON "token_holders"("percentage");
CREATE UNIQUE INDEX "token_holders_tokenAddress_holderAddress_key" ON "token_holders"("tokenAddress", "holderAddress");

-- CreateTable
CREATE TABLE "comments" (
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

-- CreateIndex
CREATE INDEX "comments_tokenAddress_idx" ON "comments"("tokenAddress");
CREATE INDEX "comments_userAddress_idx" ON "comments"("userAddress");
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");
CREATE INDEX "comments_replyTo_idx" ON "comments"("replyTo");

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");
CREATE INDEX "comment_likes_userAddress_idx" ON "comment_likes"("userAddress");
CREATE UNIQUE INDEX "comment_likes_commentId_userAddress_key" ON "comment_likes"("commentId", "userAddress");

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_favorites_userAddress_idx" ON "user_favorites"("userAddress");
CREATE INDEX "user_favorites_tokenAddress_idx" ON "user_favorites"("tokenAddress");
CREATE UNIQUE INDEX "user_favorites_userAddress_tokenAddress_timeframe_key" ON "user_favorites"("userAddress", "tokenAddress", "timeframe");

-- CreateTable
CREATE TABLE "ohlcv_data" (
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

-- CreateIndex
CREATE INDEX "ohlcv_data_tokenAddress_idx" ON "ohlcv_data"("tokenAddress");
CREATE INDEX "ohlcv_data_timeframe_idx" ON "ohlcv_data"("timeframe");
CREATE INDEX "ohlcv_data_timestamp_idx" ON "ohlcv_data"("timestamp");
CREATE UNIQUE INDEX "ohlcv_data_tokenAddress_timeframe_timestamp_key" ON "ohlcv_data"("tokenAddress", "timeframe", "timestamp");

-- CreateTable
CREATE TABLE "users" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "followerAddress" TEXT NOT NULL,
    "followingAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_follows_followerAddress_idx" ON "user_follows"("followerAddress");
CREATE INDEX "user_follows_followingAddress_idx" ON "user_follows"("followingAddress");
CREATE UNIQUE INDEX "user_follows_followerAddress_followingAddress_key" ON "user_follows"("followerAddress", "followingAddress");

-- CreateTable
CREATE TABLE "user_sessions" (
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
CREATE UNIQUE INDEX "user_sessions_nonce_key" ON "user_sessions"("nonce");
CREATE INDEX "user_sessions_userAddress_idx" ON "user_sessions"("userAddress");
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");
