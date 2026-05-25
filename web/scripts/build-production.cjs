const { execSync } = require("node:child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

const dbUrl = String(process.env.DATABASE_URL || "").trim();
// Connexion DIRECTE pour les migrations. Le schéma déclare `directUrl = env("DIRECT_URL")`,
// requis par `migrate deploy`. Si DIRECT_URL est absente, on la dérive de DATABASE_URL.
// Le pooler « transaction » de Supabase (port 6543) ne supporte PAS les migrations :
// on bascule vers le pooler « session » (même hôte, port 5432) qui, lui, les supporte.
if (dbUrl && !String(process.env.DIRECT_URL || "").trim()) {
  process.env.DIRECT_URL = dbUrl.replace(":6543/", ":5432/");
}
if (dbUrl) {
  try {
    run("npx prisma migrate deploy");
  } catch {
    console.error(
      "\n[ClimRush] ÉCHEC de `prisma migrate deploy` (voir l’erreur ci-dessus). " +
        "Le déploiement CONTINUE mais l’API restera en erreur tant que la base " +
        "n’est pas migrée. Sur Supabase, les migrations doivent passer par une " +
        "connexion DIRECTE ou le pooler « session » (port 5432), pas le pooler " +
        "« transaction » (6543) : définissez DIRECT_URL en conséquence sur Vercel. " +
        "Après le déploiement, ouvrez /api/health pour la cause exacte.\n",
    );
  }
} else {
  console.warn(
    "\n[ClimRush] DATABASE_URL absent : migrations ignorées pour ce build. " +
      "Le déploiement continue. Ajoutez DATABASE_URL sur Vercel (Production + Preview) " +
      "puis redéployez pour exécuter les migrations et activer l’API PostgreSQL.\n",
  );
}

run("npx next build");
