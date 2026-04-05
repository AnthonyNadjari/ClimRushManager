"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import type { ClientRow } from "@/lib/types";
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
  endDate: string | null;
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
  const { data: allClients } = useSWR<ClientRow[]>("/api/clients", fetcher);

  const [view, setView] = useState<"month" | "week">("month");
  const [weekIndex, setWeekIndex] = useState(0);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [prefillDay, setPrefillDay] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

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

  const weekStartDay = 1 + weekIndex * 7;
  const weekCells = Array.from({ length: 7 }, (_, i) => {
    const d = weekStartDay + i;
    return d <= 30 ? d : null;
  });

  const [form, setForm] = useState({
    date: toIsoDate(1),
    endDate: toIsoDate(7),
    client: "",
    machines: "1",
    type: "saison" as "hebdo" | "mensuel" | "saison",
    createDelivery: true,
    address: "",
    phone: "",
  });

  const clientSuggestions = useMemo(() => {
    if (!allClients) return [];
    if (!form.client) return allClients;
    const q = form.client.toLowerCase();
    return allClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [allClients, form.client]);

  function openReserve(day: number | null) {
    setPrefillDay(day);
    if (day != null) {
      const end = Math.min(30, day + 6);
      setForm((f) => ({
        ...f,
        date: toIsoDate(day),
        endDate: toIsoDate(end),
      }));
    } else {
      setForm({
        date: toIsoDate(1),
        endDate: toIsoDate(7),
        client: "",
        machines: "1",
        type: "saison",
        createDelivery: true,
        address: "",
        phone: "",
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
          endDate: form.endDate || null,
          client: form.client.trim(),
          machines: n,
          type: form.type,
        }),
      });
      if (form.createDelivery) {
        await apiJson("/api/field-tasks", {
          method: "POST",
          body: JSON.stringify({
            mode: "livraison",
            clientLabel: form.client.trim() || "Client",
            address: form.address.trim(),
            phone: form.phone.trim(),
            qty: n,
          }),
        });
      }
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Réservation",
          subtitle: `${form.client.trim() || "Client"} — ${n} mach. — ${form.type} — ${form.date}${form.createDelivery ? " + livraison créée" : ""}`,
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
        <>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-zinc-100">
            <button
              type="button"
              disabled={weekIndex <= 0}
              onClick={() => setWeekIndex((w) => w - 1)}
              className="rounded-lg px-2 py-1 font-semibold text-zinc-700 disabled:opacity-40"
            >
              ◀
            </button>
            <span className="text-center font-medium text-zinc-700">
              Semaine du {weekStartDay} au {Math.min(30, weekStartDay + 6)}{" "}
              juin 2026
            </span>
            <button
              type="button"
              disabled={weekIndex >= 4}
              onClick={() => setWeekIndex((w) => w + 1)}
              className="rounded-lg px-2 py-1 font-semibold text-zinc-700 disabled:opacity-40"
            >
              ▶
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-500">
            {weekDays.map((d, i) => (
              <span key={`${d}-wk-${i}`}>
                {d}
                {weekCells[i] != null ? ` ${weekCells[i]}` : ""}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {weekCells.map((d, i) =>
              d == null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => openReserve(d)}
                  className="flex min-h-[6rem] flex-col items-center rounded-xl bg-white p-1.5 text-xs shadow-sm ring-1 ring-zinc-100 transition-colors hover:bg-zinc-50"
                >
                  <span className="text-sm font-bold text-zinc-900">{d}</span>
                  <span className="mt-1 flex flex-col items-center text-[11px] font-bold tabular-nums leading-snug">
                    <span className="text-red-600" title="Louées">
                      {days[d - 1].lou}
                    </span>
                    <span className="text-emerald-600" title="Dispo">
                      {days[d - 1].dis}
                    </span>
                    <span className="text-amber-600" title="Livrées">
                      {days[d - 1].liv}
                    </span>
                    <span className="text-blue-600" title="Retournées">
                      {days[d - 1].ret}
                    </span>
                  </span>
                  {resaByDay[d] ? (
                    <span className="mt-auto pt-1 text-[9px] font-semibold text-blue-600">
                      {resaByDay[d]} résa
                    </span>
                  ) : null}
                </button>
              ),
            )}
          </div>
          <p className="mt-2 text-center text-[10px] text-zinc-500">
            Colonne : louées, dispo, livrées, retournées (vue démo indicative).
          </p>
        </>
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
                      Date de fin
                    </span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    />
                  </label>
                  <label className="relative block">
                    <span className="text-xs font-medium text-zinc-500">
                      Client (raison sociale ou nom)
                    </span>
                    <input
                      ref={clientInputRef}
                      type="text"
                      value={form.client}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, client: e.target.value }));
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder="ex. Résidence du Marais"
                      className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                      autoComplete="off"
                    />
                    {showSuggestions && clientSuggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                        {clientSuggestions.slice(0, 8).map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  client: c.name,
                                  address: c.address || f.address,
                                  phone: c.phone || f.phone,
                                }));
                                setShowSuggestions(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold">
                                {c.initials}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-zinc-900">
                                  {c.name}
                                </span>
                                {c.address ? (
                                  <span className="block truncate text-xs text-zinc-500">
                                    {c.address}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
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
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.createDelivery}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          createDelivery: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-sm font-medium text-zinc-700">
                      Créer aussi la livraison
                    </span>
                  </label>

                  {form.createDelivery && (
                    <>
                      <label className="block">
                        <span className="text-xs font-medium text-zinc-500">
                          Adresse de livraison
                        </span>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, address: e.target.value }))
                          }
                          placeholder="ex. 12 rue des Archives, 75004 Paris"
                          className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-zinc-500">
                          Téléphone sur site
                        </span>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, phone: e.target.value }))
                          }
                          placeholder="ex. +33612345678"
                          className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                        />
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-12 w-full rounded-xl bg-[var(--cr-blue)] text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving
                      ? "…"
                      : form.createDelivery
                        ? "Réserver + créer livraison"
                        : "Enregistrer en base"}
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
