@AGENTS.md

# Dossier — Claude Code Guide

## What this is

A Next.js 16 App Router demo tool for Twilio sales engineers. Sellers build co-branded digital asset rooms, share them with customers via a unique link, and track engagement. Intended to eventually roll into the GTM Accelerator platform.

**Auth is intentionally bypassed.** `lib/current-user.ts` returns the first seeded seller — no session, no redirect. Do not add auth gates without being asked.

## Essential Commands

```bash
npm run dev          # Start dev server (Turbopack, hot reload)
npm run build        # Production build — run this to verify changes
npm run lint         # ESLint — must pass before committing
npx prisma db seed   # Re-seed demo data (destructive)
npx prisma studio    # Browse DB in browser UI
```

Always run `npm run build && npm run lint` before committing. Both must pass clean.

## Architecture

Two route groups share one Next.js process:

- `app/(seller)/` — seller workspace, wrapped by `app/(seller)/layout.tsx` nav
- `app/(customer)/[slug]/` — public customer portal, no nav

**Server/client split rule**: Server components (no `"use client"`) own all DB calls via `lib/db.ts`. Client components receive plain serialized props. Never import `prisma` from a client component.

**State patterns**:
- `RoomContext` (`app/(seller)/rooms/[id]/context.tsx`) — sections shared between buyer preview and editor
- Branding lifted to `RoomBuilderClient` state — `BrandingEditor` calls `onSaved()` so preview updates live
- Publish status lifted to `EditorPanel` state — pill updates instantly without `router.refresh()`

See [docs/architecture.md](docs/architecture.md) for full data flow and directory map.

## Design System

Tailwind v4 (`@import "tailwindcss"` — no `tailwind.config.js`).

- **Background**: `bg-slate-50`
- **Cards**: `bg-white rounded-2xl border border-slate-200 shadow-sm`
- **Accent**: `red-500` / `#ef4444`
- **Status badges**: light pills — `bg-green-100 text-green-700 border border-green-200` (live), `bg-yellow-100 text-yellow-700 border border-yellow-200` (draft)
- **Primary buttons**: `bg-red-500 hover:bg-red-600 text-white`
- **Inputs**: `border-slate-200 bg-slate-50 focus:border-red-500 focus:ring-red-500`

## Key Files

| File | Purpose |
|---|---|
| `lib/current-user.ts` | Demo auth shim — replace for SSO |
| `lib/assets.ts` | Shared thumbnail/label/meta helpers — always use these, never duplicate |
| `lib/events/index.ts` | `getRoomAnalytics()` — returns totalViews, uniqueVisitors, downloads, linkClicks, sectionViews |
| `lib/storage/index.ts` | `StorageAdapter` interface — swap for S3/Vercel Blob in production |
| `prisma/schema.prisma` | Full DB schema |
| `prisma/seed.ts` | Demo data — Acme Corp rooms, view events |

## Asset Types

Three types in the system: `file`, `link`, `richtext`. Handled in:
- `app/api/rooms/[id]/sections/[sectionId]/assets/route.ts` — POST (create)
- `lib/assets.ts` — display helpers shared across builder + portal
- `app/(seller)/rooms/[id]/components/AssetPicker.tsx` — UI for adding assets

## Common Tasks

**Add a seller page**: Create `app/(seller)/your-page/page.tsx`. Nav is in `app/(seller)/layout.tsx`.

**Add an API route**: Use `getCurrentUser()` for ownership, `prisma` from `lib/db.ts` for queries. See `app/api/rooms/[id]/route.ts` for a clean example — note the allowlist pattern on PATCH to avoid mass-assignment.

**Change DB schema**: Edit `prisma/schema.prisma` → `npx prisma migrate dev --name your-change` → update `prisma/seed.ts` → `npx prisma db seed`.

**Add a new asset type**: Update `app/api/.../assets/route.ts` (POST), `lib/assets.ts` (display), `AssetPicker.tsx` (UI tab).

## Docs

- [Architecture](docs/architecture.md) — data flow, component tree, design decisions
- [Development](docs/development.md) — setup, commands, conventions
- [Configuration](docs/configuration.md) — env vars, DB, storage, auth
- [Deployment](docs/deployment.md) — Vercel deploy, GTM Accelerator integration path
