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

### Option C — Même base Supabase que la prod (sans Docker)

`npx vercel env pull` **ne remplit pas** `DATABASE_URL` lorsque la variable est marquée **Sensitive** sur Vercel (valeur vide dans `.env.local`).

1. [Supabase](https://supabase.com/dashboard/project/pumtskzxqhzldgbtuhtn) → **Settings → Database** : copiez ou réinitialisez le **mot de passe** de la base.
2. `cp web/.env.local.example web/.env.local` puis remplacez `VOTRE_MOT_DE_PASSE` dans `web/.env.local`.
3. `cd web && npm run dev`

## Déployer sur Vercel

L’app Next.js vit dans **`web/`**.

### 1. Racine du projet

**Settings → General → Root Directory** : **`web`**.

Dans le même écran, sous **Build & Development** : si vous aviez des **commandes surchargées** (`npm install --prefix web`, etc.), remettez les **valeurs par défaut** (le fichier `web/vercel.json` impose déjà `npm install` + `npm run build` quand la racine est `web`).

Un `vercel.json` à la **racine du dépôt** existe aussi pour les cas où la racine Vercel resterait le repo entier : il délègue vers `web/`.

### 2. Base PostgreSQL (obligatoire pour l’API)

Le **build** peut réussir **sans** `DATABASE_URL` (les migrations sont alors ignorées avec un avertissement dans les logs). Pour que l’app soit **utilisable** (dashboard, machines, etc.), il faut une base :

1. **Storage** (ou intégration **Neon** / **Supabase** / autre Postgres) depuis le dashboard Vercel, **ou**
2. **Settings → Environment Variables** : **`DATABASE_URL`** pour **Production** et **Preview**. Avec **Supabase**, utiliser de préférence l’URI du **pooler « session »** (port **5432**, hôte `*.pooler.supabase.com`, utilisateur `postgres.<project_ref>`) — voir `web/.env.example`.

Puis **Redeploy** une fois la variable ajoutée pour exécuter `prisma migrate deploy`.

**Déjà configuré sur ce dépôt** : projet Supabase **`climrush-manager`** + `DATABASE_URL` sur Vercel. Pour le dev local avec la même base : `cd web && npx vercel env pull` (crée `.env.local`, non versionné).

### 3. Seed (une fois)

```bash
cd web
DATABASE_URL="votre_url" npx prisma db seed
```

Le seed est idempotent sur les IDs de démo.

### 4. Node

`web/package.json` fixe **`engines.node` à `20.x`** (aligné avec Vercel LTS). Vous pouvez forcer **Node.js 20** dans **Settings → General** si besoin.

## Déployer sur Railway

Un fichier **`railway.toml`** à la racine définit build / start pour le dossier **`web/`** (monorepo) :

- **Build** : `npm ci --prefix web && npm run build --prefix web` (Prisma + Next ; migrations si `DATABASE_URL` est défini au build).
- **Start** : `next start` écoute sur **`0.0.0.0`** (obligatoire sur Railway).
- **Healthcheck** : `GET /api/health` (échoue tant que la base ne répond pas — ajoutez bien **`DATABASE_URL`** au service, idéalement une base Postgres Railway ou une URL compatible SSL).

Si le service Railway pointait sur la racine sans commandes personnalisées, le build pouvait échouer (pas de dépendances Next dans la racine). Après push, **redéployez** depuis Railway.

## Fonctionnalités données réelles

- **CRUD** via routes `/api/*` : machines, clients, tâches terrain, maintenance, réservations, fil d’activité.
- **Optimisation d’itinéraire** : `POST /api/route-optimize` — géocodage [Nominatim](https://nominatim.org) (respecter l’usage) + [OSRM](https://project-osrm.org/) (`OSRM_BASE_URL` optionnel pour une instance dédiée).
- **Maintenance** : validation d’un ticket remet une machine **SAV** en **DISPO** en base.

## Cahier des charges (rappel)

V1.1 : codes couleur, terrain livraisons/reprises, n° de machine, SMS brouillon (`sms:`), export CSV. SMS automatiques = API tierce (Twilio, Brevo…) en phase 2.
