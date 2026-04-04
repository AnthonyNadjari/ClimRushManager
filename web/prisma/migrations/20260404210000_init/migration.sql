-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('DISPO', 'LOUE', 'RESA', 'LIV', 'SAV');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('en_cours', 'a_venir', 'inactif');

-- CreateEnum
CREATE TYPE "FieldMode" AS ENUM ('livraison', 'reprise');

-- CreateEnum
CREATE TYPE "FieldTaskStatus" AS ENUM ('pending', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "MaintPriority" AS ENUM ('urgent', 'nettoyage', 'mineur', 'done');

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL,
    "clientName" TEXT,
    "returnDate" TEXT,
    "purchasePriceHt" DOUBLE PRECISION NOT NULL,
    "cumulativeRevenueHt" DOUBLE PRECISION NOT NULL,
    "contract" TEXT NOT NULL,
    "daysRented" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL,
    "machines" INTEGER NOT NULL,
    "daysRented" INTEGER NOT NULL,
    "caHt" DOUBLE PRECISION NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alert" TEXT,
    "machineNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lotSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldTask" (
    "id" TEXT NOT NULL,
    "mode" "FieldMode" NOT NULL,
    "clientLabel" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "status" "FieldTaskStatus" NOT NULL,
    "timeNote" TEXT,
    "upsell" TEXT,
    "extraNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "priority" "MaintPriority" NOT NULL,
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "client" TEXT NOT NULL,
    "machines" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
