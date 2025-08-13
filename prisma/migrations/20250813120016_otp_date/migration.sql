/*
  Warnings:

  - Changed the type of `coolDown` on the `Otp` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Otp" DROP COLUMN "coolDown",
ADD COLUMN     "coolDown" TIMESTAMP(3) NOT NULL;
