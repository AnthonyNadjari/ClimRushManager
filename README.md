# ClimRush Manager

Application web **mobile-first** (iPhone en priorité) pour la gestion opérationnelle ClimRush : dashboard, parc machines, planning, **livraisons**, **reprises**, clients, maintenance, analytics. Données de démo en mémoire (pas de backend dans cette version).

## Démarrer en local

```bash
cd web
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Déployer sur Vercel

1. Pousser ce dépôt sur GitHub / GitLab / Bitbucket.
2. Dans [Vercel](https://vercel.com) : **Add New Project** → importer le dépôt.
3. Définir **Root Directory** sur `web` (important : le projet Next.js est dans le sous-dossier `web`).
4. Framework détecté : Next.js — lancer le déploiement.

Alternative en CLI (depuis la racine du dépôt) :

```bash
cd web
npx vercel
```

## Cahier des charges

Basé sur la V1.1 (avril 2026) : codes couleur universels, composant terrain partagé livraisons/reprises, scanner QR (`html5-qrcode` + saisie manuelle), export CSV clients, jauge d’amortissement, rappels SMS (Twilio/Brevo à brancher en phase 2).
