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
    if (isNaN(d0.getTime()) || isNaN(d1.getTime())) {
      return NextResponse.json(
        { error: "from/to doivent être des dates ISO valides" },
        { status: 400 },
      );
    }
    const rows = await prisma.reservation.findMany({
      where: { date: { gte: d0, lte: d1 } },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        endDate: r.endDate ? r.endDate.toISOString().slice(0, 10) : null,
        client: r.client,
        machines: r.machines,
        type: r.type,
        priceHt: r.priceHt,
        model: r.model,
        withRemote: r.withRemote,
        withKit: r.withKit,
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
      endDate?: string | null;
      client?: string;
      machines?: number;
      type?: string;
      priceHt?: number | null;
      model?: string | null;
      withRemote?: boolean;
      withKit?: boolean;
    };
    if (!body.date) {
      return NextResponse.json({ error: "date requise" }, { status: 400 });
    }
    const parsed = new Date(body.date);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "date ISO invalide" }, { status: 400 });
    }
    let endDate: Date | null = null;
    if (body.endDate) {
      const e = new Date(body.endDate);
      if (isNaN(e.getTime())) {
        return NextResponse.json(
          { error: "date de fin invalide" },
          { status: 400 },
        );
      }
      endDate = e;
    }
    const priceHt =
      body.priceHt != null && Number.isFinite(Number(body.priceHt))
        ? Number(body.priceHt)
        : null;
    const row = await prisma.reservation.create({
      data: {
        date: parsed,
        endDate,
        client: body.client?.trim() ?? "",
        machines: Math.max(1, Number(body.machines) || 1),
        type: body.type ?? "saison",
        priceHt,
        model: body.model?.trim() || null,
        withRemote: Boolean(body.withRemote),
        withKit: Boolean(body.withKit),
      },
    });
    return NextResponse.json({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
      client: row.client,
      machines: row.machines,
      type: row.type,
      priceHt: row.priceHt,
      model: row.model,
      withRemote: row.withRemote,
      withKit: row.withKit,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Création impossible" }, { status: 400 });
  }
}
