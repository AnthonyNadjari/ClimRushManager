"use client";

import { useMemo, useState } from "react";
import type { FieldTask } from "@/lib/types";
import { MachineNumberModal } from "./MachineNumberModal";
import { SimpleModal } from "./SimpleModal";
import { apiJson } from "@/lib/api-client";
import { smsDraftHref, terrainSmsBody } from "@/lib/sms-draft";

type Mode = "livraison" | "reprise";

const statusConfig = {
  livraison: {
    done: { label: "LIVRÉ", className: "bg-emerald-100 text-emerald-800" },
    in_progress: {
      label: "EN COURS",
      className: "bg-amber-100 text-amber-900",
    },
    pending: { label: "À LIVRER", className: "bg-red-100 text-red-800" },
  },
  reprise: {
    done: { label: "RÉCUPÉRÉ", className: "bg-emerald-100 text-emerald-800" },
    in_progress: {
      label: "EN ROUTE",
      className: "bg-amber-100 text-amber-900",
    },
    pending: { label: "À FAIRE", className: "bg-red-100 text-red-800" },
  },
} as const;

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

type RouteOptimizeResult = {
  orderedAddresses: string[];
  totalDurationSec: number;
  totalDistanceM: number;
  summary: { durationLabel: string; distanceKm: string };
  source: string;
};

type Props = {
  mode: Mode;
  title: string;
  subtitle: string;
  tasks: FieldTask[];
  onRefresh: () => void;
  enableRouteOptimize?: boolean;
};

export function FieldOpsList({
  mode,
  title,
  subtitle,
  tasks,
  onRefresh,
  enableRouteOptimize,
}: Props) {
  const [filter, setFilter] = useState<"all" | FieldTask["status"]>("all");
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [upsellTask, setUpsellTask] = useState<FieldTask | null>(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteOptimizeResult | null>(null);

  const counts = useMemo(() => {
    return {
      done: tasks.filter((t) => t.status === "done").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      pending: tasks.filter((t) => t.status === "pending").length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  async function runRouteOptimize() {
    const addrs = tasks
      .filter((t) => t.status !== "done")
      .map((t) => t.address);
    if (addrs.length < 2) {
      alert(
        "Au moins 2 arrêts « actifs » (non livrés / non récupérés) sont nécessaires.",
      );
      return;
    }
    setRouteLoading(true);
    setRouteData(null);
    try {
      const data = await apiJson<RouteOptimizeResult>("/api/route-optimize", {
        method: "POST",
        body: JSON.stringify({ addresses: addrs }),
      });
      setRouteData(data);
      setRouteOpen(true);
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message.slice(0, 500)
          : "Optimisation impossible (réseau, géocodage ou quota OSRM/Nominatim).",
      );
    } finally {
      setRouteLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="pt-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </header>

      <button
        type="button"
        onClick={() => setMachineModalOpen(true)}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cr-blue)] text-base font-semibold text-white shadow-md shadow-blue-500/25 active:scale-[0.99]"
      >
        <span className="text-xl leading-none">#</span>
        Saisir n° machine
      </button>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Tout"
          count={tasks.length}
        />
        <FilterChip
          active={filter === "done"}
          onClick={() => setFilter("done")}
          label={mode === "livraison" ? "Livrées" : "Fait"}
          count={counts.done}
          tone="green"
        />
        <FilterChip
          active={filter === "in_progress"}
          onClick={() => setFilter("in_progress")}
          label="En cours"
          count={counts.in_progress}
          tone="orange"
        />
        <FilterChip
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
          label="Reste"
          count={counts.pending}
          tone="red"
        />
      </div>

      <ul className="mt-3 flex flex-1 flex-col gap-3">
        {filtered.map((task) => {
          const cfg = statusConfig[mode][task.status];
          const smsBody = terrainSmsBody(
            mode,
            task.clientLabel,
            task.address,
          );
          return (
            <li
              key={task.id}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.className}`}
                >
                  {cfg.label}
                </span>
                {task.qty > 1 ? (
                  <span className="text-sm font-semibold text-zinc-700">
                    ×{task.qty}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-base font-bold text-zinc-900">
                {task.clientLabel}
              </p>
              <a
                href={mapsUrl(task.address)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm leading-snug text-zinc-600 underline decoration-zinc-300 underline-offset-2"
              >
                {task.address}
              </a>
              <a
                href={`tel:${task.phone.replace(/\s/g, "")}`}
                className="mt-1 inline-block text-sm font-medium text-[var(--cr-blue)]"
              >
                {task.phone}
              </a>
              {task.timeNote ? (
                <p className="mt-2 text-xs text-zinc-500">{task.timeNote}</p>
              ) : null}
              {task.extraNote ? (
                <p className="mt-1 text-xs font-medium text-teal-700">
                  {task.extraNote}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {task.status === "pending" || task.status === "in_progress" ? (
                  <a
                    href={mapsUrl(task.address)}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex min-h-[48px] min-w-[88px] items-center justify-center rounded-xl px-4 text-sm font-bold ${
                      task.status === "pending"
                        ? "bg-red-600 text-white"
                        : "bg-[var(--cr-blue)] text-white"
                    }`}
                  >
                    GPS
                  </a>
                ) : null}
                {task.status === "in_progress" ? (
                  <a
                    href={`tel:${task.phone.replace(/\s/g, "")}`}
                    className="inline-flex min-h-[48px] min-w-[88px] items-center justify-center rounded-xl bg-[var(--cr-blue)] px-4 text-sm font-bold text-white"
                  >
                    Appeler
                  </a>
                ) : null}
                {task.status === "pending" || task.status === "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = smsDraftHref(task.phone, smsBody);
                    }}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-600 px-4 text-sm font-bold text-white active:scale-[0.98]"
                  >
                    SMS (brouillon)
                  </button>
                ) : null}
                {task.upsell ? (
                  <button
                    type="button"
                    onClick={() => setUpsellTask(task)}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-bold text-white active:scale-[0.98]"
                  >
                    {task.upsell}
                  </button>
                ) : null}
                {mode === "reprise" &&
                (task.status === "pending" || task.status === "in_progress") ? (
                  <button
                    type="button"
                    onClick={() => setMachineModalOpen(true)}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white"
                  >
                    N° machine
                  </button>
                ) : null}
                {task.status === "in_progress" ? (
                  <CompleteTaskButton
                    taskId={task.id}
                    label={mode === "livraison" ? "Marquer livré" : "Marquer récupéré"}
                    onDone={onRefresh}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {enableRouteOptimize ? (
        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">Optimisation d’itinéraire (OSRM)</p>
          <p className="text-blue-800/90">
            Géocodage Nominatim + ordre de passage via OSRM (public). Prévoir{" "}
            ~1,1 s par adresse pour le géocodage.
          </p>
          <button
            type="button"
            disabled={routeLoading}
            onClick={() => void runRouteOptimize()}
            className="mt-3 min-h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {routeLoading ? "Calcul…" : "Calculer l’ordre de passage"}
          </button>
        </div>
      ) : null}

      {mode === "reprise" ? (
        <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
          <h3 className="text-sm font-bold text-violet-900">
            Processus de reprise
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-violet-950">
            <li>Noter le n° de chaque unité</li>
            <li>Photo</li>
            <li>Note</li>
            <li>Signature</li>
            <li>Valider</li>
          </ol>
        </section>
      ) : null}

      <UpsellOfferModal
        task={upsellTask}
        onClose={() => setUpsellTask(null)}
        onSaved={() => onRefresh()}
      />

      <SimpleModal
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        title="Ordre de passage proposé"
      >
        {routeData ? (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-zinc-500">
              Source : {routeData.source}. Durée routière indicative{" "}
              {routeData.summary.durationLabel}, ~{routeData.summary.distanceKm}{" "}
              km.
            </p>
            <ol className="list-decimal space-y-2 pl-4">
              {routeData.orderedAddresses.map((a, i) => (
                <li key={`${i}-${a}`}>{a}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </SimpleModal>

      <MachineNumberModal
        open={machineModalOpen}
        onClose={() => setMachineModalOpen(false)}
      />
    </div>
  );
}

function UpsellOfferModal({
  task,
  onClose,
  onSaved,
}: {
  task: FieldTask | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = task != null;
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="Proposition commerciale (upsell)"
    >
      {task ? (
        <UpsellFormBody
          key={task.id}
          task={task}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </SimpleModal>
  );
}

function UpsellFormBody({
  task,
  onClose,
  onSaved,
}: {
  task: FieldTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prolong, setProlong] = useState(false);
  const [secondUnit, setSecondUnit] = useState(false);
  const [access, setAccess] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parts = [
      prolong && "Prolongation / reconduction",
      secondUnit && "2e unité sur place",
      access && "Accessoires (goulotte, télécommande…)",
    ].filter(Boolean);
    const line =
      `Upsell — ${task.clientLabel}` +
      (parts.length ? ` — ${parts.join(" · ")}` : "") +
      (note.trim() ? ` — ${note.trim()}` : "");
    setSaving(true);
    try {
      await apiJson(`/api/field-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          extraNote: line,
        }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Upsell noté",
          subtitle: line.slice(0, 200),
          time: "À l’instant",
        }),
      });
      onSaved();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="text-sm font-medium text-zinc-900">{task.clientLabel}</p>
      <p className="mt-1 text-xs text-zinc-500">{task.address}</p>
      <div className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={prolong}
            onChange={(e) => setProlong(e.target.checked)}
            className="mt-1"
          />
          Prolongation ou reconduction de saison
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={secondUnit}
            onChange={(e) => setSecondUnit(e.target.checked)}
            className="mt-1"
          />
          2e clim sur place / unité supplémentaire
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={access}
            onChange={(e) => setAccess(e.target.checked)}
            className="mt-1"
          />
          Accessoires (goulotte, télécommande, etc.)
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-xs font-medium text-zinc-500">Note terrain</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--cr-blue)]"
          placeholder="Ex. client intéressé, rappeler J+2…"
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => void submit()}
        className="mt-4 min-h-12 w-full rounded-xl bg-teal-600 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "…" : "Enregistrer en base"}
      </button>
    </>
  );
}

function CompleteTaskButton({
  taskId,
  label,
  onDone,
}: {
  taskId: string;
  label: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        void (async () => {
          setBusy(true);
          try {
            await apiJson(`/api/field-tasks/${taskId}`, {
              method: "PATCH",
              body: JSON.stringify({
                status: "done",
                timeNote: new Date().toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }),
            });
            await apiJson("/api/activity", {
              method: "POST",
              body: JSON.stringify({
                kind: "ok",
                title: label,
                subtitle: `Tâche ${taskId}`,
                time: "À l’instant",
              }),
            });
            onDone();
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erreur");
          } finally {
            setBusy(false);
          }
        })();
      }}
      className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-zinc-800 bg-white px-4 text-sm font-bold text-zinc-900 disabled:opacity-60"
    >
      {busy ? "…" : label}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "green" | "orange" | "red";
}) {
  const toneRing =
    tone === "green"
      ? "ring-emerald-200"
      : tone === "orange"
        ? "ring-amber-200"
        : tone === "red"
          ? "ring-red-200"
          : "ring-zinc-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition-colors ${
        active
          ? "bg-zinc-900 text-white ring-zinc-900"
          : `bg-white text-zinc-700 ${toneRing} hover:bg-zinc-50`
      }`}
    >
      {label}{" "}
      <span className="opacity-80">({count})</span>
    </button>
  );
}
