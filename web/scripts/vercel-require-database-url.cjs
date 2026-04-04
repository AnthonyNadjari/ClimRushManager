/**
 * Vercel injecte VERCEL=1 pendant le build. Sans DATABASE_URL, prisma migrate
 * échoue avec un message peu clair (P1012) : on préfère expliquer tout de suite.
 */
if (process.env.VERCEL === "1" && !String(process.env.DATABASE_URL || "").trim()) {
  console.error(
    "\n[ClimRush] DATABASE_URL est absent pour le build Vercel.\n" +
      "→ Projet Vercel → Settings → Environment Variables\n" +
      "→ Ajoutez DATABASE_URL pour « Production » (et « Preview » si vous déployez des branches).\n" +
      "Exemple managé : postgresql://USER:PASS@HOST/DB?sslmode=require\n",
  );
  process.exit(1);
}
