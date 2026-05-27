import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const RESET_TOKEN = "b5d92e41-7a3f-4c8e-9162-planning-2026";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-reset-token");
  if (token !== RESET_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const r = await prisma.reservation.deleteMany();
    return NextResponse.json({ ok: true, deleted: r.count });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
