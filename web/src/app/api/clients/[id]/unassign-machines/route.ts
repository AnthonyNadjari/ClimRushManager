import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: clientId } = await ctx.params;
    const body = (await req.json()) as { machineIds?: string[] };
    const machineIds = body.machineIds?.filter(Boolean) ?? [];
    if (machineIds.length === 0) {
      return NextResponse.json({ error: "machineIds requis" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const max = await prisma.activity.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (max._max.sortOrder ?? 0) + 1;

    await prisma.$transaction([
      ...machineIds.map((mid) =>
        prisma.machine.update({
          where: { id: mid },
          data: {
            clientId: null,
            clientName: null,
            status: MachineStatus.DISPO,
            returnDate: null,
          },
        }),
      ),
      prisma.activity.create({
        data: {
          id: `a_${randomUUID().slice(0, 12)}`,
          kind: "ret",
          title: "Machines désassignées",
          subtitle: `${machineIds.length} unités retirées de ${client.name}`,
          time: "À l'instant",
          sortOrder,
        },
      }),
    ]);

    return NextResponse.json({ unassigned: machineIds, client: client.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur désassignation" }, { status: 500 });
  }
}
