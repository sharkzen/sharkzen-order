-- DropIndex
DROP INDEX "Bill_sessionId_key";

-- CreateIndex
CREATE INDEX "Bill_sessionId_idx" ON "Bill"("sessionId");
