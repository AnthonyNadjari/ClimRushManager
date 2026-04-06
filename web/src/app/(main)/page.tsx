"use client";

import useSWR from "swr";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import type { ActivityItem } from "@/lib/types";

type Kpi = {
  caLocationJourHt: number;
  dispo: number;
  stockTotal: number;
  louees: number;
  livraisonsTotal: number;
  livraisonsRestantes: number;
  reprises: number;
  sav: number;
  amorties: number;
};

type DashboardPayload = { kpi: Kpi; activity: ActivityItem[] };

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardPayload>("/api/dashboard", fetcher, {
    refreshInterval: 20_000,
  });

  if (error) {
    return (
      <DatabaseErrorCard heading="Impossible de charger le dashboard" />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement…
      </div>
    );
  }

  const KPI = data.kpi;
  const occ =
    KPI.stockTotal > 0 ? Math.round((KPI.louees / KPI.stockTotal) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex items-start justify-between pt-3 lg:pt-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Dashboard
          </h1>
          <p className="text-sm capitalize text-zinc-500">
            {formatDate(new Date())}
          </p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white"
          aria-hidden
        >
          TD
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          tone="blue"
          label="Recette loc. jour (HT)"
          value={`${KPI.caLocationJourHt.toLocaleString("fr-FR")} €`}
          hint={`${KPI.louees} machine(s) louée(s) — loyer journalier agrégé`}
        />
        <KpiCard
          tone="green"
          label="Disponibles"
          value={`${KPI.dispo}`}
          hint={`sur ${KPI.stockTotal}`}
        />
        <KpiCard
          tone="red"
          label="Louées"
          value={`${KPI.louees}`}
          hint={`${occ} % occ.`}
        />
        <KpiCard
          tone="orange"
          label="Livraisons"
          value={`${KPI.livraisonsTotal}`}
          hint={`${KPI.livraisonsRestantes} restantes`}
        />
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-bold tracking-widest text-zinc-400">
          FIL D’ACTUALITÉ
        </h2>
        <ul className="mt-3 space-y-3">
          {data.activity.map((item) => {
            const v = activityVisual(item);
            return (
              <li
                key={item.id}
                className={`flex gap-3 rounded-2xl border border-zinc-100 border-l-4 ${v.border} bg-white p-3 shadow-sm`}
              >
                <ActivityIcon item={item} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-600">{item.subtitle}</p>
                  <p className="mt-1 text-xs text-zinc-400">{item.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function KpiCard({
  tone,
  label,
  value,
  hint,
}: {
  tone: "blue" | "green" | "orange" | "red";
  label: string;
  value: string;
  hint: string;
}) {
  const bg =
    tone === "blue"
      ? "from-blue-500 to-blue-600"
      : tone === "green"
        ? "from-emerald-500 to-emerald-600"
        : tone === "orange"
          ? "from-amber-500 to-orange-500"
          : "from-red-500 to-rose-600";
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${bg} p-4 text-white shadow-md`}
    >
      <p className="text-xs font-medium opacity-90">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs opacity-90">{hint}</p>
    </div>
  );
}

function activityVisual(item: ActivityItem) {
  const blob = `${item.title} ${item.subtitle}`.toLowerCase();
  if (item.kind === "pay" || blob.includes("paiement")) {
    return { border: "border-l-amber-400", ring: "bg-amber-50", emoji: "💵" };
  }
  if (
    blob.includes("livr") ||
    blob.includes("livraison") ||
    blob.includes("livré")
  ) {
    return { border: "border-l-orange-500", ring: "bg-orange-50", emoji: "🚚" };
  }
  if (item.kind === "sms") {
    return { border: "border-l-sky-500", ring: "bg-sky-50", emoji: "📱" };
  }
  if (item.kind === "ret") {
    return { border: "border-l-blue-500", ring: "bg-blue-50", emoji: "↩️" };
  }
  if (item.kind === "amo") {
    return { border: "border-l-violet-500", ring: "bg-violet-50", emoji: "📉" };
  }
  return { border: "border-l-teal-500", ring: "bg-teal-50", emoji: "✅" };
}

function ActivityIcon({ item }: { item: ActivityItem }) {
  const v = activityVisual(item);
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ring-1 ring-black/5 ${v.ring}`}
      aria-hidden
    >
      {v.emoji}
    </span>
  );
}
