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

Ce dépôt inclut un `vercel.json` à la **racine** : le projet est buildé depuis le dossier `web`.

1. Importer le dépôt dans Vercel ; laisser la **racine du dépôt** comme répertoire du projet (ne pas forcer uniquement `web` si vous utilisez ce `vercel.json`).
2. Dans **Settings → Environment Variables**, ajouter **`DATABASE_URL`** (PostgreSQL avec `sslmode=require` si fournisseur managé).
3. Premier déploiement : le script `build` exécute `prisma migrate deploy` puis `next build`.
4. Après le premier déploiement réussi, exécuter le seed une fois (machine locale ou CI) :

   ```bash
   cd web
   DATABASE_URL="votre_url" npx prisma db seed
   ```

   Ou ajouter temporairement une étape de build (non recommandé en prod) — le seed est idempotent sur les IDs de démo.

## Fonctionnalités données réelles

- **CRUD** via routes `/api/*` : machines, clients, tâches terrain, maintenance, réservations, fil d’activité.
- **Optimisation d’itinéraire** : `POST /api/route-optimize` — géocodage [Nominatim](https://nominatim.org) (respecter l’usage) + [OSRM](https://project-osrm.org/) (`OSRM_BASE_URL` optionnel pour une instance dédiée).
- **Maintenance** : validation d’un ticket remet une machine **SAV** en **DISPO** en base.

## Cahier des charges (rappel)

V1.1 : codes couleur, terrain livraisons/reprises, n° de machine, SMS brouillon (`sms:`), export CSV. SMS automatiques = API tierce (Twilio, Brevo…) en phase 2.
