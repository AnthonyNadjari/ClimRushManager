"use client";

import { useMemo, useState } from "react";
import { MACHINES } from "@/lib/data";
import { MachineQrTile } from "@/components/MachineQrTile";
import { machineQrPayload } from "@/lib/qr-payload";
import { sortedUniqueLots } from "@/lib/machines-lots";
import { downloadQrZipForMachines } from "@/lib/qr-zip";
import type { Machine } from "@/lib/types";

export default function CodesQrPage() {
  const [q, setQ] = useState("");
  const [lotFilter, setLotFilter] = useState<string>("all");
  const [zipping, setZipping] = useState(false);

  const usesUrl = Boolean(
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
      process.env.NEXT_PUBLIC_APP_URL.length > 0,
  );

  const lots = useMemo(() => sortedUniqueLots(MACHINES), []);

  const countByLot = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of MACHINES) {
      m.set(x.lot, (m.get(x.lot) ?? 0) + 1);
    }
    return m;
  }, []);

  const filtered = useMemo(() => {
    let list: Machine[] = MACHINES;
    if (lotFilter !== "all") {
      list = list.filter((m) => m.lot === lotFilter);
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (m) =>
          m.id.includes(qq.replace("#", "")) ||
          m.model.toLowerCase().includes(qq) ||
          m.lot.toLowerCase().includes(qq),
      );
    }
    return list;
  }, [q, lotFilter]);

  const sections = useMemo(() => {
    const map = new Map<string, Machine[]>();
    for (const m of filtered) {
      const arr = map.get(m.lot) ?? [];
      arr.push(m);
      map.set(m.lot, arr);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "fr"))
      .map(([lot, items]) => ({
        lot,
        items: items.sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true }),
        ),
      }));
  }, [filtered]);

  const examplePayload = machineQrPayload(MACHINES[0]?.id ?? "12");

  async function handleZip() {
    if (filtered.length === 0) return;
    setZipping(true);
    try {
      const name =
        lotFilter === "all" && !q.trim()
          ? `climrush-qr-tout-${filtered.length}`
          : lotFilter !== "all"
            ? `climrush-qr-${lotFilter}`
            : `climrush-qr-selection-${filtered.length}`;
      await downloadQrZipForMachines(filtered, name);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="pt-3 print:hidden lg:pt-0">
        <h1 className="font-serif text-2xl font-bold text-zinc-900 lg:text-3xl">
          Codes QR machines
        </h1>
        <p className="mt-1 text-sm text-zinc-500 lg:text-base">
          Un QR = <strong>une machine</strong> (son n°). Les <strong>lots</strong> servent
          seulement à filtrer, imprimer ou télécharger un groupe.
        </p>
      </header>

      <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-950 shadow-sm print:hidden lg:mt-6 lg:p-5">
        <h2 className="font-semibold text-emerald-900">
          Générer les QR — en 3 étapes
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4">
          <li>
            Chaque machine a un <strong>ID unique</strong> (#12, #47…). Tu ne
            « crées » pas le QR à la main : l’app le{" "}
            <strong>calcule automatiquement</strong> à partir de cet ID (texte{" "}
            <code className="rounded bg-white/80 px-1">CLIMRUSH|M|12</code> ou lien{" "}
            <code className="rounded bg-white/80 px-1">…/m/12</code> si{" "}
            <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_APP_URL</code>{" "}
            est défini sur Vercel).
          </li>
          <li>
            Un <strong>lot</strong> = étiquette de groupe (ex. « Tournée Paris », «
            Stock neuf »). Ça ne change pas le QR : ça t’aide à{" "}
            <strong>voir / imprimer / ZIP</strong> seulement certaines machines.
          </li>
          <li>
            <strong>PNG</strong> : bouton sous chaque carte.{" "}
            <strong>Planche</strong> : « Imprimer la planche » (ce qui est affiché
            après filtres). <strong>ZIP</strong> : tous les PNG du filtre actuel,
            rangés par dossier de lot.
          </li>
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 text-sm text-zinc-700 shadow-sm print:hidden lg:p-5">
        <h2 className="font-semibold text-zinc-900">Détail technique</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 lg:columns-2 lg:gap-8">
          <li className="break-inside-avoid">
            {usesUrl ? (
              <>
                QR = URL <code className="rounded bg-zinc-100 px-1">/m/[id]</code>{" "}
                (via{" "}
                <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_APP_URL</code>
                ).
              </>
            ) : (
              <>
                QR = texte{" "}
                <code className="rounded bg-zinc-100 px-1">CLIMRUSH|M|#</code>{" "}
                (ex.{" "}
                <code className="rounded bg-zinc-100 px-1">{examplePayload}</code>
                ).
              </>
            )}
          </li>
          <li className="break-inside-avoid">
            Scanner livraisons / reprises : URL,{" "}
            <code className="rounded bg-zinc-100 px-1">CLIMRUSH|M|…</code> ou n°
            seul.
          </li>
        </ul>
      </section>

      <div className="mt-4 print:hidden lg:mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          Filtrer par lot
        </p>
        <div className="flex flex-wrap gap-2">
          <LotPill
            active={lotFilter === "all"}
            onClick={() => setLotFilter("all")}
            label={`Tous (${MACHINES.length})`}
          />
          {lots.map((lot) => (
            <LotPill
              key={lot}
              active={lotFilter === lot}
              onClick={() => setLotFilter(lot)}
              label={`${lot} (${countByLot.get(lot) ?? 0})`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center print:hidden lg:mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche n°, modèle ou nom de lot…"
          className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-[var(--cr-blue)] sm:max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-12 rounded-xl bg-[var(--cr-blue)] px-5 text-sm font-semibold text-white"
          >
            Imprimer la planche
          </button>
          <button
            type="button"
            onClick={() => void handleZip()}
            disabled={filtered.length === 0 || zipping}
            className="min-h-12 rounded-xl border-2 border-zinc-900 bg-white px-5 text-sm font-semibold text-zinc-900 disabled:opacity-40"
          >
            {zipping ? "ZIP…" : `ZIP (${filtered.length})`}
          </button>
        </div>
      </div>

      <p className="mt-6 hidden text-center font-serif text-lg font-bold text-zinc-900 print:block">
        ClimRush — étiquettes ({filtered.length} machine
        {filtered.length > 1 ? "s" : ""}
        {lotFilter !== "all" ? ` — ${lotFilter}` : ""})
      </p>

      <div className="mt-6 space-y-10 print:space-y-6">
        {sections.map(({ lot, items }) => (
          <section key={lot} className="print:break-inside-avoid">
            <h2 className="mb-4 border-b border-zinc-200 pb-2 font-serif text-lg font-bold text-zinc-800 print:text-base">
              {lot}
              <span className="ml-2 font-sans text-sm font-normal text-zinc-500">
                ({items.length})
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 print:grid-cols-3 print:gap-4">
              {items.map((m) => (
                <MachineQrTile key={m.id} id={m.id} model={m.model} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500 print:hidden">
          Aucune machine ne correspond aux filtres.
        </p>
      ) : null}
    </div>
  );
}

function LotPill({
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
      className={`max-w-full truncate rounded-full px-3.5 py-2 text-left text-sm font-semibold ring-1 transition-colors ${
        active
          ? "bg-zinc-900 text-white ring-zinc-900"
          : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
      }`}
      title={label}
    >
      {label}
    </button>
  );
}
