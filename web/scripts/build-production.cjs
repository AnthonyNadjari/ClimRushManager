const { execSync } = require("node:child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

const dbUrl = String(process.env.DATABASE_URL || "").trim();
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
