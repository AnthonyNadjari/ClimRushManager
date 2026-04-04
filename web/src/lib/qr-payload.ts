/**
 * Contenu encodé dans chaque QR machine.
 * - Si NEXT_PUBLIC_APP_URL est défini (ex. https://xxx.vercel.app), le QR ouvre la fiche /m/[id].
 * - Sinon, payload texte stable CLIMRUSH|M|{id} (lisible par tout scanner).
 */
export function machineQrPayload(machineId: string): string {
  const id = machineId.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) {
    return `${base}/m/${encodeURIComponent(id)}`;
  }
  return `CLIMRUSH|M|${id}`;
}

/** Extrait l’identifiant machine depuis le texte lu par le scanner. */
export function parseScannedMachinePayload(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;

  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/$/, "");
    const m = path.match(/\/m\/([^/]+)$/);
    if (m) return decodeURIComponent(m[1]);
  } catch {
    /* pas une URL absolue */
  }

  const pipe = t.match(/^CLIMRUSH\|M\|(.+)$/i);
  if (pipe) return pipe[1].trim();

  const plain = t.replace(/^#/, "").trim();
  if (/^\d+$/.test(plain)) return plain;

  return null;
}
