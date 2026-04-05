import { NextResponse } from "next/server";
import { FieldMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeFieldTask } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    if (mode !== "livraison" && mode !== "reprise") {
      return NextResponse.json(
        { error: "mode=livraison|reprise requis" },
        { status: 400 },
      );
    }
    const fm = mode === "livraison" ? FieldMode.livraison : FieldMode.reprise;
    const rows = await prisma.fieldTask.findMany({
      where: { mode: fm },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(rows.map(serializeFieldTask));
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
      mode?: string;
      clientLabel?: string;
      address?: string;
      phone?: string;
      qty?: number;
      truckLabel?: string;
      machineIds?: string[];
    };
    if (!body.clientLabel?.trim()) {
      return NextResponse.json({ error: "clientLabel requis" }, { status: 400 });
    }
    const fm =
      body.mode === "reprise" ? FieldMode.reprise : FieldMode.livraison;
    const max = await prisma.fieldTask.aggregate({
      _max: { sortOrder: true },
      where: { mode: fm },
    });
    const id = `ft_${Date.now().toString(36)}`;
    const machineIds =
      body.machineIds
        ?.map((s) => String(s).replace(/^#/, "").trim())
        .filter(Boolean) ?? [];
    const row = await prisma.fieldTask.create({
      data: {
        id,
        mode: fm,
        clientLabel: body.clientLabel.trim(),
        address: body.address?.trim() ?? "",
        phone: body.phone?.trim() ?? "",
        qty: Math.max(1, body.qty ?? 1),
        status: "pending",
        truckLabel: body.truckLabel?.trim() || "Tous",
        machineIdsJson:
          machineIds.length > 0 ? JSON.stringify(machineIds) : "[]",
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(serializeFieldTask(row));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur création tâche" }, { status: 500 });
  }
}
