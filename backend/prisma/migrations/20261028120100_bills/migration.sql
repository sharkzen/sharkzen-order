/*
  Warnings:

  - You are about to drop the column `discount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `received` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCharge` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "discount",
DROP COLUMN "received",
DROP COLUMN "serviceCharge";

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "shopId" UUID NOT NULL,
    "tableId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "received" DECIMAL(10,2),
    "change" DECIMAL(10,2),
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bill_sessionId_key" ON "Bill"("sessionId");

-- CreateIndex
CREATE INDEX "Bill_shopId_paidAt_idx" ON "Bill"("shopId", "paidAt");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
