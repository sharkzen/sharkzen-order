-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "optionGroups" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "options" JSONB NOT NULL DEFAULT '[]';
