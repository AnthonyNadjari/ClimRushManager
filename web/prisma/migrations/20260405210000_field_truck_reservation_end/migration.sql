-- AlterTable
ALTER TABLE "FieldTask" ADD COLUMN "truckLabel" TEXT NOT NULL DEFAULT 'Tous';

-- AlterTable
ALTER TABLE "FieldTask" ADD COLUMN "machineIdsJson" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "endDate" TIMESTAMP(3);
