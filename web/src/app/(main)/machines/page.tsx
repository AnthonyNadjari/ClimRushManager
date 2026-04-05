"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { MachineStatus, Machine } from "@/lib/types";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { SimpleModal } from "@/components/SimpleModal";
import { apiJson } from "@/lib/api-client";
import { MACHINE_MODELS, DEFAULT_MACHINE_MODEL, type MachineModelName } from "@/lib/constants";

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

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function MachinesPage() {
  const { data: machines, error, mutate, isLoading } = useSWR<Machine[]>(
    "/api/machines",
    fetcher,
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | MachineStatus | "louee">("all");
  const [lotFilter, setLotFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "lot">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "batch" | "list">("single");
  const [newId, setNewId] = useState("");
  const [newModel, setNewModel] = useState<MachineModelName>(DEFAULT_MACHINE_MODEL);
  const [newLot, setNewLot] = useState("Stock neuf — IDF");
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");
  const [batchCustom, setBatchCustom] = useState("");
  const [batchExclude, setBatchExclude] = useState("");
  const [saving, setSaving] = useState(false);

  const stockTotal = machines?.length ?? 0;
  const louees = machines?.filter((m) => m.status === "LOUE").length ?? 0;
  const amorties = machines?.filter((m) => m.amortized).length ?? 0;
  const amortPct = stockTotal > 0 ? (amorties / stockTotal) * 100 : 0;

  const uniqueLots = useMemo(() => {
    if (!machines) return [];
    return Array.from(new Set(machines.map((m) => m.lot))).sort();
  }, [machines]);

  const list = useMemo(() => {
    if (!machines) return [];
    return machines.filter((m) => {
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
      const matchLot = lotFilter === "all" || m.lot === lotFilter;
      return matchQ && matchF && matchLot;
    });
  }, [machines, q, filter, lotFilter]);

  const groupedByLot = useMemo(() => {
    const map = new Map<string, Machine[]>();
    for (const m of list) {
      const arr = map.get(m.lot) ?? [];
      arr.push(m);
      map.set(m.lot, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (addMode === "batch") return submitBatch(e);
    if (addMode === "list") return submitList(e);
    const id = newId.replace(/^#/, "").trim();
    if (!id) {
      alert("Indiquez un numéro de machine.");
      return;
    }
    setSaving(true);
    try {
      await apiJson("/api/machines", {
        method: "POST",
        body: JSON.stringify({
          id,
          model: newModel,
          lot: newLot,
        }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Nouvelle machine",
          subtitle: `Unité #${id} ajoutée au parc`,
          time: "À l’instant",
        }),
      });
      setAddOpen(false);
      setNewId("");
      void mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function submitBatch(e: React.FormEvent) {
    e.preventDefault();
    const lo = batchFrom.trim();
    const hi = batchTo.trim();
    if (!lo || !hi) {
      alert("Indiquez les numéros de début et fin.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiJson<{ created: string[]; skipped: string[]; total: number }>(
        "/api/machines/batch",
        {
          method: "POST",
          body: JSON.stringify({
            from: lo,
            to: hi,
            exclude: batchExclude.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean),
            model: newModel,
            lot: newLot,
          }),
        },
      );
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Lot machines ajouté",
          subtitle: `${res.total} unités créées (#${lo}–#${hi})${res.skipped.length ? `, ${res.skipped.length} déjà existantes` : ""}`,
          time: "À l’instant",
        }),
      });
      setAddOpen(false);
      setBatchFrom("");
      setBatchTo("");
      void mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function submitList(e: React.FormEvent) {
    e.preventDefault();
    const ids = batchCustom.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      alert("Indiquez au moins un numéro.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiJson<{ created: string[]; skipped: string[]; total: number }>(
        "/api/machines/batch",
        {
          method: "POST",
          body: JSON.stringify({ ids, model: newModel, lot: newLot }),
        },
      );
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Machines ajoutées",
          subtitle: `${res.total} unités créées${res.skipped.length ? `, ${res.skipped.length} déjà existantes` : ""}`,
          time: "À l'instant",
        }),
      });
      setAddOpen(false);
      setBatchCustom("");
      void mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <DatabaseErrorCard />;
  }

  if (isLoading || !machines) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement du parc…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="flex items-start justify-between gap-2 pt-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Machines
          </h1>
          <p className="text-sm text-zinc-500">{stockTotal} unités au total</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 rounded-xl bg-[var(--cr-blue)] px-3 py-2 text-sm font-semibold text-white"
        >
          + Ajouter
        </button>
      </header>

      <SimpleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter des machines"
      >
        <form onSubmit={submitAdd} className="space-y-3">
          <div className="flex rounded-xl bg-zinc-200/80 p-1">
            <button
              type="button"
              onClick={() => setAddMode("single")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                addMode === "single" ? "bg-white shadow-sm" : "text-zinc-600"
              }`}
            >
              Une machine
            </button>
            <button
              type="button"
              onClick={() => setAddMode("batch")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                addMode === "batch" ? "bg-white shadow-sm" : "text-zinc-600"
              }`}
            >
              Plage
            </button>
            <button
              type="button"
              onClick={() => setAddMode("list")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                addMode === "list" ? "bg-white shadow-sm" : "text-zinc-600"
              }`}
            >
              Liste libre
            </button>
          </div>

          {addMode === "single" ? (
            <label className="block">
              <span className="text-xs font-medium text-zinc-500">N° machine</span>
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="ex. 512"
                className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
              />
            </label>
          ) : addMode === "batch" ? (
            <>
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="text-xs font-medium text-zinc-500">Du n°</span>
                  <input
                    value={batchFrom}
                    onChange={(e) => setBatchFrom(e.target.value)}
                    placeholder="200"
                    className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                  />
                </label>
                <label className="flex-1">
                  <span className="text-xs font-medium text-zinc-500">Au n°</span>
                  <input
                    value={batchTo}
                    onChange={(e) => setBatchTo(e.target.value)}
                    placeholder="250"
                    className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-zinc-500">Exclure (optionnel)</span>
                <input
                  value={batchExclude}
                  onChange={(e) => setBatchExclude(e.target.value)}
                  placeholder="ex. 10, 15"
                  className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="text-xs font-medium text-zinc-500">Numéros (séparés par virgule)</span>
              <textarea
                value={batchCustom}
                onChange={(e) => setBatchCustom(e.target.value)}
                placeholder="ex. 1, 2, 3, 5, 7, 11"
                rows={3}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base outline-none focus:border-[var(--cr-blue)]"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Modèle</span>
            <select
              value={newModel}
              onChange={(e) => setNewModel(e.target.value as MachineModelName)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none focus:border-[var(--cr-blue)]"
            >
              {MACHINE_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Lot</span>
            <input
              value={newLot}
              onChange={(e) => setNewLot(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 w-full rounded-xl bg-[var(--cr-blue)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? "…"
              : addMode === "batch"
                ? `Créer le lot (#${batchFrom || "?"} → #${batchTo || "?"})`
                : addMode === "list"
                  ? "Créer les machines"
                  : "Créer en base"}
          </button>
        </form>
      </SimpleModal>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une machine…"
        className="mt-4 min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-[var(--cr-blue)]"
      />

      {/* Status filter pills */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Pill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Toutes (${stockTotal})`}
        />
        <Pill
          active={filter === "louee"}
          onClick={() => setFilter("louee")}
          label={`Louées (${louees})`}
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

      {/* Lot filter + view toggle */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setLotFilter("all")}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              lotFilter === "all"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Tous lots
          </button>
          {uniqueLots.map((lot) => (
            <button
              key={lot}
              type="button"
              onClick={() => setLotFilter(lot === lotFilter ? "all" : lot)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                lotFilter === lot
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {lot}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-lg bg-zinc-200/80 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              viewMode === "list" ? "bg-white shadow-sm" : "text-zinc-600"
            }`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode("lot")}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              viewMode === "lot" ? "bg-white shadow-sm" : "text-zinc-600"
            }`}
          >
            Par lot
          </button>
        </div>
      </div>

      {/* Machine list */}
      {viewMode === "list" ? (
        <ul className="mt-3 flex flex-col gap-3">
          {list.map((m) => (
            <MachineRow
              key={m.id}
              machine={m}
              onUpdated={() => void mutate()}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-3 space-y-4">
          {groupedByLot.map(([lot, lotMachines]) => {
            const dispo = lotMachines.filter((m) => m.status === "DISPO").length;
            const loue = lotMachines.filter((m) => m.status === "LOUE").length;
            const sav = lotMachines.filter((m) => m.status === "SAV").length;
            const other = lotMachines.length - dispo - loue - sav;
            return (
              <LotGroup
                key={lot}
                lot={lot}
                machines={lotMachines}
                dispo={dispo}
                loue={loue}
                savCount={sav}
                other={other}
                onUpdated={() => void mutate()}
              />
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/90 p-4">
        <p className="text-sm font-semibold text-violet-900">
          {amorties} machines amorties ({amortPct.toFixed(1)} % du parc)
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

const STATUS_ORDER: MachineStatus[] = [
  "DISPO",
  "LOUE",
  "RESA",
  "LIV",
  "SAV",
];

function MachineRow({
  machine: m,
  onUpdated,
}: {
  machine: Machine;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function changeStatus(next: MachineStatus) {
    if (next === m.status) return;
    setBusy(true);
    try {
      await apiJson(`/api/machines/${encodeURIComponent(m.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Statut machine",
          subtitle: `#${m.id} → ${statusLabels[next]}`,
          time: "À l’instant",
        }),
      });
      onUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Mise à jour impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
      <Link
        href={`/m/${encodeURIComponent(m.id)}`}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white"
        title="Ouvrir la fiche machine"
      >
        #{m.id}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900">{m.model}</p>
        <p className="text-sm text-zinc-600">
          {m.clientName
            ? `${m.clientName} — Retour ${m.returnDate ?? "—"}`
            : "Disponible — Aucun client"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">Lot : {m.lot}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
        <label className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
          <span className="font-medium">Changer statut</span>
          <select
            disabled={busy}
            value={m.status}
            onChange={(e) =>
              void changeStatus(e.target.value as MachineStatus)
            }
            className="min-h-9 min-w-[120px] rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold outline-none focus:border-[var(--cr-blue)] disabled:opacity-50"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

function LotGroup({
  lot,
  machines: lotMachines,
  dispo,
  loue,
  savCount,
  other,
  onUpdated,
}: {
  lot: string;
  machines: Machine[];
  dispo: number;
  loue: number;
  savCount: number;
  other: number;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-zinc-900">{lot}</span>
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
          {lotMachines.length}
        </span>
        <span className="flex-1" />
        <span className="flex gap-1.5 text-[10px] font-semibold">
          {dispo > 0 && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
              {dispo} dispo
            </span>
          )}
          {loue > 0 && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">
              {loue} louée{loue > 1 ? "s" : ""}
            </span>
          )}
          {savCount > 0 && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">
              {savCount} SAV
            </span>
          )}
          {other > 0 && (
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-600">
              {other} autre{other > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="text-xs text-zinc-400">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <ul className="flex flex-col gap-2 px-3 pb-3">
          {lotMachines.map((m) => (
            <MachineRow key={m.id} machine={m} onUpdated={onUpdated} />
          ))}
        </ul>
      )}
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
