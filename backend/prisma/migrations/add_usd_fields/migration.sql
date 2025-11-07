-- Add USD fields to token_stats table
ALTER TABLE "token_stats" ADD COLUMN "priceUsd" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "token_stats" ADD COLUMN "marketCapUsd" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "token_stats" ADD COLUMN "volume24hUsd" TEXT NOT NULL DEFAULT '0';
ALTER TABLE "token_stats" ADD COLUMN "liquidityUsd" TEXT NOT NULL DEFAULT '0';

-- Add indexes for USD fields for better query performance
CREATE INDEX "token_stats_volume24hUsd_idx" ON "token_stats"("volume24hUsd");
CREATE INDEX "token_stats_marketCapUsd_idx" ON "token_stats"("marketCapUsd");

-- Add comments to document the new fields
COMMENT ON COLUMN "token_stats"."priceUsd" IS 'Token price in USD';
COMMENT ON COLUMN "token_stats"."marketCapUsd" IS 'Market cap in USD';
COMMENT ON COLUMN "token_stats"."volume24hUsd" IS '24h volume in USD';
COMMENT ON COLUMN "token_stats"."liquidityUsd" IS 'Liquidity in USD';