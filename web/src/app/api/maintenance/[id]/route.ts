import { NextResponse } from "next/server";
import { Prisma, MaintPriority, MachineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeMaintenance } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<{
      priority: MaintPriority;
      action: string | null;
      title: string;
      detail: string;
    }>;

    const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.priority != null) data.priority = body.priority;
    if (body.action !== undefined) data.action = body.action;
    if (body.title != null) data.title = body.title;
    if (body.detail != null) data.detail = body.detail;

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceTicket.update({
        where: { id },
        data,
      });
      if (body.priority === MaintPriority.done) {
        const mach = await tx.machine.findUnique({
          where: { id: ticket.machineId },
        });
        if (mach?.status === MachineStatus.SAV) {
          await tx.machine.update({
            where: { id: ticket.machineId },
            data: {
              status: MachineStatus.DISPO,
              clientName: null,
              returnDate: null,
            },
          });
        }
      }
      return updated;
    });

    return NextResponse.json(serializeMaintenance(row));
  } catch (e) {
    console.error(e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}
