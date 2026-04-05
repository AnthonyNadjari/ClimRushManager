"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Hit = { id: string; label: string; href: string; kind: string };

type SearchPayload = {
  machines: Hit[];
  clients: Hit[];
  fieldTasks: Hit[];
  reservations: Hit[];
  maintenance: Hit[];
};

const SECTIONS: { key: keyof SearchPayload; title: string }[] = [
  { key: "machines", title: "Machines" },
  { key: "clients", title: "Clients" },
  { key: "fieldTasks", title: "Livraisons / reprises" },
  { key: "reservations", title: "Réservations" },
  { key: "maintenance", title: "SAV" },
];

export function GlobalSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchPayload | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (query: string) => {
    const t = query.trim();
    if (t.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/search?q=${encodeURIComponent(t)}`,
        { cache: "no-store" },
      );
      if (!r.ok) throw new Error();
      const json = (await r.json()) as SearchPayload;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(q), 280);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const totalHits =
    data == null
      ? 0
      : SECTIONS.reduce((s, x) => s + (data[x.key]?.length ?? 0), 0);

  function go(href: string) {
    setOpen(false);
    setQ("");
    setData(null);
    router.push(href);
  }

  return (
    <div ref={wrapRef} className="relative z-50 pt-2 lg:pt-0">
      <label className="sr-only" htmlFor="global-search">
        Recherche globale
      </label>
      <input
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher partout (n°, client, adresse…)"
        autoComplete="off"
        className="min-h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-900/5 transition-shadow focus:border-[var(--cr-blue)] focus:ring-2 focus:ring-[var(--cr-blue)]/20"
      />
      {open && q.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-2 shadow-xl">
          {loading ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Recherche…</p>
          ) : totalHits === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Aucun résultat</p>
          ) : (
            SECTIONS.map(({ key, title }) => {
              const hits = data?.[key] ?? [];
              if (hits.length === 0) return null;
              return (
                <div key={key} className="border-b border-zinc-100 last:border-0">
                  <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {title}
                  </p>
                  <ul>
                    {hits.map((h) => (
                      <li key={`${key}-${h.id}`}>
                        <button
                          type="button"
                          onClick={() => go(h.href)}
                          className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                        >
                          <span className="mt-0.5 shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">
                            {h.kind}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">
                            {h.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
