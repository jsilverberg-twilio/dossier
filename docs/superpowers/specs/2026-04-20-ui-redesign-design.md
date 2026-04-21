# UI Redesign — Design Spec

**Date:** 2026-04-20  
**Status:** Approved  
**Scope:** Full UI overhaul of the seller-side room builder and customer-facing portal. Dashboard and Community pages adopt the new design system but keep their single-column layout.

---

## 1. Design System

Replaces the current dark (`gray-950`) theme with the GTM Accelerator design language — the same system used in `apps/gtm-accelerator/` in the `twilio-internal/gtm-accelerator` repo.

| Token | Value |
|---|---|
| Page background | `slate-50` (`#f8fafc`) |
| Card background | `white` |
| Card border | `slate-200` (`#e2e8f0`) |
| Card radius | `rounded-2xl` |
| Card shadow | `shadow-sm` |
| Card header bg | `slate-50` with `border-b slate-200` |
| Primary accent | `red-500` (`#ef4444`) — intentional simplification of Twilio brand red `#F22F46`; exact brand token can be swapped in a follow-up |
| Text / primary | `slate-900` |
| Text / secondary | `slate-700` / `slate-500` |
| Text / muted | `slate-400` |
| Focus ring | `ring-2 ring-red-500` |
| Input bg | `slate-50` with `border slate-200` |
| Button / primary | `bg-red-500 text-white hover:bg-red-600` |
| Button / ghost | `bg-white border border-slate-200 text-slate-500 shadow-sm` |

Asset thumbnail tiles use gradient backgrounds by file type:
- PDF → `from-red-500 to-red-700`
- PPTX/PPT → `from-orange-500 to-orange-700`
- Link → `from-blue-500 to-blue-700`
- Note/Action item → `from-purple-500 to-purple-700`

Status badges use light pill style: `bg-green-100 text-green-700 border border-green-200` (published), `bg-yellow-100 text-yellow-700 border border-yellow-200` (draft).

---

## 2. Global Nav (seller side)

Sticky top nav, `h-14`, white background with `border-b border-slate-200`.

**Left side:**
- Brand mark: red `rounded-lg` box containing "D" + "Deal Room" wordmark
- `border-r border-slate-100` divider
- Breadcrumb: "Dashboard" (link) › "Room Name" (current page, non-link). On the dashboard, only "Dashboard" appears with no separator.

**Right side (room builder only):**
- Live/Draft status pill
- "Share to Community" ghost button
- Publish / Unpublish red primary button
- Seller avatar circle (initials, red bg) — no dropdown required

The Dashboard and Community links from the old nav are removed. Navigation back to Dashboard is via the breadcrumb. Community is accessible from the Dashboard page.

---

## 3. Room Builder — Split-Screen Layout

The room builder (`/rooms/[id]`) switches from a single-column layout to a **two-column split-screen**:

```
┌─────────────────────────────────────┬──────────────────┐
│  Buyer View (live preview)          │  Editor Panel    │
│  ~60% width (flex-1)               │  380px fixed     │
└─────────────────────────────────────┴──────────────────┘
```

Both panels sit below the sticky nav and fill `calc(100vh - 56px)` with `overflow-y-auto` independently.

### 3a. Left Panel — Buyer View

A read-only preview of the customer-facing portal rendered inline. Labeled **"Buyer View"** (eye icon) with "Open in new tab ↗" that opens `/r/[slug]`.

**Data flow:** The room builder page fetches room data server-side as before. A new `RoomContext` (new file: `app/(seller)/rooms/[id]/context.tsx`) is created as part of this work to hold room state at the page level. The current `page.tsx` is a plain async server component — it will be refactored to pass initial data into a new client wrapper that provides `RoomContext`. Mutations in the editor update `RoomContext` optimistically, so the buyer view re-renders without a network round-trip.

The preview renders a styled frame (`rounded-xl shadow-md bg-white border border-slate-200`) containing:
- Co-branded header: seller logo image (or red text box fallback) + `1px slate-200` divider + customer logo image (or gray text box fallback) + room title + prep date (right-aligned)
- Horizontal section tabs — one per section in order, with emoji icon + name + asset count. First tab active by default.
- Asset cards for the active tab (read-only, same visual design as Section 4)
- Seller contact card at the bottom

The preview is **not interactive for editing**. Clicks within the preview frame are ignored.

**Seller contact data source:** Comes from the authenticated seller's profile (`getCurrentUser()`). The seller's `name` and `email` fields are used. No per-room seller fields are needed.

**Empty state (no sections):** Show a centered placeholder inside the preview frame: "No sections yet — add one in the editor →" in `slate-400`.

### 3b. Right Panel — Editor (tabbed)

Fixed `w-[380px]`, white background, `border-l border-slate-200`. Three tabs at the top:

**Tab 1 — Content (default)**

- **Branding summary card** at top: 3-column grid with seller logo, customer logo, accent color. Fields with no value set show an amber `⚠ Missing` warning state. This is **cosmetic only** — missing branding does not block publishing. Clicking any field activates the Branding tab.
- **Section cards** below: each is a white `rounded-xl border-slate-200 shadow-sm` card with:
  - Card header (`bg-slate-50 border-b`): drag handle `⠿`, emoji icon (editable), section name, asset count, edit `✎` and delete `✕` icon buttons
  - Asset rows: 40×40px gradient thumbnail, asset name, metadata (file size + upload date for files; domain for links), delete button revealed on hover
  - `＋ Add asset` dashed button at the bottom of each section's asset list
- The section whose outline entry is active gets `border-red-300 ring-2 ring-red-100`
- **Section reordering:** drag-and-drop via drag handle. Order is persisted immediately on drop via the existing `PATCH /api/rooms/[id]/sections` (plural) bulk-reorder endpoint, which accepts an array of `{id, order}`. Optimistic update in `RoomContext`, revert on error.
- **Asset reordering:** same pattern. A new `PATCH` handler must be added to `app/api/rooms/[id]/sections/[sectionId]/assets/[assetId]/route.ts` (currently only implements `DELETE`). It accepts `{order: number}` and updates the asset's order field. This is new API work required by this spec.

**Empty state (new room, no sections):** Show a centered empty state card: "Add your first section to get started" with a `＋ Add Section` button.

**Tab 2 — Branding**

Full branding editor (existing `BrandingEditor` component, restyled). Fields: seller logo upload, customer logo upload, accent color picker, company name. The per-room accent color applies **only in the customer-facing portal** (`/r/[slug]`), not in the seller builder UI. The builder always uses `red-500`. The default accent color stored in new rooms must be updated from the current `#3b82f6` (blue) to `#ef4444` — this applies both in `BrandingEditor`'s initial state and in the customer portal's fallback when no branding is set.

**Tab 3 — Analytics**

- 2×2 metric tiles: Total views (highlighted with `bg-red-50 border-red-200`), Visitors, Downloads, Link clicks. All sourced from existing events data.
- "Views by section" — horizontal bar chart. Each row: section name (truncated), red bar scaled to max views, count. Pure CSS, no chart library needed.
- Recent activity feed: last 10 events, each showing avatar (initial circle), action text, timestamp. Events: `room_viewed`, `asset_viewed`, `link_clicked`.
- "View full analytics →" links to existing `/rooms/[id]/analytics` page.

**Empty state (draft / no views):** Replace metric tiles and activity feed with: "Publish your room to start tracking engagement."

---

## 4. Customer-Facing Portal (`/r/[slug]`)

Full rewrite of `app/(customer)/[slug]/page.tsx`. The sidebar is removed entirely, replaced by a horizontal tab bar. `tracker.tsx` (which fires `room_viewed`, `asset_viewed`, and `link_clicked` events via DOM event handlers) is not tied to the sidebar DOM structure and continues to work unchanged under the new layout.

### Header
Sticky, white, `h-16`, `border-b border-slate-200`, `shadow-sm`.
- Left: co-branded logos (seller logo image or red text box fallback + `1px slate-200` divider + customer logo image or gray text box fallback)
- Right: room name (`font-bold`) + "Prepared by [seller name] · [month year]" in `slate-400`

### Section Navigation
Sticky horizontal tab bar immediately below the header (`top-16`). White bg, `border-b border-slate-200`. Each tab: emoji icon + section name + asset count pill. Active: `text-red-500 border-b-2 border-red-500`. Clicking a tab replaces the content area — **no scroll-between-sections**; each section is a discrete view. Tab state is managed in component state (no URL change required).

### Content Area
`max-w-[900px] mx-auto px-8 py-10`.

Each section shows:
- Section name: `text-2xl font-extrabold text-slate-900`
- Optional description: `text-sm text-slate-500 mt-1 mb-7`
- Asset grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5`

**Asset cards** (`rounded-2xl bg-white border border-slate-200 shadow-sm`):
- Hover: `hover:-translate-y-px hover:border-red-300 hover:shadow-red-100 hover:shadow-md` transition
- Top strip `h-[100px]`: gradient bg by file type, large type label text (PDF / PPT / ↗ / NOTE) in white
- Body: type badge pill, asset name `font-bold text-slate-900`, description `text-sm text-slate-500`, file metadata `text-xs text-slate-400`
- Action button: full-width, `bg-red-500 text-white rounded-b-2xl py-2.5 text-sm font-bold`. Label: "⬇ Download" for files, "↗ Open Link" for links. Richtext/note assets show no action button.

**Loading state:** Show 3 skeleton cards (`animate-pulse bg-slate-100 rounded-2xl h-52`) while data loads.

**Error state (room not found or unpublished):** Next.js `notFound()` — existing behavior, unchanged.

### Seller Contact Strip
Rendered at the bottom of every section's content area, above the footer.
- White `rounded-2xl border border-slate-200 shadow-sm p-5`
- Left: seller avatar (red circle, initials, `w-11 h-11`), name `font-bold`, title hardcoded as "Account Executive · Twilio" (the `Seller` model has no `title` field; this is intentional placeholder copy for the demo), email in `text-red-500`
- Right: "Schedule a call" ghost button + "✉ Email [first name]" red button

### Footer
`border-t border-slate-100 py-5 text-center text-xs text-slate-400`. Copy is locked: **"Powered by Twilio Deal Room · This room was prepared exclusively for [room.customerName]"**

---

## 5. Dashboard

Keeps single-column layout. Adopts the new design system across all existing components:
- Page background `slate-50`
- Room cards: `bg-white rounded-2xl shadow-sm border border-slate-200`
- Card hover: `hover:border-slate-300 hover:shadow-md` (replaces dark bg hover)
- Status badges: updated to light pill style (see Section 1)
- "Create Room" button: red primary
- Shareable link row inside cards: replace green-dark treatment with `bg-slate-50 border border-slate-200 rounded-lg`

Scope: `app/(seller)/dashboard/page.tsx` only. No layout or data changes.

---

## 6. Files Changed

| File | Change |
|---|---|
| `app/globals.css` | New CSS variables, remove dark theme defaults |
| `app/layout.tsx` | Update font/body defaults |
| `app/(seller)/layout.tsx` | New nav component (replaces existing) |
| `app/(seller)/rooms/[id]/page.tsx` | Split-screen layout, RoomContext, tabbed editor |
| `app/(seller)/rooms/[id]/components/SectionList.tsx` | Restyled, drag-to-reorder with optimistic update |
| `app/(seller)/rooms/[id]/context.tsx` | **New file** — `RoomContext` provider |
| `app/(seller)/rooms/[id]/components/SectionList.tsx` | Restyled + drag-to-reorder |
| `app/(seller)/rooms/[id]/components/BrandingEditor.tsx` | Restyled + default accent color `#ef4444` |
| `app/(seller)/rooms/[id]/components/PublishButton.tsx` | Restyled |
| `app/(seller)/rooms/[id]/components/AssetPicker.tsx` | Restyled (dark-theme classes replaced) |
| `app/(seller)/rooms/[id]/components/ShareToCommunity.tsx` | Restyled to fit new nav |
| `app/(seller)/dashboard/page.tsx` | Design system update only |
| `app/(customer)/[slug]/page.tsx` | Full rewrite — tab nav replaces sidebar |
| `app/(customer)/[slug]/tracker.tsx` | Unchanged |
| `app/api/rooms/[id]/sections/[sectionId]/assets/[assetId]/route.ts` | **New** `PATCH` handler for asset reorder |

**Not changed:** All other API routes, Prisma schema, auth, asset upload logic, Twilio docs search, Community library, analytics data model.

---

## 7. Out of Scope

- Mobile/responsive layout (desktop-first)
- Dark mode
- Animations beyond hover transitions
- New asset types or data model changes
- Community page restyling (deferred)
- New room creation page restyling (deferred)
