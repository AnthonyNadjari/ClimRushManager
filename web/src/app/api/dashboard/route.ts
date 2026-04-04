import { NextResponse } from "next/server";
import { FieldMode, FieldTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeActivity, serializeMachine } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [machines, tasks, activities] = await Promise.all([
      prisma.machine.findMany(),
      prisma.fieldTask.findMany(),
      prisma.activity.findMany({
        orderBy: { sortOrder: "asc" },
        take: 12,
      }),
    ]);

    const stockTotal = machines.length;
    const dispo = machines.filter((m) => m.status === "DISPO").length;
    const louees = machines.filter((m) => m.status === "LOUE").length;
    const sav = machines.filter((m) => m.status === "SAV").length;
    const amorties = machines.filter(
      (m) => serializeMachine(m).amortized,
    ).length;

    const livTasks = tasks.filter((t) => t.mode === FieldMode.livraison);
    const repTasks = tasks.filter((t) => t.mode === FieldMode.reprise);
    const livraisonsTotal = livTasks.length;
    const livraisonsRestantes = livTasks.filter(
      (t) => t.status !== FieldTaskStatus.done,
    ).length;
    const reprises = repTasks.length;

    const caSaisonHt = Math.round(
      machines.reduce((s, m) => s + m.cumulativeRevenueHt, 0),
    );
    const objectifCaHt = 262_500;
    const caJourHt = Math.max(1, Math.round(caSaisonHt / 110));

    const kpi = {
      caJourHt,
      caJourRentals: Math.min(8, livraisonsRestantes + 1),
      dispo,
      stockTotal,
      louees,
      livraisonsTotal,
      livraisonsRestantes,
      reprises,
      sav,
      amorties,
      objectifCaHt,
      caSaisonHt,
      marketplaceVentes: 12,
      marketplaceMontantHt: 18_400,
    };

    return NextResponse.json({
      kpi,
      activity: activities.map(serializeActivity),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Base indisponible. Vérifiez DATABASE_URL." },
      { status: 503 },
    );
  }
}
