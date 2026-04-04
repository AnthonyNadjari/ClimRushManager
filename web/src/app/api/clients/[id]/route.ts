import { NextResponse } from "next/server";
import { ClientStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeClient } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<{
      name: string;
      email: string;
      phone: string;
      status: ClientStatus;
      machines: number;
      daysRented: number;
      caHt: number;
      alert: string | null;
      machineNumbers: string[];
      lotSummary: string | null;
    }>;

    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = body.name;
    if (body.email != null) data.email = body.email;
    if (body.phone != null) data.phone = body.phone;
    if (body.status != null) data.status = body.status;
    if (body.machines != null) data.machines = body.machines;
    if (body.daysRented != null) data.daysRented = body.daysRented;
    if (body.caHt != null) data.caHt = body.caHt;
    if (body.alert !== undefined) data.alert = body.alert;
    if (body.machineNumbers != null) data.machineNumbers = body.machineNumbers;
    if (body.lotSummary !== undefined) data.lotSummary = body.lotSummary;

    const row = await prisma.client.update({
      where: { id },
      data,
    });
    return NextResponse.json(serializeClient(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 });
  }
}
