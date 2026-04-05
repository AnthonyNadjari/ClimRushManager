"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { MachineStatus, Machine } from "@/lib/types";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { SimpleModal } from "@/components/SimpleModal";
import { apiJson } from "@/lib/api-client";

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
  const [addOpen, setAddOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newModel, setNewModel] = useState("12 000 BTU Monobloc");
  const [newLot, setNewLot] = useState("Stock neuf — IDF");
  const [saving, setSaving] = useState(false);

  const stockTotal = machines?.length ?? 0;
  const louees = machines?.filter((m) => m.status === "LOUE").length ?? 0;
  const amorties = machines?.filter((m) => m.amortized).length ?? 0;
  const amortPct = stockTotal > 0 ? (amorties / stockTotal) * 100 : 0;

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
      return matchQ && matchF;
    });
  }, [machines, q, filter]);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
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
        title="Ajouter une machine"
      >
        <form onSubmit={submitAdd} className="space-y-3">
          <p className="text-xs text-zinc-500">
            Création en base PostgreSQL (identifiant = n° d’unité).
          </p>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">N° machine</span>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="ex. 512"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Modèle</span>
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
            />
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
            {saving ? "…" : "Créer en base"}
          </button>
        </form>
      </SimpleModal>

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

      <ul className="mt-3 flex flex-col gap-3">
        {list.map((m) => (
          <MachineRow
            key={m.id}
            machine={m}
            onUpdated={() => void mutate()}
          />
        ))}
      </ul>

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
