import { NextResponse } from "next/server";
import { MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      from?: string;
      to?: string;
      model?: string;
      lot?: string;
      contract?: string;
      clientName?: string;
    };

    const lo = parseInt(body.from ?? "", 10);
    const hi = parseInt(body.to ?? "", 10);
    if (isNaN(lo) || isNaN(hi) || lo > hi || hi - lo > 200) {
      return NextResponse.json(
        { error: "from/to numériques requis (max 200 unités)" },
        { status: 400 },
      );
    }

    const ids = Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i));
    const existing = await prisma.machine.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const existingSet = new Set(existing.map((m) => m.id));
    const toCreate = ids.filter((id) => !existingSet.has(id));

    if (toCreate.length > 0) {
      await prisma.machine.createMany({
        data: toCreate.map((id) => ({
          id,
          model: body.model ?? "12 000 BTU Monobloc",
          lot: body.lot ?? "Stock neuf — IDF",
          status: MachineStatus.DISPO,
          clientName: body.clientName ?? null,
          returnDate: null,
          purchasePriceHt: 175,
          cumulativeRevenueHt: 0,
          contract: body.contract ?? "saison",
          daysRented: 0,
        })),
      });
    }

    return NextResponse.json({
      created: toCreate,
      skipped: ids.filter((id) => existingSet.has(id)),
      total: toCreate.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création lot" }, { status: 500 });
  }
}
