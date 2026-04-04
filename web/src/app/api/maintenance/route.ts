import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeMaintenance } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.maintenanceTicket.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(rows.map(serializeMaintenance));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Base indisponible. Vérifiez DATABASE_URL." },
      { status: 503 },
    );
  }
}
