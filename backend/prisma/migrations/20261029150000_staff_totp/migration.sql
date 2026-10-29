-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "code" TEXT NOT NULL DEFAULT upper(substr(md5((random())::text || (clock_timestamp())::text), 1, 8));

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpEnabledAt" TIMESTAMP(3),
ADD COLUMN     "totpSecret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_code_key" ON "Shop"("code");

