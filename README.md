# Deal Room

A web app for Twilio sellers to build, share, and reuse customer-facing digital asset rooms.

Sellers assemble curated rooms from a menu-driven interface, share via unique links with co-branding, track customer engagement, and contribute winning rooms to a community library.

## Features

- **Room Builder** — Create rooms with sections, upload files, add links, write notes
- **Co-Branded Customer Portal** — Shareable link with seller + customer logos, accent colors
- **Engagement Analytics** — Track views, downloads, clicks per visitor
- **Community Library** — Share winning rooms, browse by tags, clone as templates
- **Extensible** — Adapter pattern for future Twilio ecosystem integrations (docs, demos, marketing collateral)

## Quick Start

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded Accounts

| Email | Password |
|-------|----------|
| alex.morgan@twilio.com | password123 |
| sam.chen@twilio.com | password456 |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite via Prisma 7
- **Auth:** NextAuth.js v5 (credentials provider)
- **Storage:** Local filesystem (swappable to S3/R2)
- **Styling:** Tailwind CSS v4

## Project Structure

```
app/
  (seller)/              Authenticated seller pages
    dashboard/           Room list and quick stats
    rooms/[id]/          Room builder with branding editor
    rooms/[id]/analytics Engagement analytics
    community/           Community library
  (customer)/
    [slug]/              Public customer portal
  api/                   REST API routes
lib/
  adapters/              Asset source adapters (extensible)
  storage/               File storage abstraction
  events/                Event capture and analytics
prisma/
  schema.prisma          Database schema
  seed.ts                Sample data
```

## Environment Variables

```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```
