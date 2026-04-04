import { KPI, REVENUE_BY_OFFER } from "@/lib/data";

export default function AnalyticsPage() {
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
    { pct: (KPI.louees / KPI.stockTotal) * 100, color: "#2563eb" },
    { pct: (KPI.sav / KPI.stockTotal) * 100, color: "#dc2626" },
    { pct: (other / KPI.stockTotal) * 100, color: "#ea580c" },
  ];
  let at = 0;
  const parts: string[] = [];
  for (const s of segments) {
    const end = at + s.pct;
    parts.push(`${s.color} ${at}% ${end}%`);
    at = end;
  }
  const gradient = `conic-gradient(${parts.join(", ")})`;

  return (
    <div className="flex flex-1 flex-col px-4 pb-2">
      <header className="flex flex-wrap items-center justify-between gap-2 pt-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Analytics
          </h1>
          <p className="text-sm text-zinc-500">Saison Été 2026</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-zinc-200">
          Mois
        </span>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <StatCard
          label="CA saison"
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

      <div className="mt-6 flex flex-col items-center">
        <div
          className="h-44 w-44 rounded-full shadow-inner ring-4 ring-white"
          style={{ backgroundImage: gradient }}
        />
        <p className="mt-3 text-center text-sm font-medium text-zinc-600">
          {KPI.stockTotal} unités — répartition
        </p>
      </div>

      <div className="mt-6 space-y-4">
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

      <section className="mt-6 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Revenus par offre</h2>
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
