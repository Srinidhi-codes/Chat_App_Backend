/*
  Warnings:

  - A unique constraint covering the columns `[messageId,userId]` on the table `reaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reaction_messageId_userId_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "reaction_messageId_userId_key" ON "reaction"("messageId", "userId");
