import { NextResponse } from "next/server";
import { MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeMachine } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.machine.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(rows.map(serializeMachine));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Base indisponible. Vérifiez DATABASE_URL." },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id: string;
      model?: string;
      lot?: string;
      status?: MachineStatus;
      contract?: string;
    };
    const id = body.id?.replace(/^#/, "").trim();
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }
    const exists = await prisma.machine.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: "Ce n° existe déjà" }, { status: 409 });
    }
    const row = await prisma.machine.create({
      data: {
        id,
        model: body.model ?? "12 000 BTU Monobloc",
        lot: body.lot ?? "Stock neuf — IDF",
        status: body.status ?? MachineStatus.DISPO,
        clientName: null,
        returnDate: null,
        purchasePriceHt: 175,
        cumulativeRevenueHt: 0,
        contract: body.contract ?? "saison",
        daysRented: 0,
      },
    });
    return NextResponse.json(serializeMachine(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
