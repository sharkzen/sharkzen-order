-- DropIndex
DROP INDEX "Order_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "stripeSessionId";

