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
