"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { ClientRow, ClientStatus, Machine } from "@/lib/types";
import { clientsToCsv, triggerDownload } from "@/lib/csv";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
import { SimpleModal } from "@/components/SimpleModal";
import { clientSmsDraftBody, smsDraftHref } from "@/lib/sms-draft";
import { apiJson } from "@/lib/api-client";

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function ClientsPage() {
  const {
    data: CLIENTS,
    error,
    mutate,
    isLoading,
  } = useSWR<ClientRow[]>("/api/clients", fetcher);

  const { data: ALL_MACHINES, mutate: mutateMachines } = useSWR<Machine[]>(
    "/api/machines",
    fetcher,
  );

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | ClientStatus>("all");
  const [fiche, setFiche] = useState<ClientRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Machine assignment
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMachineIds, setSelectedMachineIds] = useState<Set<string>>(
    new Set(),
  );
  const [assigning, setAssigning] = useState(false);

  const dispoMachines = useMemo(() => {
    if (!ALL_MACHINES) return [];
    return ALL_MACHINES.filter((m) => m.status === "DISPO");
  }, [ALL_MACHINES]);

  const dispoByLot = useMemo(() => {
    const map = new Map<string, Machine[]>();
    for (const m of dispoMachines) {
      const arr = map.get(m.lot) ?? [];
      arr.push(m);
      map.set(m.lot, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [dispoMachines]);

  const filtered = useMemo(() => {
    if (!CLIENTS) return [];
    return CLIENTS.filter((c) => {
      const matchTab = tab === "all" ? true : c.status === tab;
      const qq = q.trim().toLowerCase();
      const matchQ =
        !qq ||
        c.name.toLowerCase().includes(qq) ||
        c.email.toLowerCase().includes(qq) ||
        c.phone.replace(/\s/g, "").includes(qq.replace(/\s/g, ""));
      return matchTab && matchQ;
    });
  }, [CLIENTS, q, tab]);

  const counts = useMemo(() => {
    if (!CLIENTS) return { all: 0, en_cours: 0, a_venir: 0 };
    return {
      all: CLIENTS.length,
      en_cours: CLIENTS.filter((c) => c.status === "en_cours").length,
      a_venir: CLIENTS.filter((c) => c.status === "a_venir").length,
    };
  }, [CLIENTS]);

  function exportCsv() {
    if (!CLIENTS?.length) return;
    const csv = clientsToCsv(CLIENTS);
    triggerDownload(
      `climrush-clients-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
  }

  async function submitAddClient(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      alert("Indiquez au moins le nom du client.");
      return;
    }
    setSaving(true);
    try {
      await apiJson("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: newEmail.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
        }),
      });
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewAddress("");
      void mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function toggleMachine(id: string) {
    setSelectedMachineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitAssign() {
    if (!fiche || selectedMachineIds.size === 0) return;
    setAssigning(true);
    try {
      await apiJson(`/api/clients/${fiche.id}/assign-machines`, {
        method: "POST",
        body: JSON.stringify({ machineIds: Array.from(selectedMachineIds) }),
      });
      setAssignOpen(false);
      setSelectedMachineIds(new Set());
      void mutate();
      void mutateMachines();
      // Refresh fiche data
      const updated = await fetcher<ClientRow[]>("/api/clients");
      const refreshed = updated.find((c) => c.id === fiche.id);
      if (refreshed) setFiche(refreshed);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur assignation");
    } finally {
      setAssigning(false);
    }
  }

  async function unassignMachine(machineId: string) {
    if (!fiche) return;
    if (!confirm(`Désassigner la machine #${machineId} ?`)) return;
    try {
      await apiJson(`/api/clients/${fiche.id}/unassign-machines`, {
        method: "POST",
        body: JSON.stringify({ machineIds: [machineId] }),
      });
      void mutate();
      void mutateMachines();
      const updated = await fetcher<ClientRow[]>("/api/clients");
      const refreshed = updated.find((c) => c.id === fiche.id);
      if (refreshed) setFiche(refreshed);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (error) {
    return <DatabaseErrorCard />;
  }

  if (isLoading || !CLIENTS) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement clients…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
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
            onClick={() => setAddOpen(true)}
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
                {c.address ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {c.address}
                  </p>
                ) : null}
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
                {c.lotSummary ? (
                  <p className="mt-1 text-xs text-zinc-600">{c.lotSummary}</p>
                ) : null}
                {c.machineNumbers.length > 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    N° unités :{" "}
                    <span className="font-medium text-zinc-800">
                      {c.machineNumbers.map((n) => `#${n}`).join(", ")}
                    </span>
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-[var(--cr-blue)]">
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`}>Tel</a>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      window.location.href = smsDraftHref(
                        c.phone,
                        clientSmsDraftBody(c.name),
                      );
                    }}
                  >
                    SMS (brouillon)
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setFiche(c)}
                  >
                    Fiche
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Export CSV — {CLIENTS.length} contacts — données PostgreSQL
      </div>

      {/* Add Client Modal */}
      <SimpleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un client"
      >
        <form onSubmit={submitAddClient} className="space-y-3">
          <p className="text-xs text-zinc-500">Création en base.</p>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Nom</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
              placeholder="Société ou contact"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Email</span>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
              placeholder="contact@exemple.fr"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Téléphone</span>
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
              placeholder="+33…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-500">Adresse</span>
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
              placeholder="12 rue des Archives, 75004 Paris"
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

      {/* Fiche Client Modal */}
      <SimpleModal
        open={fiche != null}
        onClose={() => setFiche(null)}
        title={fiche ? fiche.name : "Client"}
      >
        {fiche ? (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-zinc-500">Données en base PostgreSQL.</p>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-zinc-500">Statut</dt>
                <dd className="font-medium">
                  {fiche.status === "en_cours"
                    ? "En cours"
                    : fiche.status === "a_venir"
                      ? "À venir"
                      : "Inactif"}
                </dd>
              </div>
              {fiche.address ? (
                <div>
                  <dt className="text-xs text-zinc-500">Adresse</dt>
                  <dd>{fiche.address}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-zinc-500">
                  Machines / jours / CA HT
                </dt>
                <dd>
                  {fiche.machines} mach. · {fiche.daysRented} j ·{" "}
                  {fiche.caHt.toLocaleString("fr-FR")} €
                </dd>
              </div>
              {fiche.lotSummary ? (
                <div>
                  <dt className="text-xs text-zinc-500">Lot / regroupement</dt>
                  <dd>{fiche.lotSummary}</dd>
                </div>
              ) : null}

              {/* Assigned machines */}
              <div>
                <dt className="text-xs text-zinc-500">Machines assignées</dt>
                {fiche.machineNumbers.length > 0 ? (
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {fiche.machineNumbers.map((mid) => (
                      <span
                        key={mid}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                      >
                        #{mid}
                        <button
                          type="button"
                          onClick={() => unassignMachine(mid)}
                          className="ml-0.5 text-emerald-600 hover:text-red-600"
                          title="Désassigner"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </dd>
                ) : (
                  <dd className="text-xs text-zinc-400">Aucune</dd>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMachineIds(new Set());
                  setAssignOpen(true);
                }}
                className="min-h-10 w-full rounded-xl border-2 border-[var(--cr-blue)] bg-white text-sm font-semibold text-[var(--cr-blue)]"
              >
                + Assigner des machines
              </button>

              <div>
                <dt className="text-xs text-zinc-500">Email</dt>
                <dd>
                  <a
                    className="text-[var(--cr-blue)] underline"
                    href={`mailto:${fiche.email}`}
                  >
                    {fiche.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Téléphone</dt>
                <dd className="flex flex-wrap gap-2">
                  <a
                    className="font-semibold text-[var(--cr-blue)]"
                    href={`tel:${fiche.phone.replace(/\s/g, "")}`}
                  >
                    Appeler
                  </a>
                  <button
                    type="button"
                    className="font-semibold text-[var(--cr-blue)] underline"
                    onClick={() => {
                      window.location.href = smsDraftHref(
                        fiche.phone,
                        clientSmsDraftBody(fiche.name),
                      );
                    }}
                  >
                    SMS (brouillon)
                  </button>
                </dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = smsDraftHref(
                    fiche.phone,
                    clientSmsDraftBody(fiche.name),
                  );
                }}
                className="min-h-11 w-full rounded-xl bg-slate-600 text-sm font-semibold text-white"
              >
                Ouvrir Messages avec texte prêt
              </button>
              {fiche.alert ? (
                <div className="rounded-lg bg-sky-50 p-2 text-xs">
                  {fiche.alert}
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </SimpleModal>

      {/* Assign Machines Modal */}
      <SimpleModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assigner des machines"
      >
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Sélectionnez les machines disponibles à assigner à{" "}
            <strong>{fiche?.name}</strong>.
          </p>

          {dispoByLot.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">
              Aucune machine disponible
            </p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {dispoByLot.map(([lot, machines]) => (
                <div key={lot}>
                  <p className="mb-1 text-xs font-semibold text-zinc-600">
                    {lot}{" "}
                    <span className="font-normal text-zinc-400">
                      ({machines.length})
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {machines.map((m) => {
                      const sel = selectedMachineIds.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMachine(m.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            sel
                              ? "bg-[var(--cr-blue)] text-white"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          #{m.id}{" "}
                          <span className="text-[10px] opacity-70">
                            {m.model}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMachineIds.size > 0 ? (
            <p className="text-xs text-zinc-600">
              {selectedMachineIds.size} machine
              {selectedMachineIds.size > 1 ? "s" : ""} sélectionnée
              {selectedMachineIds.size > 1 ? "s" : ""}
            </p>
          ) : null}

          <button
            type="button"
            disabled={selectedMachineIds.size === 0 || assigning}
            onClick={submitAssign}
            className="min-h-11 w-full rounded-xl bg-[var(--cr-blue)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {assigning
              ? "…"
              : `Assigner ${selectedMachineIds.size || ""} machine${selectedMachineIds.size > 1 ? "s" : ""}`}
          </button>
        </div>
      </SimpleModal>
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
