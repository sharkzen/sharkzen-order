-- DropIndex
DROP INDEX "Shop_ownerId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeShopId" UUID;

-- CreateIndex
CREATE INDEX "Shop_ownerId_idx" ON "Shop"("ownerId");
