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
      rental?: {
        client?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
      } | null;
    };
    const id = body.id?.replace(/^#/, "").trim();
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }
    const exists = await prisma.machine.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: "Ce n° existe déjà" }, { status: 409 });
    }

    let status: MachineStatus = body.status ?? MachineStatus.DISPO;
    let clientName: string | null = null;
    let returnDate: string | null = null;
    let contract = body.contract ?? "saison";

    const rental = body.rental;
    const rentalEnd = rental?.endDate ? new Date(rental.endDate) : null;
    const rentalStart = rental?.startDate ? new Date(rental.startDate) : null;
    if (rental && rentalEnd && !isNaN(rentalEnd.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inFuture =
        rentalStart && !isNaN(rentalStart.getTime()) && rentalStart > today;
      status = inFuture ? MachineStatus.RESA : MachineStatus.LOUE;
      clientName = rental.client?.trim() || null;
      returnDate = formatFrDate(rentalEnd);
      if (rental.type) contract = rental.type;
    }

    const row = await prisma.machine.create({
      data: {
        id,
        model: body.model ?? "12 000 BTU Monobloc",
        lot: body.lot ?? "Stock neuf — IDF",
        status,
        clientName,
        returnDate,
        purchasePriceHt: 175,
        cumulativeRevenueHt: 0,
        contract,
        daysRented: 0,
      },
    });

    if (rental && rentalEnd && !isNaN(rentalEnd.getTime())) {
      await prisma.reservation.create({
        data: {
          date: rentalStart ?? new Date(),
          endDate: rentalEnd,
          client: rental.client?.trim() ?? "",
          machines: 1,
          type: contract,
          model: row.model,
        },
      });
    }

    return NextResponse.json(serializeMachine(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}

function formatFrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
