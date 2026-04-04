"use client";

import { useEffect, useMemo, useState } from "react";
import { ACTIVITY, KPI } from "@/lib/data";
import type { ActivityItem } from "@/lib/types";

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const feed = useMemo((): ActivityItem[] => {
    if (tick === 0) return ACTIVITY;
    return [
      {
        id: `live-${tick}`,
        kind: "ok" as const,
        title: "Rafraîchissement",
        subtitle: "KPI synchronisés (démo temps réel)",
        time: "À l’instant",
      },
      ...ACTIVITY,
    ].slice(0, 8);
  }, [tick]);

  const caDisplay = KPI.caJourHt;

  return (
    <div className="flex flex-1 flex-col px-4 pb-2">
      <header className="flex items-start justify-between pt-3">
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

      <section className="mt-4 grid grid-cols-2 gap-3">
        <KpiCard
          tone="blue"
          label="CA du jour"
          value={`${caDisplay.toLocaleString("fr-FR")} €`}
          hint={`+${KPI.caJourRentals} loc.`}
        />
        <KpiCard
          tone="green"
          label="Disponibles"
          value={`${KPI.dispo}`}
          hint={`sur ${KPI.stockTotal}`}
        />
        <KpiCard
          tone="orange"
          label="Louées"
          value={`${KPI.louees}`}
          hint={`${Math.round((KPI.louees / KPI.stockTotal) * 100)} % occ.`}
        />
        <KpiCard
          tone="red"
          label="Livraisons"
          value={`${KPI.livraisonsTotal}`}
          hint={`${KPI.livraisonsRestantes} restantes`}
        />
      </section>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-zinc-200">
          Reprises : {KPI.reprises}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-zinc-200">
          SAV : {KPI.sav}
        </span>
        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-zinc-200">
          Amorties : {KPI.amorties}
        </span>
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-bold tracking-widest text-zinc-400">
          FIL D’ACTUALITÉ
        </h2>
        <ul className="mt-3 space-y-3">
          {feed.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm"
            >
              <ActivityIcon kind={item.kind} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="text-sm text-zinc-600">{item.subtitle}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.time}</p>
              </div>
            </li>
          ))}
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

function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const base =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold";
  if (kind === "ok")
    return <span className={`${base} bg-emerald-100 text-emerald-800`}>OK</span>;
  if (kind === "sms")
    return <span className={`${base} bg-teal-100 text-teal-800`}>SMS</span>;
  if (kind === "pay")
    return <span className={`${base} bg-amber-100 text-amber-900`}>PAY</span>;
  if (kind === "ret")
    return <span className={`${base} bg-blue-100 text-blue-800`}>RET</span>;
  return <span className={`${base} bg-violet-100 text-violet-800`}>AMO</span>;
}
