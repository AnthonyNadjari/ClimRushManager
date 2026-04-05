import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ClientStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeClient } from "@/lib/serializers";

export const dynamic = "force-dynamic";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function GET() {
  try {
    const rows = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: { assignedMachines: { select: { id: true } } },
    });
    return NextResponse.json(rows.map(serializeClient));
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
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      status?: ClientStatus;
    };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }
    const id = `c_${randomUUID().slice(0, 8)}`;
    const row = await prisma.client.create({
      data: {
        id,
        name,
        initials: initialsFromName(name),
        email: body.email?.trim() || "—",
        phone: body.phone?.trim() || "—",
        address: body.address?.trim() || "",
        status: body.status ?? ClientStatus.a_venir,
        daysRented: 0,
        caHt: 0,
      },
      include: { assignedMachines: { select: { id: true } } },
    });
    return NextResponse.json(serializeClient(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}
