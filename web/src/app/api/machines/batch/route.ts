import { NextResponse } from "next/server";
import { MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Garde-fou anti-insertion géante accidentelle (mémoire / fonction serverless),
// suffisamment haut pour ne jamais gêner un usage normal.
const MAX_UNITS = 10000;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      from?: string;
      to?: string;
      exclude?: string[];
      ids?: string[];
      model?: string;
      lot?: string;
      contract?: string;
    };

    let ids: string[];

    if (body.ids && body.ids.length > 0) {
      // List mode: explicit IDs
      ids = body.ids.map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ error: "Liste vide" }, { status: 400 });
      }
      if (ids.length > MAX_UNITS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_UNITS} unités par requête` },
          { status: 400 },
        );
      }
    } else {
      // Range mode: from/to with optional exclusions
      const lo = parseInt(body.from ?? "", 10);
      const hi = parseInt(body.to ?? "", 10);
      if (isNaN(lo) || isNaN(hi) || lo > hi || hi - lo + 1 > MAX_UNITS) {
        return NextResponse.json(
          { error: `from/to numériques requis (max ${MAX_UNITS} unités)` },
          { status: 400 },
        );
      }
      const excludeSet = new Set(body.exclude?.map((s) => s.trim()) ?? []);
      ids = Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i)).filter(
        (id) => !excludeSet.has(id),
      );
    }

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
          clientName: null,
          clientId: null,
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
