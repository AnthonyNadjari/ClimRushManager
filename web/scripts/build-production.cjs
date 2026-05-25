const { execSync } = require("node:child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

const dbUrl = String(process.env.DATABASE_URL || "").trim();
// Le schéma déclare `directUrl = env("DIRECT_URL")`, requis par `migrate deploy`.
// Si seule DATABASE_URL est fournie (cas courant sur Vercel), on l'utilise aussi
// comme connexion directe pour éviter l'échec de validation P1012.
if (dbUrl && !String(process.env.DIRECT_URL || "").trim()) {
  process.env.DIRECT_URL = dbUrl;
}
if (dbUrl) {
  run("npx prisma migrate deploy");
} else {
  console.warn(
    "\n[ClimRush] DATABASE_URL absent : migrations ignorées pour ce build. " +
      "Le déploiement continue. Ajoutez DATABASE_URL sur Vercel (Production + Preview) " +
      "puis redéployez pour exécuter les migrations et activer l’API PostgreSQL.\n",
  );
}

run("npx next build");
