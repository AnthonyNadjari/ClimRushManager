"use client";

import useSWR from "swr";
import { FieldOpsList } from "@/components/FieldOpsList";
import type { FieldTask } from "@/lib/types";

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function ReprisesPage() {
  const { data: tasks, error, mutate, isLoading } = useSWR<FieldTask[]>(
    "/api/field-tasks?mode=reprise",
    fetcher,
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold">Base de données inaccessible</p>
        <p className="mt-1">
          Vérifiez <code className="rounded bg-white/80 px-1">DATABASE_URL</code>{" "}
          et les migrations Prisma.
        </p>
      </div>
    );
  }

  if (isLoading || !tasks) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement des reprises…
      </div>
    );
  }

  return (
    <FieldOpsList
      mode="reprise"
      title="Reprises"
      subtitle={`Aujourd’hui — ${tasks.length} planifiées`}
      tasks={tasks}
      onRefresh={() => void mutate()}
    />
  );
}
