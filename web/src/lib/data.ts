import type {
  ActivityItem,
  CalendarDayMeta,
  ClientRow,
  FieldTask,
  Machine,
  MaintenanceRow,
} from "./types";
import { amortizationLabel, REVENUE_PER_DAY } from "./amortization";

function mkMachine(
  id: string,
  model: string,
  lot: string,
  status: Machine["status"],
  clientName: string | null,
  returnDate: string | null,
  purchaseHt: number,
  contract: keyof typeof REVENUE_PER_DAY,
  daysRented: number,
  cumulativeHt: number,
): Machine {
  const avgDailyHt = REVENUE_PER_DAY[contract];
  const { label, amortized, tone } = amortizationLabel({
    purchaseHt: purchaseHt,
    cumulativeHt,
    avgDailyHt,
    daysRented,
  });
  const tonePrefix =
    tone === "ok" ? "Amorti — " : tone === "warn" ? "" : "";
  return {
    id,
    model,
    lot,
    status,
    clientName,
    returnDate,
    purchasePriceHt: purchaseHt,
    cumulativeRevenueHt: cumulativeHt,
    avgDailyRevenueHt: avgDailyHt,
    daysRented,
    amortized,
    amortLabel: tone === "ok" ? `${tonePrefix}Machine rentabilisée` : label,
  };
}

export const KPI = {
  caJourHt: 1197,
  caJourRentals: 3,
  dispo: 312,
  stockTotal: 500,
  louees: 188,
  livraisonsTotal: 14,
  livraisonsRestantes: 8,
  reprises: 6,
  sav: 3,
  amorties: 247,
  objectifCaHt: 262_500,
  caSaisonHt: 136_075,
  marketplaceVentes: 12,
  marketplaceMontantHt: 18_400,
};

export const DELIVERIES: FieldTask[] = [
  {
    id: "l1",
    clientLabel: "Résidence du Marais",
    address: "12 rue des Archives, 75004 Paris",
    phone: "+33612345678",
    qty: 2,
    status: "done",
    timeNote: "Livré 09:42",
  },
  {
    id: "l2",
    clientLabel: "OVELIA — Levallois",
    address: "8 av. Georges Pompidou, 92300",
    phone: "+33698765432",
    qty: 1,
    status: "in_progress",
  },
  {
    id: "l3",
    clientLabel: "DOMITYS — Bercy",
    address: "45 bd Poniatowski, 75012",
    phone: "+33655443322",
    qty: 3,
    status: "in_progress",
    upsell: "Upsell +",
  },
  {
    id: "l4",
    clientLabel: "SCI Les Tilleuls",
    address: "3 impasse des Lilas, 92100",
    phone: "+33611223344",
    qty: 5,
    status: "pending",
  },
];

export const PICKUPS: FieldTask[] = [
  {
    id: "r1",
    clientLabel: "Résidence du Marais",
    address: "12 rue des Archives, 75004 Paris",
    phone: "+33612345678",
    qty: 2,
    status: "done",
    timeNote: "Récupéré 10:15 — Photo OK",
    extraNote: "Email promo envoyé",
  },
  {
    id: "r2",
    clientLabel: "Campus Étudiants Nord",
    address: "220 av. Jean Jaurès, 75019",
    phone: "+33677889900",
    qty: 4,
    status: "in_progress",
  },
  {
    id: "r3",
    clientLabel: "Rés. Les Jardins",
    address: "9 rue de la République, 93200",
    phone: "+33644556677",
    qty: 1,
    status: "in_progress",
  },
  {
    id: "r4",
    clientLabel: "Bureau WeWork",
    address: "198 rue de Rivoli, 75001",
    phone: "+33633445566",
    qty: 2,
    status: "pending",
  },
];

export const ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    kind: "ok",
    title: "Machine livrée",
    subtitle: "Rés. du Marais — 2 unités — validation livreur",
    time: "Il y a 12 min",
  },
  {
    id: "a2",
    kind: "sms",
    title: "SMS rachat envoyé",
    subtitle: "Machine #8 — valeur rés. 45 € — J-7 fin contrat",
    time: "Il y a 48 min",
  },
  {
    id: "a3",
    kind: "pay",
    title: "Paiement reçu",
    subtitle: "Contrat saison — 599 € HT — Stripe",
    time: "Il y a 1 h",
  },
];

export const MACHINES: Machine[] = [
  mkMachine(
    "12",
    "12 000 BTU Monobloc",
    "Tournée Paris centre",
    "LOUE",
    "Rés. du Marais",
    "31/08/2026",
    175,
    "saison",
    62,
    599,
  ),
  mkMachine(
    "47",
    "12 000 BTU Monobloc",
    "Atelier SAV",
    "SAV",
    null,
    null,
    175,
    "hebdo",
    12,
    199,
  ),
  mkMachine(
    "83",
    "9 000 BTU Split",
    "Atelier SAV",
    "SAV",
    null,
    null,
    150,
    "mensuel",
    45,
    399,
  ),
  mkMachine(
    "124",
    "12 000 BTU Monobloc",
    "Atelier SAV",
    "SAV",
    null,
    null,
    200,
    "mensuel",
    20,
    266,
  ),
  mkMachine(
    "198",
    "12 000 BTU Monobloc",
    "Stock neuf — IDF",
    "DISPO",
    null,
    null,
    180,
    "saison",
    95,
    650,
  ),
  mkMachine(
    "201",
    "12 000 BTU Monobloc",
    "Tournée Hauts-de-Seine",
    "LIV",
    "OVELIA",
    "05/04/2026",
    175,
    "hebdo",
    5,
    199,
  ),
  mkMachine(
    "302",
    "9 000 BTU Split",
    "Stock neuf — IDF",
    "DISPO",
    null,
    null,
    140,
    "mensuel",
    0,
    0,
  ),
];

export const CLIENTS: ClientRow[] = [
  {
    id: "c1",
    name: "Résidence du Marais",
    initials: "RM",
    status: "en_cours",
    machines: 5,
    daysRented: 62,
    caHt: 2995,
    alert: "SMS J-7 rachat",
    email: "contact@marais-res.fr",
    phone: "+33612345678",
  },
  {
    id: "c2",
    name: "OVELIA",
    initials: "OV",
    status: "en_cours",
    machines: 12,
    daysRented: 120,
    caHt: 8200,
    email: "ops@ovelia.fr",
    phone: "+33698765432",
  },
  {
    id: "c3",
    name: "DOMITYS Bercy",
    initials: "DB",
    status: "a_venir",
    machines: 0,
    daysRented: 0,
    caHt: 0,
    email: "bercy@domitys.fr",
    phone: "+33655443322",
  },
];

export const MAINTENANCE: MaintenanceRow[] = [
  {
    id: "m1",
    machineId: "47",
    title: "Fuite / ne marche pas",
    detail: "Reprise OVELIA — 04/04 — signalé livreur",
    priority: "urgent",
    action: "Réparer",
  },
  {
    id: "m2",
    machineId: "83",
    title: "À laver",
    detail: "Reprise Res. Marais — 03/04 — RAS sinon",
    priority: "nettoyage",
    action: "À nettoyer",
  },
  {
    id: "m3",
    machineId: "124",
    title: "Plus de pile télécommande",
    detail: "Reprise DOMITYS — 02/04 — Télécommande OK sinon",
    priority: "mineur",
  },
  {
    id: "m4",
    machineId: "198",
    title: "À laver",
    detail: "Traité le 04/04 — Remis en stock disponible",
    priority: "done",
  },
];

/** Juin 2026 — lundi = 1er juin 2026 */
export function june2026Calendar(): CalendarDayMeta[] {
  const daysInMonth = 30;
  const out: CalendarDayMeta[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const base = 120 + (d % 9) * 3;
    out.push({
      day: d,
      lou: Math.min(310, base + (d % 5) * 8),
      dis: Math.max(120, 500 - base - (d % 4) * 12),
      liv: d % 5 === 0 ? 14 : d % 5 === 2 ? 8 : 4,
      ret: d % 7 === 3 ? 6 : d % 7 === 1 ? 4 : 2,
    });
  }
  return out;
}

export const REVENUE_BY_OFFER = [
  { label: "Hebdomadaire", amountHt: 22_400 },
  { label: "Mensuel", amountHt: 38_200 },
  { label: "Saison", amountHt: 58_900 },
  { label: "Marketplace", amountHt: 16_575 },
];
