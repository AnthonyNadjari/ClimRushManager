import { NextResponse } from "next/server";
import { Prisma, MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeMachine } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id: raw } = await ctx.params;
    const id = decodeURIComponent(raw).replace(/^#/, "").trim();
    const row = await prisma.machine.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }
    return NextResponse.json(serializeMachine(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id: raw } = await ctx.params;
    const id = decodeURIComponent(raw).replace(/^#/, "").trim();
    const body = (await req.json()) as Partial<{
      status: MachineStatus;
      clientName: string | null;
      returnDate: string | null;
      lot: string;
      model: string;
      cumulativeRevenueHt: number;
      daysRented: number;
    }>;

    const data: Record<string, unknown> = {};
    if (body.status != null) {
      data.status = body.status;
      if (body.status === MachineStatus.DISPO) {
        if (body.clientName === undefined) data.clientName = null;
        if (body.returnDate === undefined) data.returnDate = null;
        data.clientId = null;
      }
    }
    if (body.clientName !== undefined) data.clientName = body.clientName;
    if (body.returnDate !== undefined) data.returnDate = body.returnDate;
    if (body.lot != null) data.lot = body.lot;
    if (body.model != null) data.model = body.model;
    if (body.cumulativeRevenueHt != null)
      data.cumulativeRevenueHt = body.cumulativeRevenueHt;
    if (body.daysRented != null) data.daysRented = body.daysRented;

    const row = await prisma.machine.update({
      where: { id },
      data,
    });
    return NextResponse.json(serializeMachine(row));
  } catch (e) {
    console.error(e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Machine non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}
