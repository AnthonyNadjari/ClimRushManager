"use client";

import { useMemo, useState } from "react";
import { june2026Calendar } from "@/lib/data";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

/** Juin 2026 commence un lundi → offset 0 */
export default function PlanningPage() {
  const [view, setView] = useState<"month" | "week">("month");
  const days = useMemo(() => june2026Calendar(), []);

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex items-center justify-between pt-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Planning
          </h1>
          <p className="text-sm text-zinc-500">Juin 2026</p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-[var(--cr-blue)] px-3 py-2 text-sm font-semibold text-white"
        >
          + Réserver
        </button>
      </header>

      <div className="mt-4 flex rounded-xl bg-zinc-200/80 p-1">
        <button
          type="button"
          onClick={() => setView("month")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            view === "month" ? "bg-white shadow-sm" : "text-zinc-600"
          }`}
        >
          Mois
        </button>
        <button
          type="button"
          onClick={() => setView("week")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
            view === "week" ? "bg-white shadow-sm" : "text-zinc-600"
          }`}
        >
          Semaine
        </button>
      </div>

      {view === "month" ? (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
            {weekDays.map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((meta) => (
              <button
                key={meta.day}
                type="button"
                className="flex aspect-square flex-col items-center justify-start rounded-xl bg-white p-1 text-sm font-medium shadow-sm ring-1 ring-zinc-100"
              >
                <span>{meta.day}</span>
                <span className="mt-1 flex flex-wrap justify-center gap-0.5">
                  <Dot color="bg-red-500" title="Louées" />
                  <Dot color="bg-emerald-500" title="Dispo" />
                  <Dot color="bg-amber-500" title="Livraisons" />
                  <Dot color="bg-blue-500" title="Retours" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-100">
          Vue semaine : même grille compacte sur 7 jours (démo — données
          agrégées comme la vue mois).
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 text-sm">
        <p className="font-semibold text-zinc-800">Légende</p>
        <ul className="mt-2 space-y-1 text-zinc-600">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Louées
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Dispo
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Livraisons
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Retours
          </li>
        </ul>
      </div>
    </div>
  );
}

function Dot({ color, title }: { color: string; title: string }) {
  return (
    <span
      className={`block h-1.5 w-1.5 rounded-full ${color}`}
      title={title}
    />
  );
}
