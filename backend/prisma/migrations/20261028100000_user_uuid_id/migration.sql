-- เปลี่ยนรหัสผู้ใช้จาก cuid เป็น uuid โดยแปลงแถวเดิมและคงความสัมพันธ์กับ AuthCode
-- (token/session เดิมที่ sub เป็น cuid จะใช้ไม่ได้ ผู้ใช้ต้องเข้าสู่ระบบใหม่)

ALTER TABLE "AuthCode" DROP CONSTRAINT "AuthCode_userId_fkey";

ALTER TABLE "User" ADD COLUMN "newId" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "AuthCode" ADD COLUMN "newUserId" UUID;
UPDATE "AuthCode" a SET "newUserId" = u."newId" FROM "User" u WHERE a."userId" = u."id";

ALTER TABLE "AuthCode" DROP COLUMN "userId";
ALTER TABLE "AuthCode" RENAME COLUMN "newUserId" TO "userId";
ALTER TABLE "AuthCode" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" RENAME COLUMN "newId" TO "id";
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

CREATE INDEX "AuthCode_userId_type_idx" ON "AuthCode"("userId", "type");
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
