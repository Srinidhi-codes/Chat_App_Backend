-- AlterTable
ALTER TABLE "user" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" BIGINT;
