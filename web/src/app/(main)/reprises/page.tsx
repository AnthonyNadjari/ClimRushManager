import { KPI, PICKUPS } from "@/lib/data";
import { FieldOpsList } from "@/components/FieldOpsList";

export default function ReprisesPage() {
  return (
    <FieldOpsList
      mode="reprise"
      title="Reprises"
      subtitle={`Aujourd’hui — ${KPI.reprises} planifiées`}
      tasks={PICKUPS}
    />
  );
}
