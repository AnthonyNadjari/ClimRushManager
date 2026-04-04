/** Brouillon générique depuis la fiche client. */
export function clientSmsDraftBody(clientName: string): string {
  return (
    `Bonjour,\n\n` +
    `ClimRush — message concernant « ${clientName} ».\n\n` +
    `[Complétez ici : rappel, créneau, facture…]\n\n` +
    `Cordialement`
  );
}

/** Texte type pour préremplir un SMS depuis l’écran livraisons / reprises. */
export function terrainSmsBody(
  mode: "livraison" | "reprise",
  clientLabel: string,
  address: string,
): string {
  if (mode === "livraison") {
    return (
      `Bonjour, équipe ClimRush.\n` +
      `Livraison prévue pour « ${clientLabel} » — ${address}.\n` +
      `Merci de confirmer l’accès / le créneau si besoin.`
    );
  }
  return (
    `Bonjour, équipe ClimRush.\n` +
    `Reprise de matériel prévue pour « ${clientLabel} » — ${address}.\n` +
    `Merci de confirmer votre présence ou un accès au site.`
  );
}

/**
 * Ouvre l’app Messages du téléphone avec un brouillon (pas d’API SMS).
 * iOS attend souvent `&body=` ; Android `?body=` — on adapte côté client.
 */
export function smsDraftHref(phone: string, body: string): string {
  const raw = phone.replace(/\s/g, "");
  const enc = encodeURIComponent(body);
  const ios =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);
  const sep = ios ? "&" : "?";
  return `sms:${raw}${sep}body=${enc}`;
}
