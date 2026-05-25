import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Masque tout identifiant de type user:password@ dans un message d'erreur.
function redact(message: string) {
  return message.replace(/:\/\/[^@\s]+@/g, "://***@");
}

function hintFor(message: string) {
  const m = message.toLowerCase();
  if (m.includes("does not exist") && m.includes("relation")) {
    return "Tables absentes : exécutez les migrations (prisma migrate deploy) puis le seed.";
  }
  if (m.includes("environment variable not found")) {
    return "Variable d'environnement manquante (DATABASE_URL / DIRECT_URL) sur le déploiement.";
  }
  if (m.includes("authentication failed") || m.includes("password")) {
    return "Identifiants invalides : vérifiez le mot de passe dans DATABASE_URL.";
  }
  if (m.includes("can't reach") || m.includes("timed out") || m.includes("econnrefused")) {
    return "Base injoignable : vérifiez l'hôte/port et que la base accepte les connexions (SSL/pooler).";
  }
  return "Vérifiez DATABASE_URL (et DIRECT_URL pour les migrations) sur le déploiement.";
}

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: true, hasDatabaseUrl, ts: new Date().toISOString() },
      { status: 200 },
    );
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const message = redact(raw.split("\n").filter(Boolean).join(" ").slice(0, 400));
    return NextResponse.json(
      {
        ok: false,
        db: false,
        hasDatabaseUrl,
        error: message,
        hint: hintFor(raw),
        ts: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
