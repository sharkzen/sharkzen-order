-- เพิ่มร้าน (Shop) และผูก Table / MenuItem / Order เข้ากับร้าน
-- ข้อมูลเดิมที่ยังไม่มีเจ้าของ จะถูกโอนให้ร้านของผู้ใช้ที่สมัครเป็นคนแรก

CREATE TABLE "Shop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Shop_ownerId_key" ON "Shop"("ownerId");
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ผู้ใช้เดิมทุกคนได้ร้านของตัวเอง
INSERT INTO "Shop" ("name", "ownerId", "updatedAt")
SELECT 'ร้านของ ' || "firstName", "id", CURRENT_TIMESTAMP FROM "User";

ALTER TABLE "Table" ADD COLUMN "shopId" UUID;
ALTER TABLE "MenuItem" ADD COLUMN "shopId" UUID;
ALTER TABLE "Order" ADD COLUMN "shopId" UUID;

UPDATE "Table" SET "shopId" = (SELECT s."id" FROM "Shop" s JOIN "User" u ON u."id" = s."ownerId" ORDER BY u."createdAt", u."id" LIMIT 1);
UPDATE "MenuItem" SET "shopId" = (SELECT s."id" FROM "Shop" s JOIN "User" u ON u."id" = s."ownerId" ORDER BY u."createdAt", u."id" LIMIT 1);
UPDATE "Order" o SET "shopId" = t."shopId" FROM "Table" t WHERE o."tableId" = t."id";

-- ถ้ายังมีแถวไม่มีร้าน (ไม่มีผู้ใช้เลย) คำสั่งต่อไปนี้จะล้มเหลวโดยตั้งใจ แทนที่จะลบข้อมูล
ALTER TABLE "Table" ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "MenuItem" ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "shopId" SET NOT NULL;

DROP INDEX "Table_name_key";
CREATE UNIQUE INDEX "Table_shopId_name_key" ON "Table"("shopId", "name");
CREATE INDEX "MenuItem_shopId_idx" ON "MenuItem"("shopId");
CREATE INDEX "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");

ALTER TABLE "Table" ADD CONSTRAINT "Table_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
