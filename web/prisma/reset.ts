import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Supprime toutes les lignes de toutes les tables applicatives.
// Ordre respectant les clés étrangères (dépendants -> référencés).
async function main() {
  await prisma.reservation.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.fieldTask.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.client.deleteMany();
  console.log("✔ Base vidée (toutes les tables applicatives).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
