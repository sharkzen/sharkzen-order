-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "cta" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "perks" TEXT[];
