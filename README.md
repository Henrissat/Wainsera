# Wainsera

Application personnelle (Next.js + Prisma + Neon) pour suivre tes bouteilles :
millésime, emplacement, fenêtre de garde, statut « à boire ».

## Stack

- **Next.js** : front + API dans le même projet
- **Prisma** : schéma et accès à la base
- **Neon** : Postgres gratuit (s’endort, se réveille tout seul)

## Première configuration

1. Crée un compte gratuit sur [https://console.neon.tech](https://console.neon.tech) (GitHub OK, sans CB si plan Free).
2. Crée un projet → copie la **connection string** (Postgres, `sslmode=require`).
3. Colle-la dans `.env` :

```env
DATABASE_URL="postgresql://...@...neon.tech/neondb?sslmode=require"
```

4. Crée les tables :

```bash
npm run db:push
npm run db:generate
```

5. Lance l’app en local :

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Scripts utiles

| Commande | Rôle |
|----------|------|
| `npm run dev` | App en local |
| `npm run db:push` | Applique le schéma Prisma sur Neon |
| `npm run db:studio` | Interface visuelle sur la BDD |
| `npm run build` | Build production (Vercel) |
