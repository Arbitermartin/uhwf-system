/*
  Warnings:

  - Made the column `sizeMb` on table `backups` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "backups" ALTER COLUMN "sizeMb" SET NOT NULL;
