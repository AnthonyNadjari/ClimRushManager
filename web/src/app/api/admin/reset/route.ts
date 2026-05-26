import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Endpoint temporaire pour vider la base. Sera supprimé après usage.
// Jeton intégré pour éviter qu'un scanner aléatoire ne déclenche le reset.
const RESET_TOKEN = "a7f3c2d8-91b4-4e5a-bd62-reset-2026";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-reset-token");
  if (token !== RESET_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    await prisma.reservation.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.maintenanceTicket.deleteMany();
    await prisma.fieldTask.deleteMany();
    await prisma.machine.deleteMany();
    await prisma.client.deleteMany();
    return NextResponse.json({ ok: true, wiped: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
