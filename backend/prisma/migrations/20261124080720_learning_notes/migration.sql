-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "handedInAt" TIMESTAMP(3),
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "learning_notes" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentPath" TEXT,
    "attachmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_notes_courseId_createdAt_idx" ON "learning_notes"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "learning_notes_authorId_idx" ON "learning_notes"("authorId");

-- AddForeignKey
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
