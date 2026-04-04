import type { CalendarDayMeta } from "./types";

/** Juin 2026 — lundi = 1er juin 2026 (vue calendrier — densités indicatives). */
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
] as const;
