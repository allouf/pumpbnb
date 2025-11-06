-- AlterTable
ALTER TABLE "tokens" ADD COLUMN "isNsfw" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tokens_isNsfw_idx" ON "tokens"("isNsfw");
