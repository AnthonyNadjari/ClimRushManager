import type {
  Activity as PActivity,
  Client as PClient,
  FieldTask as PFieldTask,
  Machine as PMachine,
  MaintenanceTicket as PMaint,
} from "@prisma/client";
import { amortizationLabel, REVENUE_PER_DAY } from "./amortization";
import type {
  ActivityItem,
  ClientRow,
  FieldTask,
  Machine,
  MaintenanceRow,
} from "./types";

const CONTRACTS = ["hebdo", "mensuel", "saison"] as const;
type Contract = (typeof CONTRACTS)[number];

function contractKey(raw: string): Contract {
  if (CONTRACTS.includes(raw as Contract)) return raw as Contract;
  return "saison";
}

export function serializeMachine(m: PMachine): Machine {
  const contract = contractKey(m.contract);
  const avgDailyHt = REVENUE_PER_DAY[contract];
  const { label, amortized, tone } = amortizationLabel({
    purchaseHt: m.purchasePriceHt,
    cumulativeHt: m.cumulativeRevenueHt,
    avgDailyHt,
    daysRented: m.daysRented,
  });
  const tonePrefix =
    tone === "ok" ? "Amorti — " : tone === "warn" ? "" : "";
  return {
    id: m.id,
    model: m.model,
    lot: m.lot,
    status: m.status,
    clientId: m.clientId,
    clientName: m.clientName,
    returnDate: m.returnDate,
    purchasePriceHt: m.purchasePriceHt,
    cumulativeRevenueHt: m.cumulativeRevenueHt,
    avgDailyRevenueHt: avgDailyHt,
    daysRented: m.daysRented,
    amortized,
    amortLabel:
      tone === "ok" ? `${tonePrefix}Machine rentabilisée` : label,
  };
}

type ClientWithMachines = PClient & {
  assignedMachines?: { id: string }[];
};

export function serializeClient(c: ClientWithMachines): ClientRow {
  const machineNumbers = c.assignedMachines?.map((m) => m.id) ?? [];
  return {
    id: c.id,
    name: c.name,
    initials: c.initials,
    status: c.status,
    machines: machineNumbers.length,
    daysRented: c.daysRented,
    caHt: c.caHt,
    alert: c.alert ?? undefined,
    email: c.email,
    phone: c.phone,
    address: c.address,
    machineNumbers,
    lotSummary: c.lotSummary ?? undefined,
  };
}

export function parseMachineIdsJson(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function serializeFieldTask(t: PFieldTask): FieldTask {
  return {
    id: t.id,
    clientLabel: t.clientLabel,
    address: t.address,
    phone: t.phone,
    qty: t.qty,
    status: t.status,
    timeNote: t.timeNote ?? undefined,
    upsell: t.upsell ?? undefined,
    extraNote: t.extraNote ?? undefined,
    truckLabel: t.truckLabel ?? "Tous",
    machineIds: parseMachineIdsJson(t.machineIdsJson),
  };
}

export function serializeMaintenance(row: PMaint): MaintenanceRow {
  return {
    id: row.id,
    machineId: row.machineId,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    action: row.action ?? undefined,
  };
}

export function serializeActivity(a: PActivity): ActivityItem {
  const allowed: ActivityItem["kind"][] = [
    "ok",
    "sms",
    "pay",
    "ret",
    "amo",
  ];
  const kind = allowed.includes(a.kind as ActivityItem["kind"])
    ? (a.kind as ActivityItem["kind"])
    : "ok";
  return {
    id: a.id,
    kind,
    title: a.title,
    subtitle: a.subtitle,
    time: a.time,
  };
}
