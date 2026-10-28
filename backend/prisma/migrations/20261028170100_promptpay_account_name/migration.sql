-- AlterTable
ALTER TABLE "Shop"
ADD COLUMN     "promptPayTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promptPayFirstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promptPayLastName" TEXT NOT NULL DEFAULT '';
