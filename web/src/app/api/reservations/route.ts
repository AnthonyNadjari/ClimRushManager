import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { error: "from et to (ISO date) requis" },
        { status: 400 },
      );
    }
    const d0 = new Date(from);
    const d1 = new Date(to);
    const rows = await prisma.reservation.findMany({
      where: { date: { gte: d0, lte: d1 } },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        client: r.client,
        machines: r.machines,
        type: r.type,
      })),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      date?: string;
      client?: string;
      machines?: number;
      type?: string;
    };
    if (!body.date) {
      return NextResponse.json({ error: "date requise" }, { status: 400 });
    }
    const row = await prisma.reservation.create({
      data: {
        date: new Date(body.date),
        client: body.client?.trim() ?? "",
        machines: Math.max(1, Number(body.machines) || 1),
        type: body.type ?? "saison",
      },
    });
    return NextResponse.json({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      client: row.client,
      machines: row.machines,
      type: row.type,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Création impossible" }, { status: 400 });
  }
}
