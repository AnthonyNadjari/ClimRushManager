"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { june2026Calendar } from "@/lib/data";
import { apiJson } from "@/lib/api-client";

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const PLANNING_YEAR = 2026;
const PLANNING_MONTH = 6;

function toIsoDate(day: number) {
  const d = new Date(Date.UTC(PLANNING_YEAR, PLANNING_MONTH - 1, day));
  return d.toISOString().slice(0, 10);
}

type ReservationRow = {
  id: string;
  date: string;
  client: string;
  machines: number;
  type: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function PlanningPage() {
  const resKey = `/api/reservations?from=${PLANNING_YEAR}-06-01&to=${PLANNING_YEAR}-06-30`;
  const { data: reservations, error, mutate, isLoading } = useSWR<
    ReservationRow[]
  >(resKey, fetcher);

  const [view, setView] = useState<"month" | "week">("month");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [prefillDay, setPrefillDay] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!reserveOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reserveOpen]);

  const days = useMemo(() => june2026Calendar(), []);

  const resaByDay = useMemo(() => {
    const m: Record<number, number> = {};
    for (const r of reservations ?? []) {
      const day = parseInt(r.date.slice(8, 10), 10);
      if (!Number.isNaN(day)) m[day] = (m[day] ?? 0) + 1;
    }
    return m;
  }, [reservations]);

  const [form, setForm] = useState({
    date: toIsoDate(1),
    client: "",
    machines: "1",
    type: "saison" as "hebdo" | "mensuel" | "saison",
  });

  function openReserve(day: number | null) {
    setPrefillDay(day);
    if (day != null) {
      setForm((f) => ({ ...f, date: toIsoDate(day) }));
    } else {
      setForm({
        date: toIsoDate(1),
        client: "",
        machines: "1",
        type: "saison",
      });
    }
    setReserveOpen(true);
  }

  function closeReserve() {
    setReserveOpen(false);
    setPrefillDay(null);
  }

  async function submitReserve(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.max(1, parseInt(form.machines, 10) || 1);
    setSaving(true);
    try {
      await apiJson("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          date: form.date,
          client: form.client.trim(),
          machines: n,
          type: form.type,
        }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Réservation",
          subtitle: `${form.client.trim() || "Client"} — ${n} mach. — ${form.type} — ${form.date}`,
          time: "À l’instant",
        }),
      });
      void mutate();
      closeReserve();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <DatabaseErrorCard />;
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex items-center justify-between pt-3 lg:pt-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Planning
          </h1>
          <p className="text-sm text-zinc-500">
            Juin 2026
            {isLoading ? " — chargement réservations…" : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openReserve(null)}
          className="rounded-xl bg-[var(--cr-blue)] px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
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
                onClick={() => openReserve(meta.day)}
                className="flex aspect-square flex-col items-center justify-start rounded-xl bg-white p-1 text-sm font-medium shadow-sm ring-1 ring-zinc-100 transition-colors hover:bg-zinc-50 hover:ring-zinc-200 active:bg-zinc-100"
              >
                <span>{meta.day}</span>
                {resaByDay[meta.day] ? (
                  <span className="mt-0.5 text-[9px] font-semibold text-blue-600">
                    {resaByDay[meta.day]} résa
                  </span>
                ) : null}
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
          Vue semaine : à agréger comme la vue mois (données calendrier
          indicatives).
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
        <p className="mt-3 text-xs text-zinc-500">
          Les réservations enregistrées apparaissent en bleu sur le jour (base
          PostgreSQL).
        </p>
      </div>

      {reserveOpen && portalReady
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
              role="dialog"
              aria-modal
              aria-labelledby="reserve-title"
              onClick={closeReserve}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                  <h2 id="reserve-title" className="font-serif text-lg font-bold">
                    Nouvelle réservation
                  </h2>
                  <button
                    type="button"
                    onClick={closeReserve}
                    className="rounded-full px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                  >
                    Fermer
                  </button>
                </div>
                <form onSubmit={submitReserve} className="space-y-4 p-4">
                  {prefillDay != null ? (
                    <p className="text-xs text-zinc-500">
                      Jour sélectionné :{" "}
                      <strong>{prefillDay} juin 2026</strong>
                    </p>
                  ) : null}
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Date de début
                    </span>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Client (raison sociale ou nom)
                    </span>
                    <input
                      type="text"
                      value={form.client}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, client: e.target.value }))
                      }
                      placeholder="ex. Résidence du Marais"
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Nombre de machines
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={form.machines}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, machines: e.target.value }))
                      }
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Formule
                    </span>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as typeof form.type,
                        }))
                      }
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    >
                      <option value="hebdo">Hebdomadaire</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="saison">Saison</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-12 w-full rounded-xl bg-[var(--cr-blue)] text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "…" : "Enregistrer en base"}
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
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
