import { NextResponse } from "next/server";
import { optimizeRouteOsrm } from "@/lib/route-optimize";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { addresses?: string[] };
    const addresses = body.addresses?.filter(Boolean) ?? [];
    if (addresses.length === 0) {
      return NextResponse.json({ error: "addresses[] requis" }, { status: 400 });
    }
    if (addresses.length > 12) {
      return NextResponse.json(
        { error: "Maximum 12 adresses par requête" },
        { status: 400 },
      );
    }

    const result = await optimizeRouteOsrm(addresses);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const minutes = Math.round(result.totalDurationSec / 60);
    return NextResponse.json({
      orderedAddresses: result.orderedAddresses,
      totalDurationSec: result.totalDurationSec,
      totalDistanceM: result.totalDistanceM,
      legs: result.legs,
      summary: {
        durationLabel: `~${minutes} min`,
        distanceKm: (result.totalDistanceM / 1000).toFixed(1),
      },
      source: result.source ?? "osrm+nominatim",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Optimisation impossible (réseau ou quota)." },
      { status: 502 },
    );
  }
}
