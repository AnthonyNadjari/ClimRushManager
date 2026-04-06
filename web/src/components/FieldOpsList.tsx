"use client";

import { useEffect, useMemo, useState } from "react";
import type { FieldTask } from "@/lib/types";
import { FilterChip } from "./FilterChip";
import { MachineNumberModal } from "./MachineNumberModal";
import { SimpleModal } from "./SimpleModal";
import { apiJson } from "@/lib/api-client";
import { smsDraftHref, terrainSmsBody } from "@/lib/sms-draft";

type Mode = "livraison" | "reprise";

const TRUCK_TABS = ["Tous", "Camion Alex", "Camion Matéo"] as const;

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

function appleMapsUrl(address: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
}

type RouteOptimizeResult = {
  orderedAddresses: string[];
  totalDurationSec: number;
  totalDistanceM: number;
  summary: { durationLabel: string; distanceKm: string };
  source: string;
};

type MultiRouteRow = {
  truckLabel: string;
  skipped: boolean;
  message?: string;
  orderedAddresses: string[];
  summary?: { durationLabel: string; distanceKm: string };
  source?: string;
  single?: boolean;
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
  const [activeTruck, setActiveTruck] = useState<string>("Tous");
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [machineIdsEditTask, setMachineIdsEditTask] =
    useState<FieldTask | null>(null);
  const [recapTask, setRecapTask] = useState<FieldTask | null>(null);
  const [upsellTask, setUpsellTask] = useState<FieldTask | null>(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteOptimizeResult | null>(null);
  const [multiRouteOpen, setMultiRouteOpen] = useState(false);
  const [multiRoutes, setMultiRoutes] = useState<MultiRouteRow[] | null>(null);
  const [truckAssignTask, setTruckAssignTask] = useState<FieldTask | null>(
    null,
  );

  const truckTabs = useMemo(() => {
    const preset = new Set<string>(TRUCK_TABS);
    const extra = new Set<string>();
    for (const t of tasks) {
      if (t.truckLabel && !preset.has(t.truckLabel)) {
        extra.add(t.truckLabel);
      }
    }
    return [...TRUCK_TABS, ...Array.from(extra).sort()];
  }, [tasks]);

  const displayTasks = useMemo(() => {
    const byTruck =
      activeTruck === "Tous"
        ? tasks
        : tasks.filter((t) => (t.truckLabel || "Tous") === activeTruck);
    return byTruck;
  }, [tasks, activeTruck]);

  const counts = useMemo(() => {
    return {
      done: displayTasks.filter((t) => t.status === "done").length,
      in_progress: displayTasks.filter((t) => t.status === "in_progress")
        .length,
      pending: displayTasks.filter((t) => t.status === "pending").length,
    };
  }, [displayTasks]);

  const filtered = useMemo(() => {
    if (filter === "all") return displayTasks;
    return displayTasks.filter((t) => t.status === filter);
  }, [displayTasks, filter]);

  async function runRouteOptimize() {
    if (activeTruck === "Tous") {
      const byTruck = new Map<string, string[]>();
      for (const t of tasks.filter((x) => x.status !== "done")) {
        const k = t.truckLabel || "Tous";
        if (!byTruck.has(k)) byTruck.set(k, []);
        byTruck.get(k)!.push(t.address);
      }
      const groups = Array.from(byTruck.entries()).map(
        ([truckLabel, addresses]) => ({
          truckLabel,
          addresses,
        }),
      );
      if (groups.length === 0) {
        alert("Aucune tâche active à optimiser.");
        return;
      }
      const allSingle = groups.every((g) => g.addresses.length <= 1);
      if (allSingle && groups.some((g) => g.addresses.length === 0)) {
        alert("Ajoutez des arrêts actifs par camion pour l’optimisation.");
        return;
      }
      setRouteLoading(true);
      setMultiRoutes(null);
      try {
        const data = await apiJson<{ routes: MultiRouteRow[] }>(
          "/api/route-optimize",
          {
            method: "POST",
            body: JSON.stringify({ byTruck: groups }),
          },
        );
        setMultiRoutes(data.routes);
        setMultiRouteOpen(true);
      } catch (e) {
        alert(
          e instanceof Error
            ? e.message.slice(0, 500)
            : "Optimisation impossible (réseau, géocodage ou quota).",
        );
      } finally {
        setRouteLoading(false);
      }
      return;
    }

    const addrs = displayTasks
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

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {truckTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTruck(tab)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition-colors ${
              activeTruck === tab
                ? "bg-[var(--cr-blue)] text-white ring-[var(--cr-blue)]"
                : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMachineModalOpen(true)}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cr-blue)] text-base font-semibold text-white shadow-md shadow-blue-500/25 active:scale-[0.99]"
      >
        <span className="text-xl leading-none">#</span>
        Saisir n° machine (vérif. stock)
      </button>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Tout"
          count={displayTasks.length}
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
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.className}`}
                >
                  {cfg.label}
                </span>
                <span className="ml-auto shrink-0 rounded-xl bg-zinc-900 px-3 py-2 text-center text-lg font-black leading-none text-white tabular-nums shadow-sm">
                  {task.qty}
                  <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-90">
                    clim{task.qty > 1 ? "s" : ""}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setRecapTask(task)}
                className="mt-3 w-full text-left text-base font-bold text-zinc-900 underline-offset-2 hover:underline"
              >
                {task.clientLabel}
              </button>
              <a
                href={appleMapsUrl(task.address)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm leading-snug text-sky-700 underline decoration-sky-300 underline-offset-2"
              >
                {task.address}
              </a>
              <a
                href={`tel:${task.phone.replace(/\s/g, "")}`}
                className="mt-1 inline-block text-sm font-medium text-[var(--cr-blue)]"
              >
                {task.phone}
              </a>
              <p className="mt-2 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-800">Camion :</span>{" "}
                {task.truckLabel || "Tous"}
              </p>

              {(task.machineIds.length > 0 ||
                (task.status === "pending" || task.status === "in_progress")) && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    N° unités (camion)
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {task.machineIds.map((id) => (
                      <button
                        key={`${task.id}-${id}`}
                        type="button"
                        onClick={() => setMachineIdsEditTask(task)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white active:scale-[0.98]"
                      >
                        #{id}
                      </button>
                    ))}
                    {(task.status === "pending" ||
                      task.status === "in_progress") && (
                      <button
                        type="button"
                        onClick={() => setMachineIdsEditTask(task)}
                        className="rounded-lg border-2 border-dashed border-emerald-400 px-2.5 py-1 text-xs font-bold text-emerald-800"
                      >
                        + N°
                      </button>
                    )}
                  </div>
                </div>
              )}

              {task.timeNote ? (
                <p className="mt-2 text-xs text-zinc-500">{task.timeNote}</p>
              ) : null}
              {task.extraNote ? (
                <p className="mt-1 text-xs font-medium text-teal-700">
                  {task.extraNote}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTruckAssignTask(task)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white active:scale-[0.98]"
                >
                  Camion
                </button>
                {task.status === "pending" || task.status === "in_progress" ? (
                  <a
                    href={appleMapsUrl(task.address)}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex min-h-[48px] min-w-[88px] items-center justify-center rounded-xl px-4 text-sm font-bold ${
                      task.status === "pending"
                        ? "bg-red-600 text-white"
                        : "bg-[var(--cr-blue)] text-white"
                    }`}
                  >
                    Plans
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
                    Vérifier n° (stock)
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
          <p className="font-semibold">Itinéraire optimisé (OSRM)</p>
          <p className="text-blue-800/90">
            Un passage par camion si « Tous » est sélectionné ; sinon uniquement
            le camion actif. Géocodage Nominatim (~1,1 s / adresse).
          </p>
          <button
            type="button"
            disabled={routeLoading}
            onClick={() => void runRouteOptimize()}
            className="mt-3 min-h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {routeLoading
              ? "Calcul…"
              : activeTruck === "Tous"
                ? "Optimiser tous les camions"
                : "Calculer l’ordre de passage"}
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

      <TaskRecapModal task={recapTask} onClose={() => setRecapTask(null)} />

      <TaskMachineIdsModal
        task={machineIdsEditTask}
        onClose={() => setMachineIdsEditTask(null)}
        onSaved={() => {
          onRefresh();
          setMachineIdsEditTask(null);
        }}
      />

      <TruckAssignModal
        task={truckAssignTask}
        onClose={() => setTruckAssignTask(null)}
        onSaved={() => {
          onRefresh();
          setTruckAssignTask(null);
        }}
      />

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

      <SimpleModal
        open={multiRouteOpen}
        onClose={() => setMultiRouteOpen(false)}
        title="Itinéraires par camion"
      >
        {multiRoutes && multiRoutes.length > 0 ? (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto text-sm">
            {multiRoutes.map((r) => (
              <div
                key={r.truckLabel}
                className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3"
              >
                <p className="font-bold text-zinc-900">{r.truckLabel}</p>
                {r.skipped ? (
                  <p className="mt-1 text-xs text-amber-800">
                    {r.message ?? "Passage non calculé"}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-zinc-500">
                      {r.summary
                        ? `${r.summary.durationLabel} — ~${r.summary.distanceKm} km`
                        : null}
                      {r.source ? ` · ${r.source}` : null}
                    </p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4">
                      {r.orderedAddresses.map((a, i) => (
                        <li key={`${r.truckLabel}-${i}`}>{a}</li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            ))}
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

function TaskRecapModal({
  task,
  onClose,
}: {
  task: FieldTask | null;
  onClose: () => void;
}) {
  const open = task != null;
  const parts = task?.clientLabel.trim().split(/\s+/) ?? [];
  const prenom = parts[0] || "—";
  const nom = parts.slice(1).join(" ") || "—";
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <SimpleModal open={open} onClose={onClose} title="Récap commande">
      {task ? (
        <dl className="space-y-2 text-sm text-zinc-800">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Prénom</dt>
            <dd className="font-semibold">{prenom}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Nom</dt>
            <dd className="font-semibold">{nom}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Adresse</dt>
            <dd>{task.address}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Téléphone</dt>
            <dd>
              <a
                className="text-[var(--cr-blue)]"
                href={`tel:${task.phone.replace(/\s/g, "")}`}
              >
                {task.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Date (jour)</dt>
            <dd>{today}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Nb clim</dt>
            <dd className="text-lg font-bold">{task.qty}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Upsell</dt>
            <dd>{task.upsell ?? task.extraNote ?? "—"}</dd>
          </div>
        </dl>
      ) : null}
    </SimpleModal>
  );
}

function TruckAssignModal({
  task,
  onClose,
  onSaved,
}: {
  task: FieldTask | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = task != null;
  const presets = ["Tous", "Camion Alex", "Camion Matéo"] as const;
  const [pick, setPick] = useState<(typeof presets)[number]>("Tous");
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task || !open) return;
    const t = task.truckLabel || "Tous";
    if ((presets as readonly string[]).includes(t)) {
      setPick(t as (typeof presets)[number]);
      setCustom("");
    } else {
      setPick("Tous");
      setCustom(t);
    }
  }, [task, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    const label = custom.trim() || pick;
    setSaving(true);
    try {
      await apiJson(`/api/field-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ truckLabel: label }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "Camion assigné",
          subtitle: `${task.clientLabel} → ${label}`,
          time: "À l’instant",
        }),
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleModal open={open} onClose={onClose} title="Attribuer un camion">
      {task ? (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-zinc-500">
            Rattachez la commande à un camion pour filtrer les tournées et
            l’optimisation d’itinéraire.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Camion</span>
            <select
              value={pick}
              onChange={(e) => {
                setPick(e.target.value as (typeof presets)[number]);
                setCustom("");
              }}
              className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none focus:border-[var(--cr-blue)]"
            >
              {presets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">
              Nom personnalisé (remplace le choix ci-dessus si rempli)
            </span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="ex. Camion Nord, Camion 2…"
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-[var(--cr-blue)]"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "…" : "Enregistrer"}
          </button>
        </form>
      ) : null}
    </SimpleModal>
  );
}

function TaskMachineIdsModal({
  task,
  onClose,
  onSaved,
}: {
  task: FieldTask | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = task != null;
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task && open) setRaw(task.machineIds.join(", "));
  }, [task, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    const ids = raw
      .split(/[,;\s]+/)
      .map((s) => s.replace(/^#/, "").trim())
      .filter(Boolean);
    setSaving(true);
    try {
      await apiJson(`/api/field-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ machineIds: ids }),
      });
      await apiJson("/api/activity", {
        method: "POST",
        body: JSON.stringify({
          kind: "ok",
          title: "N° machines terrain",
          subtitle: `${task.clientLabel} — ${ids.map((i) => `#${i}`).join(", ") || "aucun"}`,
          time: "À l’instant",
        }),
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="Numéros de machines (livraison / reprise)"
    >
      {task ? (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-zinc-500">
            Saisissez plusieurs numéros séparés par une virgule ou un espace.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">N° unités</span>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--cr-blue)]"
              placeholder="ex. 12, 198, 302"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "…" : "Enregistrer"}
          </button>
        </form>
      ) : null}
    </SimpleModal>
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

