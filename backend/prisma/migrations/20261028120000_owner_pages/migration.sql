-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'COUNTER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_NEW', 'ORDER_PAID', 'ORDER_CANCELLED', 'SHOP_STATUS', 'SYSTEM');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "image" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "number" SERIAL NOT NULL,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COUNTER',
ADD COLUMN     "received" DECIMAL(10,2),
ADD COLUMN     "serviceCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "acceptCash" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCounter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptTransfer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branch" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dailySummary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hours" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newOrderPopup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newOrderSound" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payBeforeKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promptPayId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "serviceChargePercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vatIncluded" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "sessionOpenedAt" TIMESTAMP(3),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zone" TEXT NOT NULL DEFAULT 'ในร้าน';

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "shopId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "shopId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "builtin" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "shopId" UUID NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "shopId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_shopId_sortOrder_idx" ON "Category"("shopId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Category_shopId_name_key" ON "Category"("shopId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_shopId_name_key" ON "Role"("shopId", "name");

-- CreateIndex
CREATE INDEX "StaffMember_roleId_idx" ON "StaffMember"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_shopId_username_key" ON "StaffMember"("shopId", "username");

-- CreateIndex
CREATE INDEX "Notification_shopId_createdAt_idx" ON "Notification"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_shopId_readAt_idx" ON "Notification"("shopId", "readAt");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_sortOrder_idx" ON "MenuItem"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "Order_shopId_sessionId_idx" ON "Order"("shopId", "sessionId");

-- CreateIndex
CREATE INDEX "Table_shopId_sortOrder_idx" ON "Table"("shopId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
