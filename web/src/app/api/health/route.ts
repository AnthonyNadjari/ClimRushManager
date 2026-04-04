import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  const ok = db;
  return NextResponse.json(
    {
      ok,
      db,
      ts: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
