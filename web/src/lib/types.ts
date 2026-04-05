export type MachineStatus =
  | "DISPO"
  | "LOUE"
  | "RESA"
  | "LIV"
  | "SAV";

export type FieldTaskStatus = "done" | "in_progress" | "pending";

export type ClientStatus = "en_cours" | "a_venir" | "inactif";

export interface Machine {
  /** Numéro d’unité unique (une machine = un n°). */
  id: string;
  model: string;
  /** Regroupement logique (chantier, achat, tournée…) — un client peut avoir plusieurs n° ou un lot homogène. */
  lot: string;
  status: MachineStatus;
  clientId: string | null;
  clientName: string | null;
  returnDate: string | null;
  purchasePriceHt: number;
  cumulativeRevenueHt: number;
  avgDailyRevenueHt: number;
  daysRented: number;
  amortized: boolean;
  amortLabel: string;
}

export interface FieldTask {
  id: string;
  clientLabel: string;
  address: string;
  phone: string;
  qty: number;
  status: FieldTaskStatus;
  timeNote?: string;
  upsell?: string;
  extraNote?: string;
}

export interface ActivityItem {
  id: string;
  kind: "ok" | "sms" | "pay" | "ret" | "amo";
  title: string;
  subtitle: string;
  time: string;
}

export interface ClientRow {
  id: string;
  name: string;
  initials: string;
  status: ClientStatus;
  machines: number;
  daysRented: number;
  caHt: number;
  alert?: string;
  email: string;
  phone: string;
  address: string;
  machineNumbers: string[];
  lotSummary?: string;
}

export interface MaintenanceRow {
  id: string;
  machineId: string;
  title: string;
  detail: string;
  priority: "urgent" | "nettoyage" | "mineur" | "done";
  action?: string;
}

export interface CalendarDayMeta {
  day: number;
  lou: number;
  dis: number;
  liv: number;
  ret: number;
}
