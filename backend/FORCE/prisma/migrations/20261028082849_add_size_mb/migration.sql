/*
  Warnings:

  - You are about to drop the column `sizeBytes` on the `backups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "backups" DROP COLUMN "sizeBytes",
ADD COLUMN     "sizeMb" INTEGER;
