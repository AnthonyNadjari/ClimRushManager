/** Règles simplifiées du cahier des charges V1.1 */

export function amortizationLabel(params: {
  purchaseHt: number;
  cumulativeHt: number;
  avgDailyHt: number;
  daysRented: number;
}): { label: string; amortized: boolean; tone: "ok" | "warn" | "bad" } {
  const { purchaseHt, cumulativeHt, avgDailyHt, daysRented } = params;
  if (purchaseHt <= 0 || avgDailyHt <= 0) {
    return { label: "—", amortized: false, tone: "warn" };
  }
  const thresholdDays = Math.ceil(purchaseHt / avgDailyHt);
  const ratio = cumulativeHt / purchaseHt;
  if (ratio >= 1) {
    return { label: "Amorti OK", amortized: true, tone: "ok" };
  }
  const remaining = Math.max(0, thresholdDays - daysRented);
  if (ratio >= 0.5) {
    return {
      label: `J-${remaining} jours`,
      amortized: false,
      tone: remaining <= 14 ? "warn" : "bad",
    };
  }
  return {
    label: `J-${remaining} jours`,
    amortized: false,
    tone: "bad",
  };
}

export const REVENUE_PER_DAY = {
  hebdo: 199 / 7,
  mensuel: 399 / 30,
  saison: 599 / 90,
} as const;
