-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'member';

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "region" TEXT,
    "interests" TEXT[],
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_userId_key" ON "member_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_memberNumber_key" ON "member_profiles"("memberNumber");

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
