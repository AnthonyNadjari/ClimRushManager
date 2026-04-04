# ClimRush Manager

Application **Next.js** mobile-first : dashboard, parc machines (PostgreSQL), planning avec réservations persistées, livraisons / reprises, clients, maintenance, analytics.

## Prérequis production

- **PostgreSQL** (ex. [Neon](https://neon.tech), Supabase, RDS).
- Variable **`DATABASE_URL`** (voir `web/.env.example`).

## Démarrer en local

### Option A — PostgreSQL avec Docker (recommandé)

À la **racine** du dépôt :

```bash
cp web/.env.docker web/.env
npm install --prefix web
npm run setup:local
npm run dev
```

`setup:local` lance `docker compose up -d` puis `db:prepare` dans `web` (migrate + seed). Vérifier la base : `GET /api/health` (200 si la DB répond, 503 sinon).

### Option B — Base déjà disponible

```bash
cd web
cp .env.example .env
# Éditer .env : DATABASE_URL=postgresql://...

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Sans base, l’UI affiche une erreur sur les écrans qui lisent l’API.

## Déployer sur Vercel

L’app Next.js vit dans **`web/`**. Sur Vercel, il faut que le **répertoire racine du projet** soit ce dossier, sinon le build Next et le dossier `.next` ne correspondent pas.

1. **Settings → General → Root Directory** : mettre **`web`** (indispensable).
2. **Settings → Environment Variables** : ajouter **`DATABASE_URL`** pour **Production** (et **Preview** si vous déployez des PR). Utilisez une URL PostgreSQL accessible depuis Internet, avec `sslmode=require` (Neon, Supabase, etc.). **Sans `DATABASE_URL`, le build échoue** : `npm run build` exécute `prisma migrate deploy` avant `next build`.
3. Le fichier `web/vercel.json` ne fait que fixer le framework **Next.js** — pas de `outputDirectory` personnalisé (incompatible avec le preset Next sur Vercel).
4. Après le premier déploiement réussi, exécuter le **seed** une fois (machine locale ou CI) :

   ```bash
   cd web
   DATABASE_URL="votre_url" npx prisma db seed
   ```

   Le seed est idempotent sur les IDs de démo.

**Si le build Vercel échoue encore** : ouvrez l’onglet **Build Logs** — erreur fréquente = `DATABASE_URL` absent ou base injoignable (pare-feu / mauvaise URL). En local, reproduire : `cd web && npm run build` avec la même `DATABASE_URL`.

## Fonctionnalités données réelles

- **CRUD** via routes `/api/*` : machines, clients, tâches terrain, maintenance, réservations, fil d’activité.
- **Optimisation d’itinéraire** : `POST /api/route-optimize` — géocodage [Nominatim](https://nominatim.org) (respecter l’usage) + [OSRM](https://project-osrm.org/) (`OSRM_BASE_URL` optionnel pour une instance dédiée).
- **Maintenance** : validation d’un ticket remet une machine **SAV** en **DISPO** en base.

## Cahier des charges (rappel)

V1.1 : codes couleur, terrain livraisons/reprises, n° de machine, SMS brouillon (`sms:`), export CSV. SMS automatiques = API tierce (Twilio, Brevo…) en phase 2.
