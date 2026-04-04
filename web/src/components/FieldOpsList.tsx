"use client";

import { useMemo, useState } from "react";
import type { FieldTask } from "@/lib/types";
import { ScannerModal } from "./ScannerModal";
import { getMachineById } from "@/lib/machine-lookup";
import { parseScannedMachinePayload } from "@/lib/qr-payload";

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

type Props = {
  mode: Mode;
  title: string;
  subtitle: string;
  tasks: FieldTask[];
  routeBanner?: { stops: number; duration: string };
};

export function FieldOpsList({
  mode,
  title,
  subtitle,
  tasks,
  routeBanner,
}: Props) {
  const [filter, setFilter] = useState<"all" | FieldTask["status"]>("all");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanSession, setScanSession] = useState(0);

  function openScanner() {
    setScanSession((s) => s + 1);
    setScanOpen(true);
  }

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
        onClick={openScanner}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cr-blue)] text-base font-semibold text-white shadow-md shadow-blue-500/25 active:scale-[0.99]"
      >
        <span className="text-xl leading-none">+</span>
        Scanner
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
                {task.upsell ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-bold text-white"
                  >
                    {task.upsell}
                  </button>
                ) : null}
                {mode === "reprise" &&
                (task.status === "pending" || task.status === "in_progress") ? (
                  <button
                    type="button"
                    onClick={openScanner}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white"
                  >
                    Scanner
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {routeBanner ? (
        <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">Optimisation trajet active</p>
          <p className="text-blue-800/90">
            {routeBanner.stops} arrêts — ~{routeBanner.duration} de tournée
          </p>
        </div>
      ) : null}

      {mode === "reprise" ? (
        <section className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
          <h3 className="text-sm font-bold text-violet-900">
            Processus de reprise
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-violet-950">
            <li>Scan QR</li>
            <li>Photo</li>
            <li>Note</li>
            <li>Signature</li>
            <li>Valider</li>
          </ol>
        </section>
      ) : null}

      <ScannerModal
        key={scanSession}
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(text) => {
          const id = parseScannedMachinePayload(text);
          const m = id ? getMachineById(id) : undefined;
          if (id && m) {
            alert(
              `Machine #${m.id} — ${m.model}\nStatut : ${m.status}\n(Phase 1 — pas de sync serveur)`,
            );
            return;
          }
          if (id) {
            alert(
              `ID reconnu : #${id}\nMachine absente des données démo — ajoutez-la dans l’inventaire.\n\nBrut : ${text}`,
            );
            return;
          }
          alert(
            `Lecture : ${text}\n\nFormat attendu : URL …/m/12 ou CLIMRUSH|M|12 ou numéro d’unité.`,
          );
        }}
      />
    </div>
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
