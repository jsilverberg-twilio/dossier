# Dossier

A personalized asset room builder for Twilio sales engineers. Build co-branded, customer-specific content hubs, share via a unique link, and track engagement — all without attaching files to an email.

> **Status**: Reference implementation. Designed to roll into [GTM Accelerator](https://github.com/jsilverberg-twilio) as a feature module.

## How to Use

### 1. Create a room

Go to **Dashboard** → **Create Room**. Give it a name (e.g. "Q3 Business Review") and a customer name.

### 2. Build it out

The room builder is a split screen — live buyer preview on the left, editor on the right.

**Content tab**
- **＋ Add Section** — create a chapter (e.g. "Overview", "Pricing", "Next Steps")
- Click a section title to rename it inline
- **＋ Add asset** — upload a file, paste a URL, search Twilio docs, or write a note

**Branding tab**
- Upload seller + customer logos, set accent color
- Preview updates live as you type

### 3. Publish

Hit **Go Live** in the top-right of the builder. This makes the room publicly accessible.

### 4. Share the link

Copy the link (e.g. `yoursite.com/acme-corp-q3`) and send it to your customer. No login required on their end.

### 5. Customer opens it

Co-branded portal with both logos, section tabs, asset cards, and a seller contact strip.

### 6. Track engagement

Back in the builder → **Analytics tab**: views, unique visitors, downloads, link clicks, and a section-by-section breakdown.

---

## Quick Start

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open http://localhost:3000/dashboard — no login required.

---

## Documentation

| Doc | What's in it |
|---|---|
| [Architecture](docs/architecture.md) | Component tree, data flow, key design decisions, GTM Accelerator integration path |
| [Development](docs/development.md) | Setup, commands, conventions, how to add pages/routes/asset types |
| [Configuration](docs/configuration.md) | Environment variables, database, file storage, auth |
| [Deployment](docs/deployment.md) | Vercel deploy steps, production storage, GTM Accelerator integration |

---

## Tech Stack

- **Framework**: Next.js 16 App Router, React 19
- **Database**: SQLite (local) → PostgreSQL (production)
- **Styling**: Tailwind CSS v4
- **ORM**: Prisma 7
- **Auth**: Demo shim (`lib/current-user.ts`) — replace with SSO for production
- **Storage**: Local filesystem → swappable via `StorageAdapter` interface

## Deploy to Vercel

```bash
npm i -g vercel && vercel login && vercel link
vercel storage create          # create Postgres DB
vercel env pull .env.local     # pull credentials locally
DATABASE_PROVIDER=postgresql npx prisma migrate deploy
DATABASE_PROVIDER=postgresql npx prisma db seed
vercel --prod
```

See [docs/deployment.md](docs/deployment.md) for full steps.

---

## GTM Accelerator Integration

This app is built to be absorbed into GTM Accelerator with minimal surgery:

- **Auth**: swap `lib/current-user.ts` with SSO session lookup
- **Storage**: implement `StorageAdapter` (see `lib/storage/index.ts`) backed by the platform's blob store
- **Community library**: the `CommunityRoom` model maps directly to a shared template catalog
- **Branding**: the `branding` JSON field can be pre-populated from account/customer data

See [docs/deployment.md#gtm-accelerator-integration](docs/deployment.md#gtm-accelerator-integration) for the full integration checklist.
