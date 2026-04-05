import { NextResponse } from "next/server";
import { optimizeRouteOsrm } from "@/lib/route-optimize";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TruckGroup = { truckLabel: string; addresses: string[] };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      addresses?: string[];
      byTruck?: TruckGroup[];
    };

    if (body.byTruck && body.byTruck.length > 0) {
      const routes: unknown[] = [];
      for (const g of body.byTruck) {
        const addresses = [...new Set(g.addresses?.filter(Boolean) ?? [])];
        if (addresses.length === 0) {
          routes.push({
            truckLabel: g.truckLabel,
            skipped: true,
            message: "Aucune adresse active",
            orderedAddresses: [] as string[],
          });
          continue;
        }
        if (addresses.length === 1) {
          routes.push({
            truckLabel: g.truckLabel,
            skipped: false,
            single: true,
            orderedAddresses: addresses,
            totalDurationSec: 0,
            totalDistanceM: 0,
            summary: { durationLabel: "1 arrêt", distanceKm: "0.0" },
            source: "single-stop",
          });
          continue;
        }
        if (addresses.length > 12) {
          routes.push({
            truckLabel: g.truckLabel,
            skipped: true,
            message: "Maximum 12 adresses par camion",
            orderedAddresses: addresses.slice(0, 12),
          });
          continue;
        }

        const result = await optimizeRouteOsrm(addresses);
        if ("error" in result) {
          routes.push({
            truckLabel: g.truckLabel,
            skipped: true,
            message: result.error,
            orderedAddresses: addresses,
          });
          continue;
        }

        const minutes = Math.round(result.totalDurationSec / 60);
        routes.push({
          truckLabel: g.truckLabel,
          skipped: false,
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
      }
      return NextResponse.json({ routes });
    }

    const addresses = body.addresses?.filter(Boolean) ?? [];
    if (addresses.length === 0) {
      return NextResponse.json(
        { error: "addresses[] ou byTruck[] requis" },
        { status: 400 },
      );
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
