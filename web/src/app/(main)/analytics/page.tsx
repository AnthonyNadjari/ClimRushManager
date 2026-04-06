"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { REVENUE_BY_OFFER } from "@/lib/data";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { SimpleModal } from "@/components/SimpleModal";

const MONTHS_DEMO = [
  "Avril 2026",
  "Mai 2026",
  "Juin 2026",
  "Juillet 2026",
  "Août 2026",
] as const;

type Kpi = {
  louees: number;
  stockTotal: number;
  dispo: number;
  sav: number;
  caSaisonHt: number;
  objectifCaHt: number;
  amorties: number;
  marketplaceVentes: number;
  marketplaceMontantHt: number;
};

type DashboardPayload = { kpi: Kpi };

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function AnalyticsPage() {
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthLabel, setMonthLabel] = useState<string>("Juin 2026");

  const { data, error, isLoading } = useSWR<DashboardPayload>(
    "/api/dashboard",
    fetcher,
  );

  const KPI = data?.kpi;

  const { occ, goalPct, amortPct, gradient } = useMemo(() => {
    if (!KPI || KPI.stockTotal <= 0) {
      return {
        occ: 0,
        goalPct: 0,
        amortPct: 0,
        gradient: "conic-gradient(#e4e4e7 0% 100%)",
      };
    }
    const occ = Math.round((KPI.louees / KPI.stockTotal) * 100);
    const goalPct = Math.min(
      100,
      Math.round((KPI.caSaisonHt / KPI.objectifCaHt) * 100),
    );
    const amortPct = (KPI.amorties / KPI.stockTotal) * 100;
    const other = Math.max(
      0,
      KPI.stockTotal - KPI.dispo - KPI.louees - KPI.sav,
    );
    const segments = [
      { pct: (KPI.dispo / KPI.stockTotal) * 100, color: "#16a34a" },
      { pct: (KPI.louees / KPI.stockTotal) * 100, color: "#dc2626" },
      { pct: (KPI.sav / KPI.stockTotal) * 100, color: "#71717a" },
      { pct: (other / KPI.stockTotal) * 100, color: "#ea580c" },
    ];
    let at = 0;
    const parts: string[] = [];
    for (const s of segments) {
      const end = at + s.pct;
      parts.push(`${s.color} ${at}% ${end}%`);
      at = end;
    }
    return {
      occ,
      goalPct,
      amortPct,
      gradient: `conic-gradient(${parts.join(", ")})`,
    };
  }, [KPI]);

  if (error) {
    return (
      <DatabaseErrorCard heading="Impossible de charger les analytics" />
    );
  }

  if (isLoading || !KPI) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex flex-wrap items-center justify-between gap-2 pt-3 lg:pt-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Analytics
          </h1>
          <p className="text-sm text-zinc-500">Saison Été 2026</p>
        </div>
        <button
          type="button"
          onClick={() => setMonthOpen(true)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          {monthLabel}
        </button>
      </header>

      <SimpleModal
        open={monthOpen}
        onClose={() => setMonthOpen(false)}
        title="Période affichée"
      >
        <p className="text-xs text-zinc-500">
          Les KPI viennent du parc en base ; seul le libellé de mois change ici.
        </p>
        <ul className="mt-3 space-y-1">
          {MONTHS_DEMO.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => {
                  setMonthLabel(m);
                  setMonthOpen(false);
                }}
                className={`min-h-11 w-full rounded-xl px-3 text-left text-sm font-medium ${
                  monthLabel === m
                    ? "bg-blue-50 text-[var(--cr-blue)] ring-1 ring-blue-200"
                    : "text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      </SimpleModal>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="CA saison (CA cumulé parc)"
          value={`${KPI.caSaisonHt.toLocaleString("fr-FR")} € HT`}
        />
        <StatCard
          label="Taux occup."
          value={`${occ} %`}
          hint={`${KPI.louees}/${KPI.stockTotal}`}
        />
        <StatCard
          label="Ventes market."
          value={`${KPI.marketplaceVentes} ventes`}
          hint={`${KPI.marketplaceMontantHt.toLocaleString("fr-FR")} € HT`}
        />
        <StatCard
          label="Machines amorties"
          value={`${KPI.amorties}`}
          hint={`${amortPct.toFixed(1)} %`}
        />
      </section>

      <div className="mt-6 flex flex-col items-center lg:mt-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
        <div className="flex flex-col items-center">
          <div
            className="h-44 w-44 shrink-0 rounded-full shadow-inner ring-4 ring-white"
            style={{ backgroundImage: gradient }}
          />
          <p className="mt-3 text-center text-sm font-medium text-zinc-600">
            {KPI.stockTotal} unités — répartition
          </p>
        </div>
        <div className="mt-6 w-full max-w-md space-y-4 lg:mt-0">
          <ProgressRow
            label="Objectif financier"
            pct={goalPct}
            hint={`${KPI.caSaisonHt.toLocaleString("fr-FR")} / ${KPI.objectifCaHt.toLocaleString("fr-FR")} € HT`}
          />
          <ProgressRow
            label="Amortissement parc"
            pct={Math.round(amortPct)}
            hint={`${KPI.amorties} machines amorties`}
          />
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm lg:mt-8">
        <h2 className="font-semibold text-zinc-900">Revenus par offre</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Agrégat indicatif (hors base) — à relier à la compta en phase 2.
        </p>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {REVENUE_BY_OFFER.map((r) => (
              <tr key={r.label} className="border-t border-zinc-100">
                <td className="py-2 text-zinc-600">{r.label}</td>
                <td className="py-2 text-right font-semibold text-zinc-900">
                  {r.amountHt.toLocaleString("fr-FR")} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 font-serif text-lg font-bold text-zinc-900">{value}</p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ProgressRow({
  label,
  pct,
  hint,
}: {
  label: string;
  pct: number;
  hint: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-zinc-800">
        <span>{label}</span>
        <span>{pct} %</span>
      </div>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-[var(--cr-blue)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
