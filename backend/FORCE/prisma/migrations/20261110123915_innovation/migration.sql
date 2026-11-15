-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('submitted', 'under_review', 'needs_info', 'approved', 'not_selected');

-- CreateEnum
CREATE TYPE "IdeaRecommendation" AS ENUM ('support', 'needs_work', 'not_now');

-- CreateTable
CREATE TABLE "ideas" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'submitted',
    "attachmentPath" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_feedback" (
    "id" SERIAL NOT NULL,
    "ideaId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "recommendation" "IdeaRecommendation",
    "impact" INTEGER,
    "feasibility" INTEGER,
    "effort" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ideas_authorId_createdAt_idx" ON "ideas"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ideas_status_createdAt_idx" ON "ideas"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idea_feedback_ideaId_createdAt_idx" ON "idea_feedback"("ideaId", "createdAt");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_feedback" ADD CONSTRAINT "idea_feedback_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_feedback" ADD CONSTRAINT "idea_feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
