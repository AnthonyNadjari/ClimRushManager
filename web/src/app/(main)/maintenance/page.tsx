"use client";

import { MAINTENANCE } from "@/lib/data";
import type { MaintenanceRow } from "@/lib/types";

export default function MaintenancePage() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-2">
      <header className="pt-3">
        <h1 className="font-serif text-2xl font-bold text-zinc-900">
          Maintenance
        </h1>
        <p className="text-sm text-zinc-500">8 machines à traiter</p>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div className="rounded-xl bg-red-100 py-3 text-red-900">
          3
          <br />
          <span className="font-semibold">À réparer</span>
        </div>
        <div className="rounded-xl bg-amber-100 py-3 text-amber-900">
          5
          <br />
          <span className="font-semibold">À nettoyer</span>
        </div>
        <div className="rounded-xl bg-emerald-100 py-3 text-emerald-900">
          12
          <br />
          <span className="font-semibold">Traités / mois</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {MAINTENANCE.map((m) => (
          <MaintenanceCard key={m.id} row={m} />
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-950">
        <span className="font-semibold">i</span> Validation = retour en stock.
        La machine passe automatiquement en Disponible.
      </div>
    </div>
  );
}

function MaintenanceCard({ row }: { row: MaintenanceRow }) {
  if (row.priority === "done") {
    return (
      <li className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
            #{row.machineId}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-zinc-400 line-through">
              {row.title}
            </p>
            <p className="mt-1 text-sm text-zinc-700">{row.detail}</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900">
              DISPO
            </span>
            <p className="mt-2 text-sm text-emerald-800">
              ✓ Validé — Machine #{row.machineId} remise en Disponible
            </p>
          </div>
        </div>
      </li>
    );
  }

  const badge =
    row.priority === "urgent"
      ? "bg-red-100 text-red-800"
      : row.priority === "nettoyage"
        ? "bg-amber-100 text-amber-900"
        : "bg-orange-100 text-orange-900";

  const badgeLabel =
    row.priority === "urgent"
      ? "URGENT"
      : row.priority === "nettoyage"
        ? "NETTOYAGE"
        : "MINEUR";

  return (
    <li className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
          #{row.machineId}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>
              {badgeLabel}
            </span>
          </div>
          <p className="mt-1 font-bold text-zinc-900">{row.title}</p>
          <p className="text-sm text-zinc-600">{row.detail}</p>
          {row.priority === "urgent" ? (
            <div className="mt-2 flex gap-2">
              <div className="h-16 flex-1 rounded-xl border-2 border-dashed border-red-200 bg-red-50" />
              <div className="h-16 flex-1 rounded-xl border-2 border-dashed border-red-200 bg-red-50" />
            </div>
          ) : null}
          <div className="mt-3 space-y-2">
            <select
              className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium outline-none"
              defaultValue={row.action ?? ""}
            >
              <option value="">{row.action ?? "Choisir action"}</option>
              <option value="repair">Réparer</option>
              <option value="clean">À nettoyer</option>
              <option value="ok">OK — prêt stock</option>
            </select>
            <button
              type="button"
              className={`min-h-12 w-full rounded-xl text-sm font-bold text-white ${
                row.priority === "urgent"
                  ? "bg-red-600"
                  : row.priority === "nettoyage"
                    ? "bg-amber-600"
                    : "bg-zinc-500"
              }`}
            >
              VALIDER
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
