"use client";

import { useMemo, useState } from "react";
import { MACHINES } from "@/lib/data";
import { MachineQrTile } from "@/components/MachineQrTile";
import { machineQrPayload } from "@/lib/qr-payload";

export default function CodesQrPage() {
  const [q, setQ] = useState("");
  const usesUrl = Boolean(
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
      process.env.NEXT_PUBLIC_APP_URL.length > 0,
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return MACHINES;
    return MACHINES.filter(
      (m) =>
        m.id.includes(qq.replace("#", "")) ||
        m.model.toLowerCase().includes(qq),
    );
  }, [q]);

  const examplePayload = machineQrPayload(MACHINES[0]?.id ?? "12");

  return (
    <div className="flex flex-1 flex-col pb-2">
      <header className="pt-3 print:hidden lg:pt-0">
        <h1 className="font-serif text-2xl font-bold text-zinc-900 lg:text-3xl">
          Codes QR machines
        </h1>
        <p className="mt-1 text-sm text-zinc-500 lg:text-base">
          Impression ou PNG par unité — même contenu que le scanner terrain.
        </p>
      </header>

      <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 text-sm text-zinc-700 shadow-sm print:hidden lg:mt-6 lg:p-5">
        <h2 className="font-semibold text-zinc-900">Comment ça marche</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 lg:columns-2 lg:gap-8">
          <li className="break-inside-avoid">
            {usesUrl ? (
              <>
                Les QR pointent vers l’URL publique de l’app +{" "}
                <code className="rounded bg-zinc-100 px-1">/m/[id]</code>{" "}
                (définie via{" "}
                <code className="rounded bg-zinc-100 px-1">
                  NEXT_PUBLIC_APP_URL
                </code>{" "}
                sur Vercel).
              </>
            ) : (
              <>
                Sans variable d’environnement, le QR contient le texte stable{" "}
                <code className="rounded bg-zinc-100 px-1">CLIMRUSH|M|#</code>{" "}
                (exemple :{" "}
                <code className="rounded bg-zinc-100 px-1">{examplePayload}</code>
                ).
              </>
            )}
          </li>
          <li className="break-inside-avoid">
            Livraisons / reprises : le scanner reconnaît URL,{" "}
            <code className="rounded bg-zinc-100 px-1">CLIMRUSH|M|…</code> ou un
            simple numéro d’unité.
          </li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500 lg:mt-4">
          Astuce prod : définir{" "}
          <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_APP_URL</code>{" "}
          = URL du site (sans slash final), puis redéployer pour régénérer des QR
          en liens cliquables.
        </p>
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center print:hidden lg:mt-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrer par n° ou modèle…"
          className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-[var(--cr-blue)] sm:max-w-md"
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-12 shrink-0 rounded-xl bg-[var(--cr-blue)] px-6 text-sm font-semibold text-white"
        >
          Imprimer la planche
        </button>
      </div>

      <p className="mt-6 hidden text-center font-serif text-lg font-bold text-zinc-900 print:block">
        ClimRush — étiquettes machines ({filtered.length})
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 print:grid-cols-3 print:gap-4">
        {filtered.map((m) => (
          <MachineQrTile key={m.id} id={m.id} model={m.model} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500 print:hidden">
          Aucune machine ne correspond au filtre.
        </p>
      ) : null}
    </div>
  );
}
