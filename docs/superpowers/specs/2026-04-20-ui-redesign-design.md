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
| Card radius | `rounded-2xl` (14–16px) |
| Card shadow | `shadow-sm` (1px 3px, 4% opacity) |
| Card header bg | `slate-50` with `border-b slate-200` |
| Primary accent | Twilio red `#ef4444` (`red-500`) |
| Text / primary | `slate-900` |
| Text / secondary | `slate-700` / `slate-500` |
| Text / muted | `slate-400` |
| Focus ring | `ring-2 ring-red-500` |
| Input bg | `slate-50` with `border slate-200` |
| Button / primary | `bg-red-500 text-white hover:bg-red-600` |
| Button / ghost | `bg-white border-slate-200 text-slate-500 shadow-sm` |

Asset thumbnail tiles use gradient backgrounds by file type:
- PDF → `red-500` → `red-700`
- PPTX → `orange-500` → `orange-700`
- Link → `blue-500` → `blue-700`
- Note/Action → `purple-500` → `purple-700`

Status badges use light pill style: `bg-green-100 text-green-700 border-green-200` (published), `bg-yellow-100 text-yellow-700 border-yellow-200` (draft).

---

## 2. Global Nav

Sticky top nav, `h-14`, white background with `border-b slate-200`.

- **Left:** Brand mark (red `rounded-lg` box with "D") + "Deal Room" wordmark + `border-r` divider + breadcrumb (Dashboard › Room Name)
- **Right:** Live/Draft status pill + "Share to Community" ghost button + Publish/Unpublish red button + avatar circle
- Nav links (Dashboard, Community) move into the breadcrumb area as the primary wayfinding

---

## 3. Room Builder — Split-Screen Layout

The room builder (`/rooms/[id]`) switches from a single-column layout to a **two-column split-screen**:

```
┌─────────────────────────────────────┬──────────────────┐
│  Buyer View (live preview)          │  Editor Panel    │
│  ~60% width                         │  ~40% width      │
└─────────────────────────────────────┴──────────────────┘
```

### 3a. Left Panel — Buyer View

A live read-only preview of the customer-facing portal, rendered inside the builder. Labeled **"Buyer View"** with an eye icon and an "Open in new tab ↗" link.

The preview renders inside a white `rounded-xl shadow-md` frame with:
- Co-branded header (seller logo + divider + customer logo, or text fallbacks)
- Room title and prep date
- Section tab navigation (tabs update as the seller edits sections)
- Asset cards for the active tab — gradient thumbnail, type badge, name, description, action button
- Seller contact card at the bottom (name, title, email, "Email" + "Schedule a call" buttons)

The preview updates in real time as the seller edits content in the right panel. It is not interactive for editing — clicks on the preview do not trigger edit actions.

### 3b. Right Panel — Editor (tabbed)

Three tabs: **Content**, **Branding**, **Analytics**.

**Content tab (default):**
- Branding summary card at top — three fields (seller logo, customer logo, accent color) in a 3-column grid. Missing fields show an amber warning state.
- Section cards below, each as a white `rounded-xl` card with:
  - Card header: drag handle, emoji icon, section name, asset count, edit (✎) and delete (✕) icon buttons
  - Asset rows: gradient thumbnail tile (40×40px), asset name, metadata (size/date/domain), delete button on hover
  - "＋ Add asset" dashed button at the bottom of each section
- Active/focused section gets a red focus ring (`ring-2 ring-red-200 border-red-300`)
- Sections are reorderable by drag handle

**Branding tab:**
- Full branding editor (logo uploads, color picker, company name)

**Analytics tab:**
- Engagement stats: 2×2 metric tiles (Total views highlighted in red, Visitors, Downloads, Link clicks)
- "Views by section" bar chart (horizontal bars, red fill, section names + counts)
- Recent activity feed (visitor emails, download/click events, timestamps)
- "View full analytics →" link to `/rooms/[id]/analytics`

---

## 4. Customer-Facing Portal (`/r/[slug]`)

Replaces the current dark sidebar layout with a clean, content-first light design.

### Header
Sticky, white, `h-15`. Left: co-branded logos (seller logo box + `1px` divider + customer logo box, text fallbacks if no images). Right: room title + "Prepared by [seller name] · [date]".

### Section Navigation
Horizontal tab bar directly below the header, sticky. Each tab shows: emoji icon + section name + asset count pill. Active tab: `text-red-500 border-b-2 border-red-500`. Sections render as full pages — clicking a tab replaces the content area, no scrolling between sections.

### Content Area
Max-width `900px`, centered, `padding: 40px 32px`.

Each section shows:
- Section name as `text-2xl font-extrabold`
- Optional description in `text-slate-500`
- Asset grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `gap-14px`

**Asset cards:**
- `rounded-2xl`, white, `shadow-sm`, hover lifts with red border glow
- Top strip (100px): gradient background by file type, large type label (PDF/PPT/↗)
- Body: type badge pill, asset name (`font-bold`), description, file metadata
- Action button at bottom: "⬇ Download" for files, "↗ Open Link" for links — full-width, red background

### Seller Contact Strip
At the bottom of every section. White card with seller avatar (red circle, initials), name, title, email. Two action buttons: "Schedule a call" (ghost) and "✉ Email [name]" (red).

### Footer
Centered, muted: "Powered by **Twilio Deal Room** · This room was prepared exclusively for [Customer Name]"

---

## 5. Dashboard

Keeps single-column layout. Adopts new design system:
- Page background `slate-50`
- Room cards: white `rounded-2xl shadow-sm border-slate-200`
- Status badges updated to light pill style
- "Create Room" button: red primary
- Dark card hover states (`gray-800`) replaced with `hover:border-slate-300 hover:shadow-md`

---

## 6. What Changes vs. What Stays

| Area | Change |
|---|---|
| `globals.css` | New CSS variables, remove dark theme |
| `app/(seller)/layout.tsx` | New nav component |
| `app/(seller)/rooms/[id]/page.tsx` | Split-screen layout, tabbed editor |
| `app/(seller)/dashboard/page.tsx` | Design system update, light cards |
| `app/(customer)/[slug]/page.tsx` | Full rewrite — tabs replace sidebar |
| All Tailwind classes | Dark grays → slate palette, blue accent → red-500 |

No changes to: API routes, database schema, auth, Prisma models, asset upload logic, Twilio docs search, community library data model.

---

## 7. Out of Scope

- Mobile/responsive layout (desktop-first for now)
- Dark mode
- Animation / transitions beyond existing hover states
- New asset types or data model changes
