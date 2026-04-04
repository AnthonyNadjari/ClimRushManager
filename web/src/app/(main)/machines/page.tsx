"use client";

import { useMemo, useState } from "react";
import { KPI, MACHINES } from "@/lib/data";
import type { MachineStatus } from "@/lib/types";

const statusLabels: Record<MachineStatus, string> = {
  DISPO: "DISPO",
  LOUE: "LOUÉE",
  RESA: "RÉSA",
  LIV: "LIV.",
  SAV: "SAV",
};

const statusStyle: Record<MachineStatus, string> = {
  DISPO: "bg-emerald-100 text-emerald-800",
  LOUE: "bg-red-100 text-red-800",
  RESA: "bg-blue-100 text-blue-800",
  LIV: "bg-amber-100 text-amber-900",
  SAV: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export default function MachinesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | MachineStatus | "louee">("all");

  const list = useMemo(() => {
    return MACHINES.filter((m) => {
      const matchQ =
        !q ||
        m.id.includes(q.replace("#", "")) ||
        m.model.toLowerCase().includes(q.toLowerCase()) ||
        (m.clientName?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchF =
        filter === "all"
          ? true
          : filter === "louee"
            ? m.status === "LOUE"
            : m.status === filter;
      return matchQ && matchF;
    });
  }, [q, filter]);

  const amortPct = (KPI.amorties / KPI.stockTotal) * 100;

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex items-start justify-between gap-2 pt-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Machines
          </h1>
          <p className="text-sm text-zinc-500">
            {KPI.stockTotal} unités au total
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl bg-[var(--cr-blue)] px-3 py-2 text-sm font-semibold text-white"
        >
          + Ajouter
        </button>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une machine…"
        className="mt-4 min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-[var(--cr-blue)]"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Pill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Toutes (${KPI.stockTotal})`}
        />
        <Pill
          active={filter === "louee"}
          onClick={() => setFilter("louee")}
          label={`Louées (${KPI.louees})`}
        />
        <Pill
          active={filter === "DISPO"}
          onClick={() => setFilter("DISPO")}
          label="Dispos"
        />
        <Pill
          active={filter === "SAV"}
          onClick={() => setFilter("SAV")}
          label="SAV"
        />
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {list.map((m) => (
          <li
            key={m.id}
            className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm"
          >
            <button
              type="button"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white"
              title="Voir QR"
            >
              #{m.id}
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">{m.model}</p>
              <p className="text-sm text-zinc-600">
                {m.clientName
                  ? `${m.clientName} — Retour ${m.returnDate ?? "—"}`
                  : "Disponible — Aucun client"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">Lot : {m.lot}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusStyle[m.status]}`}
                >
                  {statusLabels[m.status]}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    m.amortized
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-900"
                  }`}
                >
                  {m.amortLabel}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/90 p-4">
        <p className="text-sm font-semibold text-violet-900">
          {KPI.amorties} machines amorties ({amortPct.toFixed(1)} % du parc)
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-200">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${Math.min(100, amortPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ${
        active
          ? "bg-[var(--cr-blue)] text-white ring-[var(--cr-blue)]"
          : "bg-white text-zinc-700 ring-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
