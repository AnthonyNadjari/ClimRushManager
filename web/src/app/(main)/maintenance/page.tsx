"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import type { MaintenanceRow } from "@/lib/types";
import { apiJson } from "@/lib/api-client";

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function MaintenancePage() {
  const { data: rows, error, mutate, isLoading } = useSWR<MaintenanceRow[]>(
    "/api/maintenance",
    fetcher,
  );

  const stats = useMemo(() => {
    if (!rows) return { urgent: 0, nettoyage: 0, done: 0 };
    return {
      urgent: rows.filter((r) => r.priority === "urgent").length,
      nettoyage: rows.filter((r) => r.priority === "nettoyage").length,
      done: rows.filter((r) => r.priority === "done").length,
    };
  }, [rows]);

  if (error) {
    return <DatabaseErrorCard />;
  }

  if (isLoading || !rows) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement maintenance…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="pt-3">
        <h1 className="font-serif text-2xl font-bold text-zinc-900">
          Maintenance
        </h1>
        <p className="text-sm text-zinc-500">{rows.length} tickets</p>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div className="rounded-xl bg-red-100 py-3 text-red-900">
          {stats.urgent}
          <br />
          <span className="font-semibold">À réparer</span>
        </div>
        <div className="rounded-xl bg-amber-100 py-3 text-amber-900">
          {stats.nettoyage}
          <br />
          <span className="font-semibold">À nettoyer</span>
        </div>
        <div className="rounded-xl bg-emerald-100 py-3 text-emerald-900">
          {stats.done}
          <br />
          <span className="font-semibold">Traités</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((m) => (
          <MaintenanceCard key={m.id} row={m} onDone={() => void mutate()} />
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-950">
        <span className="font-semibold">i</span> Valider un ticket SAV remet la
        machine en <strong>DISPO</strong> en base (si elle était en SAV).
      </div>
    </div>
  );
}

function MaintenanceCard({
  row,
  onDone,
}: {
  row: MaintenanceRow;
  onDone: () => void;
}) {
  const [action, setAction] = useState(row.action ?? "");
  const [busy, setBusy] = useState(false);

  if (row.priority === "done") {
    return (
      <li className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div className="flex gap-3">
          <Link
            href={`/m/${encodeURIComponent(row.machineId)}`}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white"
          >
            #{row.machineId}
          </Link>
          <div className="flex-1">
            <p className="font-semibold text-zinc-400 line-through">
              {row.title}
            </p>
            <p className="mt-1 text-sm text-zinc-700">{row.detail}</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900">
              TRAITÉ
            </span>
            <p className="mt-2 text-sm text-emerald-800">
              ✓ Machine #{row.machineId} — ticket clos
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

  async function handleValidate() {
    setBusy(true);
    try {
      await apiJson(`/api/maintenance/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          priority: "done",
          action: action || null,
        }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "SAV validé",
          subtitle: `Machine #${row.machineId} — ${row.title}`,
          time: "À l’instant",
        }),
      });
      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <Link
          href={`/m/${encodeURIComponent(row.machineId)}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white"
        >
          #{row.machineId}
        </Link>
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
              <button
                type="button"
                onClick={() =>
                  void apiJson("/api/activity", {
                    method: "POST",
                    body: JSON.stringify({
                      kind: "ok",
                      title: "Photo SAV",
                      subtitle: `Avant réparation #${row.machineId} (journal terrain)`,
                      time: "À l’instant",
                    }),
                  }).catch(() => {})
                }
                className="flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 text-xs font-medium text-red-700"
              >
                + Photo 1
              </button>
              <button
                type="button"
                onClick={() =>
                  void apiJson("/api/activity", {
                    method: "POST",
                    body: JSON.stringify({
                      kind: "ok",
                      title: "Photo SAV",
                      subtitle: `Après constat #${row.machineId}`,
                      time: "À l’instant",
                    }),
                  }).catch(() => {})
                }
                className="flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 text-xs font-medium text-red-700"
              >
                + Photo 2
              </button>
            </div>
          ) : null}
          <div className="mt-3 space-y-2">
            <select
              className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium outline-none"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">{row.action ?? "Choisir action"}</option>
              <option value="Réparer">Réparer</option>
              <option value="À nettoyer">À nettoyer</option>
              <option value="OK — prêt stock">OK — prêt stock</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleValidate()}
              className={`min-h-12 w-full rounded-xl text-sm font-bold text-white disabled:opacity-60 ${
                row.priority === "urgent"
                  ? "bg-red-600"
                  : row.priority === "nettoyage"
                    ? "bg-amber-600"
                    : "bg-zinc-500"
              }`}
            >
              {busy ? "…" : "VALIDER (base)"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
