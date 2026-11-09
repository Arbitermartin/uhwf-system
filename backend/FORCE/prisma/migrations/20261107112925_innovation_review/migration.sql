-- AlterTable
ALTER TABLE "innovation_ideas" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" INTEGER;

-- CreateIndex
CREATE INDEX "innovation_ideas_reviewedById_idx" ON "innovation_ideas"("reviewedById");

-- AddForeignKey
ALTER TABLE "innovation_ideas" ADD CONSTRAINT "innovation_ideas_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
