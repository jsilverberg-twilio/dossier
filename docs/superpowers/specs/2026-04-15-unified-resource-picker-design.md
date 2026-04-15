# Unified Resource Picker — Design Spec

**Date:** 2026-04-15
**Status:** Approved

## Summary

Replace the existing "Add Link" tab and the disabled "Twilio Docs" tab in the `AssetPicker` component with a single "Add Resource" tab. The new tab presents a source selector first — "Any URL" or "Twilio Docs" — then shows the appropriate form. Twilio Docs are fetched live from docs.twilio.com via a server-side Algolia proxy.

---

## 1. UI Changes

**Tab bar** (before → after):

| Before | After |
|--------|-------|
| Upload File | Upload File |
| Add Link | **Add Resource** |
| Write Note | Write Note |
| Twilio Docs *(disabled)* | *(removed)* |
| Live Demo *(disabled)* | Live Demo *(disabled, unchanged)* |

**Inside "Add Resource":**

1. **Source selector** — two tiles displayed first:
   - 🔗 **Any URL** — paste a link, fill title/description manually
   - 📄 **Twilio Docs** — search the Twilio docs library

2. **Any URL flow:**
   - URL input (required)
   - Title input (required)
   - Description textarea (optional)
   - Saves `Asset` with `type="link"`, `sourceType="manual"`

3. **Twilio Docs flow:**
   - Search input, debounced (300ms), queries `/api/docs/search?q=`
   - Empty query shows "Start typing to search…" prompt — no request is made
   - Results list: title + URL per result, click to select
   - Selected result auto-fills title, description, URL
   - **Save button** is hidden until a result is selected; once a result is selected it appears and is enabled
   - Saves `Asset` with `type="link"`, `sourceType="twilio-docs"`

**Visual style:** The new "Add Resource" tab content uses a neutral zinc/black/white palette with no blue accents (matching the approved mockup). Existing blue accents in the component (Save button `bg-blue-600`, focus rings `border-blue-500`/`ring-blue-500`, active tab underline `after:bg-blue-500`) are **not changed** — the style update applies only to the new source selector and docs search UI.

---

## 2. API Route

### `GET /api/docs/search?q=<query>`

- **Auth:** Public (no session required — docs are public)
- **Implementation:** Server-side handler calls the Twilio docs Algolia index
- **Credentials:** `TWILIO_DOCS_ALGOLIA_APP_ID` and `TWILIO_DOCS_ALGOLIA_SEARCH_KEY` stored in `.env.local` (read from docs.twilio.com page source — public, search-only keys)
- **Response:** `[{ title, url, description, category }]`
- **Caching:** None — results are always fresh from Algolia
- **Empty query:** Returns `[]` immediately without calling Algolia. The client must suppress the request entirely for empty/whitespace queries and instead show a "Start typing to search…" prompt in the results area.
- **Error handling:** If the Algolia request fails (network error, bad credentials, rate limit), the route returns `500` with `{ error: "Search unavailable" }`. The client renders an inline error message ("Search unavailable — try again") in the results area and keeps the form usable.

---

## 3. Adapter

New file: `lib/adapters/twilio-docs.ts`

```ts
import { AssetAdapter } from "./types";

export const twilioDocsAdapter: AssetAdapter = {
  sourceType: "twilio-docs",
  displayName: "Twilio Docs",
  enabled: true,
};
```

Mirrors the existing `lib/adapters/manual.ts` pattern.

---

## 4. Data Model

No schema changes required. The `Asset` model already has `sourceType` and `sourceRef` fields.

Twilio Docs assets are stored as:

| Field | Value |
|-------|-------|
| `type` | `"link"` |
| `sourceType` | `"twilio-docs"` |
| `url` | The doc URL |
| `sourceRef` | Algolia `objectID` |
| `title` | From search result |
| `description` | From search result (optional) |

The `AssetPicker` must append `sourceType` and `sourceRef` to the `FormData` it POSTs. The `/api/rooms/[id]/sections/[sectionId]/assets/route.ts` handler must be updated to read these fields and pass them to `prisma.asset.create`. Without this change, `sourceType` defaults to `"manual"` and `sourceRef` is lost.

The customer portal renders `link` assets without inspecting `sourceType`, so Twilio Docs links display correctly with no portal changes.

---

## 5. Files Touched

| File | Change |
|------|--------|
| `app/(seller)/rooms/[id]/components/AssetPicker.tsx` | Replace "Add Link" + "Twilio Docs" tabs with unified "Add Resource" tab |
| `app/api/docs/search/route.ts` | New — Algolia proxy |
| `app/api/rooms/[id]/sections/[sectionId]/assets/route.ts` | Update POST handler to read and persist `sourceType` and `sourceRef` from form data |
| `lib/adapters/twilio-docs.ts` | New — adapter metadata (informational only; no runtime registry exists yet) |
| `.env.local` | Add `TWILIO_DOCS_ALGOLIA_APP_ID`, `TWILIO_DOCS_ALGOLIA_SEARCH_KEY` |

---

## 6. Out of Scope

- `/api/meta` URL metadata auto-fetch (dropped — sellers type title manually)
- Live Demo tab (unchanged, still disabled)
- Admin UI for managing the docs catalog
- Caching Algolia results
