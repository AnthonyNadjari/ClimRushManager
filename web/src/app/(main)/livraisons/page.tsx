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

export default function LivraisonsPage() {
  const { data: tasks, error, mutate, isLoading } = useSWR<FieldTask[]>(
    "/api/field-tasks?mode=livraison",
    fetcher,
  );

  if (error) {
    return <DatabaseErrorCard />;
  }

  if (isLoading || !tasks) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-zinc-500">
        Chargement des livraisons…
      </div>
    );
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const prog = tasks.filter((t) => t.status === "in_progress").length;
  const pend = tasks.filter((t) => t.status === "pending").length;

  return (
    <FieldOpsList
      mode="livraison"
      title="Livraisons"
      subtitle={`Aujourd’hui — ${tasks.length} planifiées (${done} livrées · ${prog} en cours · ${pend} restantes)`}
      tasks={tasks}
      onRefresh={() => void mutate()}
      enableRouteOptimize
    />
  );
}
