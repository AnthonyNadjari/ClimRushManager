import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const empty = {
      machines: [] as { id: string; label: string; href: string; kind: string }[],
      clients: [] as { id: string; label: string; href: string; kind: string }[],
      fieldTasks: [] as { id: string; label: string; href: string; kind: string }[],
      reservations: [] as { id: string; label: string; href: string; kind: string }[],
      maintenance: [] as { id: string; label: string; href: string; kind: string }[],
    };
    if (q.length < 2) {
      return NextResponse.json(empty);
    }

    const insensitive = { contains: q, mode: "insensitive" as const };

    const [machines, clients, fieldTasks, reservations, maintenance] =
      await Promise.all([
        prisma.machine.findMany({
          where: {
            OR: [
              { id: { contains: q } },
              { model: insensitive },
              { clientName: insensitive },
              { lot: insensitive },
            ],
          },
          take: 8,
          orderBy: { id: "asc" },
        }),
        prisma.client.findMany({
          where: {
            OR: [
              { name: insensitive },
              { phone: insensitive },
              { email: insensitive },
              { address: insensitive },
            ],
          },
          take: 8,
        }),
        prisma.fieldTask.findMany({
          where: {
            OR: [
              { clientLabel: insensitive },
              { address: insensitive },
              { phone: insensitive },
            ],
          },
          take: 8,
          orderBy: { sortOrder: "asc" },
        }),
        prisma.reservation.findMany({
          where: { client: insensitive },
          take: 8,
          orderBy: { date: "desc" },
        }),
        prisma.maintenanceTicket.findMany({
          where: {
            OR: [
              { title: insensitive },
              { detail: insensitive },
              { machineId: { contains: q } },
            ],
          },
          take: 8,
        }),
      ]);

    return NextResponse.json({
      machines: machines.map((m) => ({
        id: m.id,
        label: `#${m.id} — ${m.model}`,
        href: `/m/${encodeURIComponent(m.id)}`,
        kind: "machine",
      })),
      clients: clients.map((c) => ({
        id: c.id,
        label: c.name,
        href: `/clients?q=${encodeURIComponent(c.name)}`,
        kind: "client",
      })),
      fieldTasks: fieldTasks.map((t) => ({
        id: t.id,
        label: `${t.clientLabel} — ${t.address}`,
        href: t.mode === "livraison" ? "/livraisons" : "/reprises",
        kind: "terrain",
      })),
      reservations: reservations.map((r) => ({
        id: r.id,
        label: `${r.client} — ${r.date.toISOString().slice(0, 10)}`,
        href: "/planning",
        kind: "resa",
      })),
      maintenance: maintenance.map((m) => ({
        id: m.id,
        label: `${m.machineId} — ${m.title}`,
        href: "/maintenance",
        kind: "sav",
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  }
}
