# Architecture

## Overview

Dossier is a Next.js 16 App Router application. It splits into two concerns behind a single Next.js process:

- **Seller app** — authenticated workspace for building and managing rooms (`app/(seller)/`)
- **Customer portal** — public, slug-based room viewer (`app/(customer)/[slug]/`)

There is no real auth session. `lib/current-user.ts` returns the first seeded seller from the database — auth is handled externally in production via Twilio SSO.

## Directory Structure

```
app/
  (seller)/                 Seller-facing pages (behind nav layout)
    dashboard/              Room list
    rooms/
      new/                  Create room form
      [id]/                 Room builder (split-screen)
        components/         Editor panel sub-components
        analytics/          Full analytics page
    community/              Community template library
    login/ register/        Auth pages (unused in demo — SSO handles this)
    layout.tsx              Shared nav: brand mark, breadcrumb, avatar

  (customer)/
    [slug]/
      page.tsx              Server component: fetches room, checks published
      portal-content.tsx    Client component: tab state, asset grid
      tracker.tsx           Client component: fires view/download/click events

  api/
    rooms/                  Room CRUD
      [id]/
        branding/           Logo upload + color/companyName save
        sections/           Section CRUD + batch reorder
          [sectionId]/
            assets/         Asset CRUD (file upload, link, richtext)
            assets/[assetId]/ PATCH reorder, DELETE
    events/                 Ingest ViewEvent records (no auth — public)
    community/              Community library read + clone
    docs/search/            Local Twilio docs search (catalog JSON, no API key)
    auth/                   NextAuth routes (unused in demo flow)

lib/
  assets.ts                 Shared thumbnail/label/meta helpers (used in 3 places)
  auth.ts                   NextAuth config (credentials provider, bcrypt)
  current-user.ts           Demo shim — returns first seller in DB
  db.ts                     Prisma client singleton
  events/index.ts           getRoomAnalytics + captureEvent
  slug.ts                   Auto-generate URL-safe slugs
  storage/                  StorageAdapter interface + LocalStorage implementation
  adapters/                 Asset source adapters (manual, twilio-docs)
  twilio-docs-catalog.json  4,273-entry Twilio docs index (scraped sitemap)

prisma/
  schema.prisma             Seller, Room, Section, Asset, ViewEvent, CommunityRoom
  seed.ts                   Demo data — Acme Corp rooms, view events
```

## Data Flow

### Room builder (seller)

```
GET /rooms/[id]
  └─ page.tsx (server)
      ├─ prisma.room.findFirst (with sections + assets)
      ├─ getRoomAnalytics()
      └─ <RoomBuilderClient> (client, receives serialized props)
          ├─ RoomProvider (context: sections[], setSections, reloadSections)
          │   ├─ BuyerPreview (reads sections from context, live preview)
          │   └─ EditorPanel
          │       ├─ SectionList (reads/writes sections via context + API)
          │       ├─ BrandingEditor (onSaved → lifts branding to RoomBuilderClient)
          │       └─ AnalyticsTab (reads analytics from props, server-fetched)
```

### Customer portal

```
GET /[slug]
  └─ page.tsx (server)
      ├─ prisma.room.findFirst (by slug, status=published)
      ├─ notFound() if draft
      └─ <PortalContent> (client, tab state)
          ├─ <RoomTracker> fires room_viewed on mount
          └─ <AssetTrackerButton> fires asset_downloaded or link_clicked on click
```

### Analytics ingestion

```
POST /api/events
  └─ prisma.viewEvent.create({ roomId, assetId?, visitorId, action })
       visitorId = cookie (set by middleware-equivalent in tracker.tsx)
```

## Key Design Decisions

**Server/client split**: Server components own all DB access and pass plain serialized objects as props to client components. Client components never import Prisma. This avoids accidentally shipping DB credentials to the browser and keeps server-only code clearly separated.

**RoomContext**: The split-screen builder needs both the buyer preview (left) and the section editor (right) to share section state. Context is the right tool — it avoids prop-drilling through `RoomBuilderClient → EditorPanel → SectionList` and keeps the preview reactive.

**Branding lifted to RoomBuilderClient state**: `BrandingEditor` calls `onSaved(updated)` after a successful API save, which flows up to `RoomBuilderClient` state. Both `BrandingSummaryCard` and `BuyerPreview` read from this live state, so the preview updates immediately without a page reload.

**Status lifted to EditorPanel state**: `PublishButton` calls `onStatusChange(newStatus)` rather than `router.refresh()`. The status pill in the header updates instantly.

**Local storage for uploads**: Files land in `public/uploads/` (gitignored). The `StorageAdapter` interface in `lib/storage/` makes this swappable to S3/Vercel Blob without touching API routes.

**Twilio docs search is fully local**: `lib/twilio-docs-catalog.json` is a pre-built index of 4,273 docs pages. No API key or network call needed. `/api/docs/search` does an in-process filter.

## Database Schema

```
Seller ─── Room ─── Section ─── Asset
                └── ViewEvent
                └── CommunityRoom
```

`ViewEvent` captures: `roomId`, `assetId?`, `visitorId` (cookie), `action` (room_viewed | asset_viewed | asset_downloaded | link_clicked), `timestamp`.

`CommunityRoom` is a join between a `Room` and the community library — one room can have at most one community entry.

## GTM Accelerator Integration Path

This app is designed to be a standalone reference that can be absorbed into GTM Accelerator as a feature module:

- **No hard coupling to Twilio products** in the UI layer — content is seller-authored
- **Auth shim** (`lib/current-user.ts`) is a single file to replace with SSO integration
- **Storage adapter** pattern means file handling can switch to GTM Accelerator's blob store
- **Seed data** uses generic Acme Corp placeholders — easy to swap for real customer templates
- **Community library** is the shared-template layer that maps directly to a GTM Accelerator template catalog concept
