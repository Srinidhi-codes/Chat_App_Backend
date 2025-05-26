/*
  Warnings:

  - You are about to drop the `_UserContacts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserContacts" DROP CONSTRAINT "_UserContacts_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserContacts" DROP CONSTRAINT "_UserContacts_B_fkey";

-- DropTable
DROP TABLE "_UserContacts";
