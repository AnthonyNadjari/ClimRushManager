"use client";

import { useState } from "react";
import { SimpleModal } from "./SimpleModal";
import { apiJson } from "@/lib/api-client";
import type { Machine } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  onMachineVerified?: () => void;
};

export function MachineNumberModal({
  open,
  onClose,
  title = "Saisir le n° de machine",
  onMachineVerified,
}: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = value.replace(/^#/, "").trim();
    if (!id) {
      alert("Indiquez le numéro d’unité (ex. 12 ou #12).");
      return;
    }
    setLoading(true);
    try {
      const m = await apiJson<Machine>(`/api/machines/${encodeURIComponent(id)}`);
      alert(
        `Machine #${m.id} — ${m.model}\nStatut : ${m.status}\nLot : ${m.lot}`,
      );
      setValue("");
      onMachineVerified?.();
      onClose();
    } catch {
      alert(
        `Aucune machine #${id} en base.\n\nVérifiez le numéro ou créez l’unité dans l’inventaire.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SimpleModal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-zinc-500">
          Chaque clim a un <strong>numéro d’unité</strong> unique (stocké en base).
        </p>
        <label className="block">
          <span className="text-xs font-medium text-zinc-500">N° machine</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ex. 47 ou #47"
            inputMode="numeric"
            autoComplete="off"
            disabled={loading}
            className="mt-1 min-h-12 w-full rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-xl bg-[var(--cr-blue)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "Vérifier en base"}
        </button>
      </form>
    </SimpleModal>
  );
}
