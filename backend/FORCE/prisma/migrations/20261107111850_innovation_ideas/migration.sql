-- CreateEnum
CREATE TYPE "InnovationStatus" AS ENUM ('received', 'reviewing', 'shortlisted', 'rejected');

-- CreateTable
CREATE TABLE "innovation_ideas" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "region" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "beneficiaries" TEXT,
    "link" TEXT,
    "status" "InnovationStatus" NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "innovation_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "innovation_ideas_status_createdAt_idx" ON "innovation_ideas"("status", "createdAt");
