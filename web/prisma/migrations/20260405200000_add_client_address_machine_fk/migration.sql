-- Add address to Client
ALTER TABLE "Client" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';

-- Add clientId FK to Machine
ALTER TABLE "Machine" ADD COLUMN "clientId" TEXT;

-- Populate clientId from existing clientName where possible
UPDATE "Machine" m
SET "clientId" = c.id
FROM "Client" c
WHERE m."clientName" = c.name
  AND m."clientName" IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old fields from Client (replaced by Machine relation)
ALTER TABLE "Client" DROP COLUMN IF EXISTS "machines";
ALTER TABLE "Client" DROP COLUMN IF EXISTS "machineNumbers";
