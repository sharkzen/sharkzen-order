-- AlterTable
ALTER TABLE "Order" ADD COLUMN "code" TEXT,
ADD COLUMN "billId" TEXT;

-- รหัสของออเดอร์เดิม: SZ-<วันที่ไทย yyMMdd>-<hex 8 ตัวจาก id>
UPDATE "Order"
SET "code" = 'SZ-' || to_char("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYMMDD') || '-' || upper(substr(md5("id"), 1, 8));

ALTER TABLE "Order" ALTER COLUMN "code" SET NOT NULL;

-- ออเดอร์ที่ชำระแล้วเดิมผูกกับบิลของรอบโต๊ะเดียวกันที่จ่ายเวลาเดียวกัน
UPDATE "Order" o
SET "billId" = b."id"
FROM "Bill" b
WHERE o."shopId" = b."shopId" AND o."sessionId" = b."sessionId" AND o."paidAt" = b."paidAt";

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
CREATE INDEX "Order_billId_idx" ON "Order"("billId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
