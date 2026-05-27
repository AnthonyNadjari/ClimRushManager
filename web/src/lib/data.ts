import type { CalendarDayMeta } from "./types";

/** Juin 2026 — lundi = 1er juin 2026 (vue calendrier).
 *  Valeurs par jour à 0 : seules les vraies réservations remontent (résa). */
export function june2026Calendar(): CalendarDayMeta[] {
  const daysInMonth = 30;
  const out: CalendarDayMeta[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    out.push({ day: d, lou: 0, dis: 0, liv: 0, ret: 0 });
  }
  return out;
}

export const REVENUE_BY_OFFER = [
  { label: "Hebdomadaire", amountHt: 22_400 },
  { label: "Mensuel", amountHt: 38_200 },
  { label: "Saison", amountHt: 58_900 },
  { label: "Marketplace", amountHt: 16_575 },
] as const;
