import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeActivity } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.activity.findMany({
      orderBy: { sortOrder: "asc" },
      take: 50,
    });
    return NextResponse.json(rows.map(serializeActivity));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: string;
      title?: string;
      subtitle?: string;
      time?: string;
    };
    if (!body.title) {
      return NextResponse.json({ error: "title requis" }, { status: 400 });
    }
    const id = `a_${randomUUID().slice(0, 12)}`;
    const max = await prisma.activity.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (max._max.sortOrder ?? 0) + 1;
    const row = await prisma.activity.create({
      data: {
        id,
        kind: body.kind ?? "ok",
        title: body.title,
        subtitle: body.subtitle ?? "",
        time: body.time ?? "À l’instant",
        sortOrder,
      },
    });
    return NextResponse.json(serializeActivity(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
