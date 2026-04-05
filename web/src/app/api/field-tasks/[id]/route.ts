import { NextResponse } from "next/server";
import { Prisma, FieldTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeFieldTask } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<{
      status: FieldTaskStatus;
      timeNote: string | null;
      extraNote: string | null;
      truckLabel: string;
      machineIds: string[];
    }>;

    const data: Record<string, unknown> = {};
    if (body.status != null) data.status = body.status;
    if (body.timeNote !== undefined) data.timeNote = body.timeNote;
    if (body.extraNote !== undefined) data.extraNote = body.extraNote;
    if (body.truckLabel !== undefined) {
      data.truckLabel = body.truckLabel.trim() || "Tous";
    }
    if (body.machineIds !== undefined) {
      const ids = body.machineIds
        .map((s) => String(s).replace(/^#/, "").trim())
        .filter(Boolean);
      data.machineIdsJson = JSON.stringify(ids);
    }

    const row = await prisma.fieldTask.update({
      where: { id },
      data,
    });
    return NextResponse.json(serializeFieldTask(row));
  } catch (e) {
    console.error(e);
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}
