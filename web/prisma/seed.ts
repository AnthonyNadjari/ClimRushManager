import {
  PrismaClient,
  MachineStatus,
  ClientStatus,
  FieldMode,
  FieldTaskStatus,
  MaintPriority,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.fieldTask.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.client.deleteMany();

  await prisma.machine.createMany({
    data: [
      {
        id: "12",
        model: "12 000 BTU Monobloc",
        lot: "Tournée Paris centre",
        status: MachineStatus.LOUE,
        clientId: "c1",
        clientName: "Résidence du Marais",
        returnDate: "31/08/2026",
        purchasePriceHt: 175,
        cumulativeRevenueHt: 599,
        contract: "saison",
        daysRented: 62,
      },
      {
        id: "47",
        model: "12 000 BTU Monobloc",
        lot: "Atelier SAV",
        status: MachineStatus.SAV,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 175,
        cumulativeRevenueHt: 199,
        contract: "hebdo",
        daysRented: 12,
      },
      {
        id: "83",
        model: "9 000 BTU Split",
        lot: "Atelier SAV",
        status: MachineStatus.SAV,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 150,
        cumulativeRevenueHt: 399,
        contract: "mensuel",
        daysRented: 45,
      },
      {
        id: "124",
        model: "12 000 BTU Monobloc",
        lot: "Atelier SAV",
        status: MachineStatus.SAV,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 200,
        cumulativeRevenueHt: 266,
        contract: "mensuel",
        daysRented: 20,
      },
      {
        id: "198",
        model: "12 000 BTU Monobloc",
        lot: "Stock neuf — IDF",
        status: MachineStatus.DISPO,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 180,
        cumulativeRevenueHt: 650,
        contract: "saison",
        daysRented: 95,
      },
      {
        id: "201",
        model: "12 000 BTU Monobloc",
        lot: "Tournée Hauts-de-Seine",
        status: MachineStatus.LIV,
        clientId: "c2",
        clientName: "OVELIA",
        returnDate: "05/04/2026",
        purchasePriceHt: 175,
        cumulativeRevenueHt: 199,
        contract: "hebdo",
        daysRented: 5,
      },
      {
        id: "302",
        model: "9 000 BTU Split",
        lot: "Stock neuf — IDF",
        status: MachineStatus.DISPO,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 140,
        cumulativeRevenueHt: 0,
        contract: "mensuel",
        daysRented: 0,
      },
    ],
  });

  await prisma.client.createMany({
    data: [
      {
        id: "c1",
        name: "Résidence du Marais",
        initials: "RM",
        status: ClientStatus.en_cours,
        daysRented: 62,
        caHt: 2995,
        email: "contact@marais-res.fr",
        phone: "+33612345678",
        address: "12 rue des Archives, 75004 Paris",
        alert: "SMS J-7 rachat",
        lotSummary: "Lot résidence — IDF 2026",
      },
      {
        id: "c2",
        name: "OVELIA",
        initials: "OV",
        status: ClientStatus.en_cours,
        daysRented: 120,
        caHt: 8200,
        email: "ops@ovelia.fr",
        phone: "+33698765432",
        address: "8 av. Georges Pompidou, 92300 Levallois",
        lotSummary: "3 unités listées (parc plus large en démo)",
      },
      {
        id: "c3",
        name: "DOMITYS Bercy",
        initials: "DB",
        status: ClientStatus.a_venir,
        daysRented: 0,
        caHt: 0,
        email: "bercy@domitys.fr",
        phone: "+33655443322",
        address: "45 bd Poniatowski, 75012 Paris",
        lotSummary: "Contrat à venir — pas encore d’unités assignées",
      },
    ],
  });

  await prisma.fieldTask.createMany({
    data: [
      {
        id: "l1",
        mode: FieldMode.livraison,
        clientLabel: "Résidence du Marais",
        address: "12 rue des Archives, 75004 Paris",
        phone: "+33612345678",
        qty: 2,
        status: FieldTaskStatus.done,
        timeNote: "Livré 09:42",
        sortOrder: 0,
      },
      {
        id: "l2",
        mode: FieldMode.livraison,
        clientLabel: "OVELIA — Levallois",
        address: "8 av. Georges Pompidou, 92300",
        phone: "+33698765432",
        qty: 1,
        status: FieldTaskStatus.in_progress,
        sortOrder: 1,
      },
      {
        id: "l3",
        mode: FieldMode.livraison,
        clientLabel: "DOMITYS — Bercy",
        address: "45 bd Poniatowski, 75012",
        phone: "+33655443322",
        qty: 3,
        status: FieldTaskStatus.in_progress,
        upsell: "Upsell +",
        sortOrder: 2,
      },
      {
        id: "l4",
        mode: FieldMode.livraison,
        clientLabel: "SCI Les Tilleuls",
        address: "3 impasse des Lilas, 92100",
        phone: "+33611223344",
        qty: 5,
        status: FieldTaskStatus.pending,
        sortOrder: 3,
      },
      {
        id: "r1",
        mode: FieldMode.reprise,
        clientLabel: "Résidence du Marais",
        address: "12 rue des Archives, 75004 Paris",
        phone: "+33612345678",
        qty: 2,
        status: FieldTaskStatus.done,
        timeNote: "Récupéré 10:15 — Photo OK",
        extraNote: "Email promo envoyé",
        sortOrder: 0,
      },
      {
        id: "r2",
        mode: FieldMode.reprise,
        clientLabel: "Campus Étudiants Nord",
        address: "220 av. Jean Jaurès, 75019",
        phone: "+33677889900",
        qty: 4,
        status: FieldTaskStatus.in_progress,
        sortOrder: 1,
      },
      {
        id: "r3",
        mode: FieldMode.reprise,
        clientLabel: "Rés. Les Jardins",
        address: "9 rue de la République, 93200",
        phone: "+33644556677",
        qty: 1,
        status: FieldTaskStatus.in_progress,
        sortOrder: 2,
      },
      {
        id: "r4",
        mode: FieldMode.reprise,
        clientLabel: "Bureau WeWork",
        address: "198 rue de Rivoli, 75001",
        phone: "+33633445566",
        qty: 2,
        status: FieldTaskStatus.pending,
        sortOrder: 3,
      },
    ],
  });

  await prisma.maintenanceTicket.createMany({
    data: [
      {
        id: "m1",
        machineId: "47",
        title: "Fuite / ne marche pas",
        detail: "Reprise OVELIA — 04/04 — signalé livreur",
        priority: MaintPriority.urgent,
        action: "Réparer",
      },
      {
        id: "m2",
        machineId: "83",
        title: "À laver",
        detail: "Reprise Res. Marais — 03/04 — RAS sinon",
        priority: MaintPriority.nettoyage,
        action: "À nettoyer",
      },
      {
        id: "m3",
        machineId: "124",
        title: "Plus de pile télécommande",
        detail: "Reprise DOMITYS — 02/04 — Télécommande OK sinon",
        priority: MaintPriority.mineur,
      },
      {
        id: "m4",
        machineId: "198",
        title: "À laver",
        detail: "Traité le 04/04 — Remis en stock disponible",
        priority: MaintPriority.done,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        id: "a1",
        kind: "ok",
        title: "Machine livrée",
        subtitle: "Rés. du Marais — 2 unités — validation livreur",
        time: "Il y a 12 min",
        sortOrder: 0,
      },
      {
        id: "a2",
        kind: "sms",
        title: "SMS rachat envoyé",
        subtitle: "Machine #8 — valeur rés. 45 € — J-7 fin contrat",
        time: "Il y a 48 min",
        sortOrder: 1,
      },
      {
        id: "a3",
        kind: "pay",
        title: "Paiement reçu",
        subtitle: "Contrat saison — 599 € HT — Stripe",
        time: "Il y a 1 h",
        sortOrder: 2,
      },
    ],
  });
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
