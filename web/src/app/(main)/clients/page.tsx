"use client";

import { useMemo, useState } from "react";
import { CLIENTS } from "@/lib/data";
import type { ClientStatus } from "@/lib/types";
import { clientsToCsv, triggerDownload } from "@/lib/csv";

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | ClientStatus>("all");

  const filtered = useMemo(() => {
    return CLIENTS.filter((c) => {
      const matchTab =
        tab === "all" ? true : c.status === tab;
      const qq = q.trim().toLowerCase();
      const matchQ =
        !qq ||
        c.name.toLowerCase().includes(qq) ||
        c.email.toLowerCase().includes(qq) ||
        c.phone.replace(/\s/g, "").includes(qq.replace(/\s/g, ""));
      return matchTab && matchQ;
    });
  }, [q, tab]);

  const counts = useMemo(() => {
    return {
      all: CLIENTS.length,
      en_cours: CLIENTS.filter((c) => c.status === "en_cours").length,
      a_venir: CLIENTS.filter((c) => c.status === "a_venir").length,
    };
  }, []);

  function exportCsv() {
    const csv = clientsToCsv(CLIENTS);
    triggerDownload(
      `climrush-clients-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-2">
      <header className="flex flex-wrap items-start justify-between gap-2 pt-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Clients
          </h1>
          <p className="text-sm text-zinc-500">
            {CLIENTS.length} clients — Été 2026
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border-2 border-emerald-600 bg-white px-3 py-2 text-xs font-semibold text-emerald-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="rounded-xl bg-[var(--cr-blue)] px-3 py-2 text-sm font-semibold text-white"
          >
            + Ajouter
          </button>
        </div>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un client…"
        className="mt-4 min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-[var(--cr-blue)]"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Tab
          active={tab === "all"}
          onClick={() => setTab("all")}
          label={`Tous (${counts.all})`}
        />
        <Tab
          active={tab === "en_cours"}
          onClick={() => setTab("en_cours")}
          label={`En cours (${counts.en_cours})`}
        />
        <Tab
          active={tab === "a_venir"}
          onClick={() => setTab("a_venir")}
          label={`À venir (${counts.a_venir})`}
        />
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-800">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-zinc-900">{c.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      c.status === "en_cours"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "a_venir"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {c.status === "en_cours"
                      ? "EN COURS"
                      : c.status === "a_venir"
                        ? "À VENIR"
                        : "INACTIF"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Metric label="Machines" value={`${c.machines}`} />
                  <Metric label="Jours loués" value={`${c.daysRented}j`} />
                  <div>
                    <p className="text-xs text-zinc-500">CA HT</p>
                    <p className="font-semibold text-[var(--cr-blue)]">
                      {c.caHt.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                  <div>
                    {c.alert ? (
                      <p className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-900">
                        {c.alert}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400">—</p>
                    )}
                  </div>
                </div>
                <p className="mt-2 truncate text-xs text-zinc-500">{c.email}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-[var(--cr-blue)]">
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`}>Tel</a>
                  <a href={`sms:${c.phone.replace(/\s/g, "")}`}>SMS</a>
                  <button type="button" className="underline">
                    Fiche
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Export CSV disponible — {CLIENTS.length} contacts — Tel + Email —
        Campagnes canicule
      </div>
    </div>
  );
}

function Tab({
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
