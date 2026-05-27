"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { MachineStatus, Machine } from "@/lib/types";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { FilterChip } from "@/components/FilterChip";
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
  DISPO: "bg-emerald-100 text-emerald-900",
  LOUE: "bg-red-100 text-red-900",
  RESA: "bg-blue-100 text-blue-900",
  LIV: "bg-amber-100 text-amber-950",
  SAV: "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200",
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
  const [filter, setFilter] = useState<"all" | MachineStatus>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "batch" | "list">("single");
  const [newId, setNewId] = useState("");
  const [newModel, setNewModel] = useState("12 000 BTU Monobloc");
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");
  const [batchCustom, setBatchCustom] = useState("");
  const [batchExclude, setBatchExclude] = useState("");
  const [rentalOn, setRentalOn] = useState(false);
  const [rentalClient, setRentalClient] = useState("");
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [rentalType, setRentalType] = useState<"hebdo" | "mensuel" | "saison">(
    "saison",
  );
  const [rentalRemote, setRentalRemote] = useState(false);
  const [rentalKit, setRentalKit] = useState(false);
  const [saving, setSaving] = useState(false);

  const stockTotal = machines?.length ?? 0;
  const louees = machines?.filter((m) => m.status === "LOUE").length ?? 0;
  const dispoCount = machines?.filter((m) => m.status === "DISPO").length ?? 0;
  const resaCount = machines?.filter((m) => m.status === "RESA").length ?? 0;
  const livCount = machines?.filter((m) => m.status === "LIV").length ?? 0;
  const savCount = machines?.filter((m) => m.status === "SAV").length ?? 0;

  const list = useMemo(() => {
    if (!machines) return [];
    return machines.filter((m) => {
      const matchQ =
        !q ||
        m.id.includes(q.replace("#", "")) ||
        m.model.toLowerCase().includes(q.toLowerCase()) ||
        (m.clientName?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchF = filter === "all" ? true : m.status === filter;
      return matchQ && matchF;
    });
  }, [machines, q, filter]);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (addMode === "batch") return submitBatch(e);
    if (addMode === "list") return submitList(e);
    const id = newId.replace(/^#/, "").trim();
    if (!id) {
      alert("Indiquez un numéro de machine.");
      return;
    }
    if (rentalOn && !rentalEnd) {
      alert("Indiquez une date de fin de location.");
      return;
    }
    setSaving(true);
    try {
      await apiJson("/api/machines", {
        method: "POST",
        body: JSON.stringify({
          id,
          model: newModel.trim() || "12 000 BTU Monobloc",
          rental: rentalOn
            ? {
                client: rentalClient.trim(),
                startDate: rentalStart || undefined,
                endDate: rentalEnd,
                type: rentalType,
                withRemote: rentalRemote,
                withKit: rentalKit,
              }
            : null,
        }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: rentalOn ? "Machine + location" : "Nouvelle machine",
          subtitle: rentalOn
            ? `Unité #${id} affectée à ${rentalClient.trim() || "client"} (${rentalType})`
            : `Unité #${id} ajoutée au parc`,
          time: "À l’instant",
        }),
      });
      setAddOpen(false);
      setNewId("");
      setRentalOn(false);
      setRentalClient("");
      setRentalStart("");
      setRentalEnd("");
      setRentalRemote(false);
      setRentalKit(false);
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
            model: newModel.trim() || "12 000 BTU Monobloc",
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
          body: JSON.stringify({
            ids,
            model: newModel.trim() || "12 000 BTU Monobloc",
          }),
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
            <>
              <label className="block">
                <span className="text-xs font-medium text-zinc-500">N° machine</span>
                <input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="ex. 512"
                  className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                />
              </label>
              <label className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={rentalOn}
                  onChange={(e) => setRentalOn(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className="text-sm font-medium text-zinc-700">
                  Affecter à une location
                </span>
              </label>
              {rentalOn && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Client
                    </span>
                    <input
                      value={rentalClient}
                      onChange={(e) => setRentalClient(e.target.value)}
                      placeholder="ex. Résidence du Marais"
                      className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    />
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <span className="text-xs font-medium text-zinc-500">
                        Date de début
                      </span>
                      <input
                        type="date"
                        value={rentalStart}
                        onChange={(e) => setRentalStart(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                      />
                    </label>
                    <label className="flex-1">
                      <span className="text-xs font-medium text-zinc-500">
                        Date de fin
                      </span>
                      <input
                        type="date"
                        value={rentalEnd}
                        onChange={(e) => setRentalEnd(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-500">
                      Formule
                    </span>
                    <select
                      value={rentalType}
                      onChange={(e) =>
                        setRentalType(e.target.value as typeof rentalType)
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                    >
                      <option value="hebdo">Hebdomadaire</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="saison">Saison</option>
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 py-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rentalRemote}
                        onChange={(e) => setRentalRemote(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        Télécommande
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rentalKit}
                        onChange={(e) => setRentalKit(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        Kit
                      </span>
                    </label>
                  </div>
                </>
              )}
            </>
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
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Libellé libre (ex. 12 000 BTU Monobloc)"
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

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Toutes"
          count={stockTotal}
        />
        <FilterChip
          active={filter === "DISPO"}
          onClick={() => setFilter("DISPO")}
          label="Dispos"
          count={dispoCount}
          tone="green"
        />
        <FilterChip
          active={filter === "LOUE"}
          onClick={() => setFilter("LOUE")}
          label="Louée"
          count={louees}
          tone="red"
        />
        <FilterChip
          active={filter === "RESA"}
          onClick={() => setFilter("RESA")}
          label="Résa"
          count={resaCount}
          tone="blue"
        />
        <FilterChip
          active={filter === "LIV"}
          onClick={() => setFilter("LIV")}
          label="Livraison"
          count={livCount}
          tone="orange"
        />
        <FilterChip
          active={filter === "SAV"}
          onClick={() => setFilter("SAV")}
          label="SAV"
          count={savCount}
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
          {(() => {
            if (m.status === "DISPO") return "Disponible — Aucun client";
            if (m.status === "SAV") return "SAV — Atelier";
            const who = m.clientName || "Client non renseigné";
            const ret = m.returnDate ? ` — Retour ${m.returnDate}` : "";
            return `${who}${ret}`;
          })()}
        </p>
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

