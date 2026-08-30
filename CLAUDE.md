# Nehoray Leizer — Project Context

A memorial e-commerce clothing brand site for Nehoray Leizer. Premium pre-order
clothing, profits/spirit tied to his memory. Hebrew/RTL throughout. Ralph
Lauren-ish editorial look: cream/charcoal palette, Cormorant Garamond serif +
Inter sans.

**Brand name is "Nehoray Leizer" only.** An earlier "LAZER" prefix was removed
site-wide — don't reintroduce it (the GitHub repo name `lazer-brand` and a few
internal identifiers like `lazer_cart`/`lazer_wishlist` localStorage keys are
the only places the old name still lives; leave those as-is, just don't add
new user-facing "LAZER" text).

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (Postgres + Storage) — project `qjwplfwwpdekyfacmven`
- Hosted on Vercel, domain `nehorayleizer.com` (GitHub repo `edenasraf3112/lazer-brand`, branch `main` auto-deploys)
- Admin auth: simple cookie (`admin_session`) checked against `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars — not Supabase Auth
- Key libs: `framer-motion` (animations), `lucide-react` (icons), `react-hot-toast` (toasts), `xlsx` (admin export buttons)

## Development workflow

```
npm install
cp .env.local.example .env.local   # fill in real Supabase keys + admin creds
npm run dev      # localhost:3000
npm run build    # production build (also what Vercel runs)
npm run lint      # next lint
```

Required env vars (see `.env.local.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD`. There is no test suite — verify changes by
running the dev server and exercising the relevant page/admin flow manually.

There's no migrations folder/CLI — schema changes are SQL pasted by hand into
Supabase's SQL Editor (see the Supabase section below).

## Repository structure

```
app/
  (shop)/            storefront route group — public pages, RTL, cream/charcoal theme
    home, shop/[category], product/[id], past-collections, story,
    cart, favorites, account, search, contact, shipping, terms
  admin/              admin panel — protected by middleware.ts
    products, collections, orders, customers, discounts, popups,
    messages, story, content, login
  api/
    admin/            server-side mutation routes, all gated on admin_session cookie
    collections-list, logo-url   public read-only routes
  page.tsx            redirects "/" -> "/home"
  layout.tsx          root layout (shop). admin/layout.tsx is a separate <html> shell
components/           shared storefront components (Navbar, Footer, HeroSlider,
                      StoryContent, AutoVideo, ProductCard, CommunityQuotesSection, ...)
components/admin/     admin-only form components (ProductForm, CollectionForm,
                      PopupForm, AdminShell — sidebar nav shell)
contexts/             CartContext, WishlistContext — both client-side, localStorage-backed
lib/                  supabase.ts (clients + DB types), utils.ts (formatters), storyDefaults.ts
supabase/schema.sql   base schema; several columns/tables were added later via ad-hoc SQL (see below)
middleware.ts         redirects unauthenticated /admin/* requests to /admin/login
```

Routing notes: the storefront lives entirely under the `(shop)` route group
(doesn't affect URLs); `/` is a server redirect to `/home`. Admin pages render
through `AdminShell` (`components/admin/AdminShell.tsx`), which renders the
charcoal sidebar nav — add new admin sections to its `NAV` array.

## Critical architecture rule — READ BEFORE TOUCHING ADMIN CODE

**Never call `getServiceClient()` or `supabase.storage.from(...).upload()` directly from a `'use client'` component.** The service-role key is a server-only secret and Next.js does not inline it into the browser bundle — calling it client-side silently produces a broken Supabase client (this was a real, shipped bug: ProductForm/CollectionForm/ContentEditor/StoryEditor "saves" were no-ops for a while).

The fix in place: every admin mutation goes through a server-side route under `app/api/admin/*` that checks the `admin_session` cookie and only then uses `getServiceClient()`. The convention in every existing route is the same `isAuthed()` helper:

```ts
function isAuthed(): boolean {
  return !!cookies().get('admin_session')?.value
}
```

Follow this pattern for any new admin route — check at the top of every handler, return 401 if absent, only call `getServiceClient()` after the check passes.

Existing routes:
- `app/api/admin/auth` — login (sets cookie)/logout (clears cookie); password check is a plain string compare against `ADMIN_USERNAME`/`ADMIN_PASSWORD`, no hashing
- `app/api/admin/site-content` — upsert key/value pairs (used by ContentEditor, StoryEditor, HeroSlidesEditor)
- `app/api/admin/products` — create/update product
- `app/api/admin/collections` — create/update collection + sync which products belong to it
- `app/api/admin/quotes` — delete a community quote
- `app/api/admin/upload` — generic file upload to a storage bucket (`products`, `collections`, `story`, `branding`)
- `app/api/admin/upload-logo`, `app/api/admin/set-logo-url` — logo specifically
- `app/api/logo-url`, `app/api/collections-list` — public read-only

`middleware.ts` separately gates page access: any `/admin/*` route except `/admin/login` redirects to login if the `admin_session` cookie is missing. It only checks presence, not validity — the cookie itself isn't a signed/verified token, just a base64 blob set on successful login. This is fine for the current single-admin-user scope; don't treat it as a real session token if extending auth.

**Fixed 2026-07-09 (two parallel sessions, now merged):** every admin mutation that used to call `getServiceClient()` directly from a `'use client'` component has been routed through an `app/api/admin/*` route. Popups (`app/api/admin/popups/[id]`, plus the advanced popup builder), product delete (`app/api/admin/products/[id]`, also cleans up storage images), and order status updates (`app/api/admin/orders/[id]`) were fixed on the phone-session side with a RESTful `/[id]` route pattern — prefer that pattern for new order/product/popup routes. Discount codes (`app/api/admin/discounts`) were fixed separately (flat route, id in body) and never touched by the other session. Note the repo now has **two coexisting conventions** — RESTful `/api/admin/<resource>/[id]` (newer, preferred) vs. flat `/api/admin/<resource>` with id in the request body (older) — don't be surprised to see both; check which one a given component already calls before adding a new mutation.

## Storefront state — cart, wishlist, checkout

`CartContext` and `WishlistContext` (`contexts/`) are both `'use client'` providers that persist to `localStorage` (`lazer_cart`, `lazer_wishlist`) — nothing is written to Supabase until checkout. Both wrap the app in `app/layout.tsx`. `AuthContext` (Google/Apple OAuth via Supabase Auth) also wraps the shop layout — see the Auth section below.

Checkout now goes through `app/api/submit-order/route.ts` (server-side) rather than a direct anon-client insert from `app/(shop)/cart/page.tsx` — check that route before assuming the old direct-insert behavior described in earlier docs still applies. Discount code validation (`applyDiscount`) still reads `discount_codes` straight from the anon client client-side, relying on the public-read RLS policy; verify server-side re-validation/`used_count` enforcement in `submit-order` before treating a code's `max_uses` as strictly enforced.

## Orders admin — Phase 1 upgrades (2026-07-09)

The user gave a large 15-item feature wishlist for the orders/admin area with an explicit priority order (see conversation). Phase 1 (shipped): dashboard "total items ordered" KPI (sums `items[].quantity` across all orders, not order count — [app/admin/page.tsx](app/admin/page.tsx)), a production-sheet export with he/en language choice, **xlsx or PDF format**, and collection/product/date-range/**status-checkbox** filters ([app/api/admin/production-sheet/route.ts](app/api/admin/production-sheet/route.ts), [app/admin/orders/ProductionSheetExport.tsx](app/admin/orders/ProductionSheetExport.tsx)) — **default is `paid`-or-later, not hardcoded**: the user found the export came back completely empty because every real order in the system is still `received`, so status is now a per-export checkbox list (defaults to paid+ checked) rather than a fixed filter, a debounced smart search box across customer/phone/email/order-id/product-name ([app/admin/orders/OrdersSearchBar.tsx](app/admin/orders/OrdersSearchBar.tsx)), and an inline internal-notes editor per order ([app/admin/orders/OrderNotes.tsx](app/admin/orders/OrderNotes.tsx) — the `orders.notes` column already existed in schema.sql, just had no UI/route wired to it).

**PDF export (added 2026-07-09):** renders an HTML table through a headless browser rather than a PDF-drawing library — this was the only reliable way found to get correct Hebrew/RTL glyph shaping and layout without manually embedding a Hebrew font and reordering bidi text by hand. Uses `puppeteer-core` + `@sparticuz/chromium` (chromium's `executablePath()`/`args` on Vercel, a local Chrome/Edge install path on dev machines — see `LOCAL_CHROME_PATHS` in the route). Both packages must be listed in `next.config.js`'s `experimental.serverComponentsExternalPackages`, otherwise webpack tries to bundle puppeteer's Node-only CLI code and fails to compile (private class fields / ESM-in-CJS errors). If this route ever needs to run on Vercel's Hobby-tier serverless function size limit, watch it — `@sparticuz/chromium` is sized for that specifically, but it's still a large dependency for one feature.

**Deployment gotcha (hit in production 2026-07-09, fixed same day):** `serverComponentsExternalPackages` alone was NOT enough — the route deployed but crashed at runtime with `The input directory ".../@sparticuz/chromium/bin" does not exist`. Reason: Vercel's output file tracing only follows static `require()`/`import` references, but `chromium.executablePath()` reads its `.br` binary tarballs dynamically via `fs` at runtime, so tracing silently excluded them from the deployed function. Fixed by adding to `next.config.js`:
```js
experimental: {
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
},
```
Verify this is still needed (and still working) after any Next.js major-version upgrade — `outputFileTracingIncludes` has moved/changed shape across Next versions before. To confirm it's actually bundling the binaries, check `.next/server/app/api/.../route.js.nft.json` after a local build and grep for `sparticuz/chromium/bin` — if it's missing, the config key or glob pattern silently isn't matching.

Production sheet PDF and the packing-slip print page (`app/admin/orders/[id]/print/page.tsx`) both show the site logo centered at the top — resolved from `site_content.logo_url` (same key `/api/logo-url` uses), falling back to `/assets/branding/brand-logo.png`. The PDF route embeds it as a base64 data URI, always fetched over HTTP (`new URL(logoUrl, req.url)` so it works against both `localhost:3000` and the real domain) — **do not switch this to reading `public/` via `fs`**, that was tried first and silently failed in production (returned `null`, so the PDF generated with no logo, no error) because Vercel serves `public/` through its static-asset layer, not necessarily on the serverless function's own filesystem. `getLogoDataUri()` takes `req.url` as a parameter specifically so it always has a real origin to resolve the relative path against.

**Phase 2 + 3 shipped 2026-07-09** (all remaining items from the wishlist except numeric per-size/color inventory, which the user explicitly said to leave for later — current boolean out-of-stock model is fine as-is):
- Order detail page + packing slip: [app/admin/orders/[id]/page.tsx](app/admin/orders/[id]/page.tsx), print view auto-calls `window.print()` at [app/admin/orders/[id]/print/page.tsx](app/admin/orders/[id]/print/page.tsx)
- Order status timeline: `order_status_history` table (new — see migration below), a row is inserted whenever `app/api/admin/orders/[id]` PATCH receives a `status` field (this route also runs `logActivity` for every order update, and its `DELETE` handles the phone session's trash/permanent-delete), plus a DB trigger inserts the first row on order creation. There's no separate flat `app/api/admin/orders/route.ts` anymore — it was removed as a duplicate once `OrderNotes`/`OrderTags` were switched to the same `[id]` route `OrderStatusUpdater` already used.
- Order tags: `orders.tags` TEXT[] column (new), UI in [app/admin/orders/OrderTags.tsx](app/admin/orders/OrderTags.tsx), filterable from the orders list
- Analytics: `analytics_events` table (new) fed by a public `/api/analytics/track` route, tracked from [components/AnalyticsTracker.tsx](components/AnalyticsTracker.tsx) (page views, mounted only in `(shop)/layout.tsx` — deliberately NOT in the root layout, so admin traffic never pollutes storefront analytics), product-view tracking in the product page, add-to-cart tracking in `CartContext`, checkout-start tracking in the cart page. Viewed at [app/admin/analytics/page.tsx](app/admin/analytics/page.tsx) — funnel + hand-rolled CSS/SVG-free bar charts ([app/admin/analytics/BarChart.tsx](app/admin/analytics/BarChart.tsx), no charting library added) for revenue/orders/items-by-day and best-selling products/sizes/most-viewed products, all derived from the existing `orders` table — no dependency needed for those. Conversion rate = completed orders / page views.
- Segmented email campaigns: [app/admin/emails](app/admin/emails/page.tsx) + [app/api/admin/emails/route.ts](app/api/admin/emails/route.ts), sends via **Resend's REST API directly with `fetch`** (no SDK dependency added) — requires `RESEND_API_KEY` env var (not yet set; the emails page shows a banner until it is) and optionally `EMAIL_FROM`. "Waitlist" segment = `messages` rows with `subscribe = true`; there's no dedicated customers/waitlist table, segments are derived from `orders`/`messages` each time.
- Activity log: `activity_log` table (new), written via [lib/activityLog.ts](lib/activityLog.ts)'s `logActivity()` helper (best-effort, swallows errors so a missing table never breaks the calling mutation) — called from the products/collections/discounts/popups/orders API routes. Viewed at [app/admin/activity/page.tsx](app/admin/activity/page.tsx). Actor is currently always `'admin'` (single admin account, per CLAUDE.md's simple-cookie auth) — the column exists for when multi-admin auth is added later.
- Internal task board: `admin_tasks` table (new), simple checklist at [app/admin/tasks/page.tsx](app/admin/tasks/page.tsx).

**SQL migration required** — none of the above tables/columns exist yet. Paste this into Supabase's SQL Editor and confirm it ran before relying on these features (until then, the affected admin pages show an orange "not set up yet" banner instead of crashing):

Written idempotently (`IF NOT EXISTS` / `DROP ... IF EXISTS` guards) because Supabase's SQL Editor runs the whole paste as one transaction — one statement erroring (e.g. `orders.tags` already existing from an earlier partial attempt) silently rolls back every other statement in the same run too. Safe to paste and re-run as many times as needed.

```sql
-- Order status timeline
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role order_status_history all" ON order_status_history;
CREATE POLICY "Service role order_status_history all" ON order_status_history FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION log_order_status_history() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_status_history (order_id, status) VALUES (NEW.id, NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_status_history_insert_trigger ON orders;
CREATE TRIGGER order_status_history_insert_trigger
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_history();

-- Order tags
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','product_view','add_to_cart','checkout_start')),
  product_id UUID,
  path TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role analytics_events all" ON analytics_events;
CREATE POLICY "Service role analytics_events all" ON analytics_events FOR ALL USING (auth.role() = 'service_role');

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT DEFAULT 'admin',
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role activity_log all" ON activity_log;
CREATE POLICY "Service role activity_log all" ON activity_log FOR ALL USING (auth.role() = 'service_role');

-- Internal task board
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role admin_tasks all" ON admin_tasks;
CREATE POLICY "Service role admin_tasks all" ON admin_tasks FOR ALL USING (auth.role() = 'service_role');

-- FAQ (per-product only — the general FAQ page reuses site_content, see below)
ALTER TABLE products ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]';
```

## FAQ (added 2026-07-09)

Two independent FAQ surfaces, both rendered by the same shared [components/FAQAccordion.tsx](components/FAQAccordion.tsx) (single-open-at-a-time, animated with a `ref`-measured `scrollHeight` → `max-height` transition per row — the "prettier" pure-CSS `grid-template-rows: 0fr → 1fr` trick was tried first but the `fr` unit resolved to a computed `0px` in this environment even when "open", so don't reintroduce it without verifying it actually expands, not just that the state toggles. No framer-motion/AnimatePresence precedent existed in the codebase so this was the simpler choice anyway):

- **Per-product FAQ**: `products.faqs` — new `JSONB DEFAULT '[]'` column, array of `{id, question, answer}`. Edited in [components/admin/ProductForm.tsx](components/admin/ProductForm.tsx) (mirrors the existing `StoryEditor.tsx` timeline-block pattern: add/remove/▲▼-reorder, no drag-and-drop library — this codebase doesn't use one anywhere). Rendered on [app/(shop)/product/[id]/page.tsx](app/(shop)/product/[id]/page.tsx) right after the description block, only if the array is non-empty. Requires the SQL above — until it's run, `product.faqs` is just `undefined` and the section silently doesn't render (no crash).
- **General FAQ page**: stored as a JSON blob in `site_content` under key `faq_data` (same pattern as `story_data`/`hero_slides` — no new table, reuses `/api/admin/site-content`), each item `{id, question, answer, is_active}`. Public page at [app/(shop)/faq/page.tsx](app/(shop)/faq/page.tsx) filters to `is_active !== false`; admin editor at [app/admin/faq/page.tsx](app/admin/faq/page.tsx) + [FAQEditor.tsx](app/admin/faq/FAQEditor.tsx) shows everything (dimmed if inactive). [lib/faqDefaults.ts](lib/faqDefaults.ts) has `DEFAULT_FAQ_DATA` (12 seeded questions) as the fallback before anyone has saved from the admin page — same fallback-to-defaults convention as `DEFAULT_STORY_DATA`. Linked from the footer (`components/Footer.tsx`) and `/admin` sidebar nav.

**Testing gotcha hit while building this:** don't put Hebrew text literally inline in a `curl -d '...'` argument in Git Bash on Windows — it silently mangles to `?` characters before curl ever sees it (confirmed by comparing the DB row content directly vs. what actually got sent). Write the JSON payload to a file and use `--data-binary @file` instead, like `notes-payload.json` pattern used earlier in this project's history.

`components/StoryContent.tsx` renders `StoryData` = `{ heroImage, heroTitle, heroSubtitle, blocks: StoryBlock[] }`. Everything below the hero is a `StoryBlock`, fully admin-reorderable/deletable, no fixed sections:

- `short_text`, `long_text` — paragraphs
- `gallery` — image grid
- `video` — `components/AutoVideo.tsx`, auto-detects intrinsic aspect ratio on `loadedmetadata`, never hardcode width/height
- `timeline` — the "מאדם למותג" year+text list
- `community_quotes` — `components/CommunityQuotesSection.tsx`: public visitors submit a name + ≤50-char "אמירה" via the `community_quotes` table (public insert RLS policy), rendered as a floating quote cloud over a blurred crossfading background (uses the block's own `images`, falls back to `heroImage`)

Editor: `app/admin/story/StoryEditor.tsx`. Data stored as JSON in `site_content` under key `story_data`. `lib/storyDefaults.ts` has `DEFAULT_STORY_DATA` and `normalizeStoryData()` — the latter migrates the old pre-blocks shape (separate top-level `timeline`/`gallery` fields) so previously-saved content doesn't break. If you change `StoryBlock` shape again, extend `normalizeStoryData`, don't just swap the type.

Homepage hero slider (`components/HeroSlider.tsx`) follows the same pattern: `site_content.hero_slides` (JSON array), editor in `app/admin/content/HeroSlidesEditor.tsx`.

## Size charts (added 2026-07-22)

Admin nav "טבלאות מידות" (`app/admin/size-charts/`) manages a reusable library of size-chart tables, each a standalone `size_charts` row a product can reference by `size_chart_id` (FK, `ON DELETE SET NULL`) — products hold a reference, not a copy, so editing a published chart updates every product using it immediately.

- **Data model** (`lib/supabase.ts`): `SizeChart` has `internal_name`/`title`/`description`/`category`/`unit` (`cm`|`in`)/`status` (`draft`|`published`)/`data`. `data: SizeChartData` is `{ rows: SizeChartCell[][], colWidths?, rowHeights? }`; each `SizeChartCell` is `{ value, style? }` with `style.tag` (`normal`|`h1`|`h2`|`h3` — visual/typographic presets only, see below) plus explicit overrides (bold, underline, align, fontFamily, fontSize, fontWeight, color, bg, border, padding). Cell values are sanitized (`lib/sizeChartValidation.ts` `sanitizeCellValue` strips tags/control chars) — never raw HTML.
- **Editor** (`components/admin/SizeChartGridEditor.tsx` + `components/admin/SizeChartEditor.tsx`): a from-scratch Excel-like grid (CSS Grid, not a library) with row/column gutters for whole-row/whole-column selection, shift-click and drag-select for ranges, a toolbar (font size/family/weight/bold/underline/align/colors/border/padding + heading-tag preset), add/delete/duplicate/reorder row & column, drag-to-resize column width/row height, copy/paste via the system clipboard (TSV, values only — not styles), undo/redo (Ctrl+Z/Y, 50-step history), and Delete/Backspace to clear a selection. `lib/sizeChartTemplates.ts` has starter templates (shirts, oversized shirts, hoodies, pants, blank) plus the "סוג בגד" category list.
- **H1/H2/H3 are not real heading elements** — they're per-cell font-size/weight/family presets for visual hierarchy inside the table only. The actual `<thead>`/`<th scope="col">`/`<th scope="row">` structure in the customer-facing renderer (`components/SizeChartDisplay.tsx`, shared between the admin preview and the storefront) is derived structurally from position (row 0 = column headers, column 0 of body rows = row headers), never from the tag, so the page never gets stray `<h1>`s.
- **Product integration**: `ProductForm.tsx` has a "טבלת מידות" section (positioned above the FAQ section, matching the existing FAQ-just-under-description convention) with a select over all charts (service-fetched server-side into the page, `sizeCharts` prop; a "רענן רשימה" button re-fetches from `GET /api/admin/size-charts` client-side so a chart created in a separate tab shows up without a full reload), preview, "פתח לעריכה" (opens `/admin/size-charts/[id]` in a new tab), and remove. Drafts show `(טיוטה — לא מוצג ללקוח)` in the option label since the storefront only ever fetches `status = 'published'` charts (enforced by RLS, not just app logic).
- **Storefront**: `app/(shop)/product/[id]/page.tsx` fetches the chart client-side (anon client, RLS-gated to published) when `product.size_chart_id` is set, renders nothing if there's no chart, otherwise shows a "טבלת מידות" link next to the size selector (smooth-scrolls to the chart) and the chart itself between the description and FAQ blocks. Mobile: horizontal scroll inside the table only (`overflow-x-auto`), first column sticky, no page-level horizontal scroll.
- **API routes** (RESTful `/[id]` pattern, per the repo's preferred newer convention): `app/api/admin/size-charts/route.ts` (GET list with per-chart `product_count`, POST create), `app/api/admin/size-charts/[id]/route.ts` (GET/PATCH/DELETE), `app/api/admin/size-charts/[id]/duplicate/route.ts` (POST, always creates the copy as `draft` regardless of the original's status). All gated on the standard `isAuthed()` cookie check before `getServiceClient()`, per the critical-architecture-rule at the top of this file.
- **Version history**: every PATCH inserts a snapshot into `size_chart_versions` (trimmed to the 20 most recent per chart); the editor's "היסטוריה" panel lets you load an old snapshot back into the grid (you still have to hit "שמור טיוטה" to confirm it — restoring doesn't auto-save).
- **Deletion**: `products.size_chart_id` is `ON DELETE SET NULL`, so deleting a chart in use silently unassigns it from those products — the list page's delete button shows the live `product_count` in its confirm dialog specifically so that's never a surprise.
- **Gotcha hit while building this**: a `useRef`-guarded "skip the first effect run" pattern for dirty-tracking (`if (!mounted.current) { mounted.current = true; return }`) breaks under React 18 Strict Mode's dev-only double-invoke of effects — the ref survives the double-invoke, so the *second* invocation sees `mounted.current` already `true` and fires immediately after mount, making the form dirty (and the "confirm before losing changes" dialog fire) before the user touched anything. Fixed by dropping the effect entirely and marking `dirty` explicitly inside each mutating setter (`updateFields`/`updateGridData`) instead of watching state via `useEffect`. Don't reintroduce the watch-and-skip-first-run pattern for dirty-tracking elsewhere in the admin.

## Supabase

Real project is connected (not placeholder). Schema in `supabase/schema.sql` plus several follow-up `ALTER TABLE`/`CREATE TABLE` statements run ad-hoc through the SQL Editor for: `out_of_stock_sizes`/`out_of_stock_colors` on `products`, `requested_collections` on `messages`, the `story` storage bucket, and the whole `community_quotes` table. There is no migrations folder — if you add a column/table, give the user the SQL to paste into Supabase's SQL Editor and ask them to confirm it ran.

Tables defined in `supabase/schema.sql`: `products`, `collections`, `orders`, `messages`, `discount_codes`, `popups`, `site_content` (plus `community_quotes` added later, not in the base file). Every table has RLS enabled with a "public read" + "service role all" policy pair; `orders`/`messages`/`community_quotes` additionally allow public **insert** (no read) since visitors submit them anonymously.

Storage buckets: `products`, `collections`, `story`, `branding` — all public-read. Service role bypasses RLS by Postgres design, so once an upload goes through `/api/admin/upload`, no extra storage policy is needed.

`.env.local` and `.env.vercel` hold real Supabase keys and are gitignored (an earlier commit did leak `.env.vercel` with admin credentials — it was removed from tracking but is still in git history; the admin password was never rotated after that).

## Per-variant stock

Products have `in_stock` (whole product) plus `out_of_stock_sizes`/`out_of_stock_colors` (arrays) for marking specific size/color combos as sold out without hiding the product. Enforced in `ProductForm.tsx` (admin toggle UI) and `app/(shop)/product/[id]/page.tsx` (storefront — disables the specific button, blocks add-to-cart for that selection).

## Collections ↔ products

A product has one `collection_id`. The "which products are in this collection" UI lives in `CollectionForm.tsx` as a checkbox list over all products — saving diffs the selection against current `collection_id` values and reassigns server-side (see `app/api/admin/collections/route.ts`).

## Contact page

Three message types (`family_message`, `collection_request`, `general`). For `collection_request`, the message body is optional — visitor can instead multi-select existing collections (fetched from `/api/collections-list`, names stored in `messages.requested_collections`).

## Design tokens

Defined in `tailwind.config.ts` — reuse these rather than introducing new ad-hoc colors/fonts:
- Colors: `cream` (#FAFAF8), `cream-dark` (#F2F0EC), `charcoal` (#1A1A1A), `warm-gray` (#6B6560), `light-gray` (#E8E5E0), `red-brand` (#C41E3A, used for sale prices/errors/wishlist heart)
- Fonts: `font-serif` = Cormorant Garamond (headings, prices), `font-sans`/default = Inter (body)
- Animations: `animate-fade-in`, `animate-fade-up`, `animate-slide-in` keyframes already defined — prefer these or `framer-motion` over new custom CSS animations

## Misc conventions

- Mobile navbar deliberately stays minimal: hamburger + centered logo + cart only. A fuller icon row was tried and explicitly reverted — don't re-add it without being asked.
- Logo is served via `/api/logo-url` (reads `site_content.logo_url`, falls back to `/assets/branding/brand-logo.png`) so it can be swapped from the admin without a redeploy.
- Footer social icons use the `font-handwriting` CSS class (`Shofar` font) for a script feel — there's no real Hebrew cursive webfont available, this is the closest approximation in use; stay consistent with it rather than introducing another font.
- `www.nehorayleizer.com` is a Vercel domain redirect (308) to the apex domain — don't remove it, it was added specifically to kill a stale Google index entry from the domain's previous owner.
- `next.config.js` whitelists remote image hosts for `next/image` — `*.supabase.co` (storage) and `images.unsplash.com` (placeholder/seed imagery). Add new hosts there before using them in an `<Image src>`.
