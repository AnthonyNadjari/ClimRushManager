const UA =
  "ClimRushManager/1.0 (https://github.com/AnthonyNadjari/ClimRushManager)";

/** Géocodage Nominatim (usage raisonné — en prod prévoir clé dédiée type Google / Mapbox). */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  const q = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { lat?: string; lon?: string }[];
  const row = json[0];
  if (!row?.lat || !row?.lon) return null;
  return { lat: parseFloat(row.lat), lon: parseFloat(row.lon) };
}

type GeocodeOk = { points: { address: string; lat: number; lon: number }[] };
type GeocodeErr = { error: string };

/** Séquentiel pour limiter la charge sur Nominatim (politique d'usage). */
export async function geocodeAll(
  addresses: string[],
): Promise<GeocodeOk | GeocodeErr> {
  const out: GeocodeOk["points"] = [];
  for (const address of addresses) {
    const g = await geocodeAddress(address);
    if (!g) {
      return { error: `Adresse introuvable : ${address}` };
    }
    out.push({ address, ...g });
    await new Promise((r) => setTimeout(r, 1100));
  }
  return { points: out };
}

type OsrmTripResponse = {
  code: string;
  trips?: {
    duration: number;
    distance: number;
    legs: { duration: number; distance: number }[];
  }[];
  waypoints?: { waypoint_index: number }[];
};

/* ------------------------------------------------------------------ */
/*  Haversine distance (km) – used for local nearest-neighbor fallback */
/* ------------------------------------------------------------------ */
function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Nearest-neighbor greedy ordering — works offline, no external API. */
function nearestNeighborOrder(
  points: GeocodeOk["points"],
): {
  orderedAddresses: string[];
  totalDistanceM: number;
  legs: { durationSec: number; distanceM: number }[];
} {
  const remaining = points.map((_, i) => i);
  const order: number[] = [remaining.shift()!];
  let totalKm = 0;
  const legs: { durationSec: number; distanceM: number }[] = [];

  while (remaining.length > 0) {
    const last = points[order[order.length - 1]];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(last, points[remaining[i]]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    totalKm += bestDist;
    // Estimate ~40 km/h average urban speed
    legs.push({
      durationSec: Math.round((bestDist / 40) * 3600),
      distanceM: Math.round(bestDist * 1000),
    });
    order.push(remaining.splice(bestIdx, 1)[0]);
  }

  return {
    orderedAddresses: order.map((i) => points[i].address),
    totalDistanceM: Math.round(totalKm * 1000),
    legs,
  };
}

/**
 * Ordre de passage via OSRM Trip (public demo — rate limité ; OSRM_BASE_URL pour instance privée).
 * Fallback : tri nearest-neighbor local si OSRM indisponible.
 */
export async function optimizeRouteOsrm(addresses: string[]): Promise<
  | {
      orderedAddresses: string[];
      totalDurationSec: number;
      totalDistanceM: number;
      legs: { durationSec: number; distanceM: number }[];
      source?: string;
    }
  | { error: string }
> {
  if (addresses.length === 0) {
    return { error: "Aucune adresse" };
  }
  if (addresses.length === 1) {
    return {
      orderedAddresses: [...addresses],
      totalDurationSec: 0,
      totalDistanceM: 0,
      legs: [],
    };
  }

  const geo = await geocodeAll(addresses);
  if ("error" in geo) return { error: geo.error };

  const coords = geo.points.map((p) => `${p.lon},${p.lat}`).join(";");
  const base =
    process.env.OSRM_BASE_URL?.replace(/\/$/, "") ??
    "https://router.project-osrm.org";

  // Try OSRM Trip with different params
  let data: OsrmTripResponse | null = null;
  for (const qs of [
    "roundtrip=false&source=first&destination=last&geometries=false",
    "roundtrip=true&geometries=false",
  ]) {
    try {
      const tripRes = await fetch(`${base}/trip/v1/driving/${coords}?${qs}`, {
        headers: { "User-Agent": UA },
        cache: "no-store",
      });
      if (tripRes.ok) {
        data = (await tripRes.json()) as OsrmTripResponse;
        if (data.code === "Ok" && data.trips?.[0] && data.waypoints) break;
        data = null;
      }
    } catch {
      // Network error — continue to next attempt or fallback
    }
  }

  // OSRM succeeded
  if (data?.code === "Ok" && data.trips?.[0] && data.waypoints) {
    const trip = data.trips[0];
    return {
      orderedAddresses: data.waypoints.map(
        (wp) => addresses[wp.waypoint_index],
      ),
      totalDurationSec: trip.duration,
      totalDistanceM: trip.distance,
      legs: trip.legs.map((leg) => ({
        durationSec: leg.duration,
        distanceM: leg.distance,
      })),
      source: "osrm",
    };
  }

  // Fallback: nearest-neighbor using geocoded coordinates
  console.warn("[route-optimize] OSRM unavailable, using local fallback");
  const nn = nearestNeighborOrder(geo.points);
  return {
    ...nn,
    totalDurationSec: nn.legs.reduce((s, l) => s + l.durationSec, 0),
    source: "local-fallback",
  };
}
