/** Géocodage NominatIM (usage raisonné — en prod prévoir clé dédiée type Google / Mapbox). */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  const q = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ClimRushManager/1.0 (https://github.com/AnthonyNadjari/ClimRushManager)",
      Accept: "application/json",
    },
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

/** Séquentiel pour limiter la charge sur Nominatim (politique d’usage). */
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

/**
 * Ordre de passage via OSRM Trip (public demo — rate limité ; OSRM_BASE_URL pour instance privée).
 */
export async function optimizeRouteOsrm(addresses: string[]): Promise<
  | {
      orderedAddresses: string[];
      totalDurationSec: number;
      totalDistanceM: number;
      legs: { durationSec: number; distanceM: number }[];
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
  const tripUrl = `${base}/trip/v1/driving/${coords}?roundtrip=false&geometries=false`;

  const tripRes = await fetch(tripUrl, { cache: "no-store" });
  if (!tripRes.ok) {
    return { error: `OSRM HTTP ${tripRes.status}` };
  }
  const data = (await tripRes.json()) as OsrmTripResponse;
  if (data.code !== "Ok" || !data.trips?.[0] || !data.waypoints) {
    return { error: "Réponse OSRM invalide" };
  }

  const trip = data.trips[0];
  const orderedAddresses = data.waypoints.map(
    (wp) => addresses[wp.waypoint_index],
  );
  const legs = trip.legs.map((leg) => ({
    durationSec: leg.duration,
    distanceM: leg.distance,
  }));

  return {
    orderedAddresses,
    totalDurationSec: trip.duration,
    totalDistanceM: trip.distance,
    legs,
  };
}
