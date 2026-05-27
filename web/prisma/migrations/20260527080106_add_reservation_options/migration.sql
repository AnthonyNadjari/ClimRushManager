-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "withKit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "withRemote" BOOLEAN NOT NULL DEFAULT false;
