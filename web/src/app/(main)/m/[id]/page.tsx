import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { serializeMachine } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const statusFr: Record<string, string> = {
  DISPO: "Disponible",
  LOUE: "Louée",
  RESA: "Réservée",
  LIV: "En livraison",
  SAV: "Maintenance",
};

export default async function MachinePublicPage({ params }: Props) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw).replace(/^#/, "").trim();
  const row = await prisma.machine.findUnique({ where: { id } });
  if (!row) notFound();
  const m = serializeMachine(row);

  return (
    <div className="flex flex-1 flex-col pb-6 pt-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
        Machine
      </p>
      <h1 className="font-serif text-3xl font-bold text-zinc-900">#{m.id}</h1>
      <p className="mt-1 text-lg text-zinc-700">{m.model}</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <Row label="Lot" value={m.lot} />
        <Row label="Statut" value={statusFr[m.status] ?? m.status} />
        <Row label="Client" value={m.clientName ?? "—"} />
        <Row label="Retour prévu" value={m.returnDate ?? "—"} />
        <Row label="Amortissement" value={m.amortLabel} />
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Fiche machine — données PostgreSQL (Prisma).
      </p>

      <Link
        href="/machines"
        className="mt-4 block min-h-12 rounded-2xl bg-[var(--cr-blue)] py-3 text-center text-sm font-semibold text-white"
      >
        Voir l’inventaire
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="text-base font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
