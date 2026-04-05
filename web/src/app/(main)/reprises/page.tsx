"use client";

import useSWR from "swr";
import { DatabaseErrorCard } from "@/components/DatabaseErrorCard";
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
    return <DatabaseErrorCard />;
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
