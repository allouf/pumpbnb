-- AlterTable
ALTER TABLE "tokens" ADD COLUMN "blockNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "indexer_state" (
    "id" TEXT NOT NULL,
    "lastIndexedBlock" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokens_blockNumber_idx" ON "tokens"("blockNumber");
