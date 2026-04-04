import { DELIVERIES, KPI } from "@/lib/data";
import { FieldOpsList } from "@/components/FieldOpsList";

export default function LivraisonsPage() {
  const done = DELIVERIES.filter((t) => t.status === "done").length;
  const prog = DELIVERIES.filter((t) => t.status === "in_progress").length;
  const pend = DELIVERIES.filter((t) => t.status === "pending").length;

  return (
    <FieldOpsList
      mode="livraison"
      title="Livraisons"
      subtitle={`Aujourd’hui — ${KPI.livraisonsTotal} planifiées (${done} livrées · ${prog} en cours · ${pend} restantes)`}
      tasks={DELIVERIES}
      routeBanner={{ stops: 8, duration: "2 h 30" }}
    />
  );
}
