# Skyhigh — Travel, Transport & Technology

Immersive, multi-page website for **Skyhigh Travel Bird Technology Private Limited** (CIN U79110UP2026PTC241002).
React + TypeScript + Vite, real-time Three.js scenes, scroll-driven storytelling, data-driven pages, a multi-step enquiry
workflow and a Supabase-backed admin panel. Deploys as a static site to GitHub Pages.

> _Your Journey, Our Responsibility – Taking You Higher!_

---

## Quick start

```bash
npm install
cp .env.example .env      # optional — the site runs without any configuration
npm run dev               # http://localhost:5173
```

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with HMR                                            |
| `npm run build`     | Type-check, production build, then sitemap/robots/404 (postbuild)  |
| `npm run preview`   | Serve the production build locally                                 |
| `npm run typecheck` | TypeScript project references (`tsc -b`)                            |
| `npm run lint`      | oxlint (ESLint-compatible rules incl. React hooks & a11y)           |
| `npm test`          | Vitest unit tests (validation, sanitising, CSV export)              |
| `npm run brand`     | Regenerate the SVG logo system in `public/brand`                    |
| `node scripts/build-setup-sql.mjs` | Rebuild `supabase/setup.sql` from the migrations          |
| `npm run check`     | All of the above in sequence                                        |

End-to-end smoke test (routes, links, mobile menu, form validation, filters, WebGL fallback, reduced motion) against a
running server:

```bash
npm run dev & node tests/e2e/smoke.mjs http://localhost:5173
```

It uses `@playwright/test`'s Chromium (`npx playwright install chromium`) or any Chrome via `CHROME_PATH=…`.

---

## What's inside

**Brand** — `public/brand/` contains the new "Ascending Swift" identity: horizontal, vertical, icon, white, dark, mono,
mobile-nav lockups, favicon, apple-touch-icon and OG image. Open `/brand/index.html` for the brand sheet. The mark geometry
lives in one place (`src/config/brandMark.ts`) and is shared by the React logo, the aircraft livery and the generator.

**3D**
- `components/three/HeroScene.tsx` — procedural twin-engine airliner (lathe fuselage with painted livery & windows,
  swept wings, nacelles, nav/strobe lights), physically-based materials with a local Lightformer environment (no HDR
  download), golden-hour sky shader, three parallax layers of sprite clouds, intro camera move, pointer parallax and a
  scroll-driven climb-out.
- `components/three/GlobeScene.tsx` — dot-matrix Earth rasterised from Natural Earth land polygons, atmosphere shader,
  hub/destination markers with hover labels (click opens the destination), animated route pulses.
- Lazy-loaded, paused when off-screen (`frameloop="never"`), adaptive DPR (`PerformanceMonitor`), lighter on mobile,
  resources disposed on unmount, `WebGLBoundary` + static artwork fallback. Force the fallback with `?nowebgl`.

**Storytelling** (`/`) — 01 Takeoff (hero) → brand intro → services index → 02 Explore (destinations) → 03 Connect
(globe) → 04 Move (transport & logistics) → values → mission & vision → 05 Arrive (enquiry). GSAP ScrollTrigger + Lenis;
nothing is pinned in a way that traps scrolling.

**Pages** — `/about`, `/services`, `/services/:slug` (6), `/destinations` (search + category filter, URL-synced),
`/destinations/:slug`, `/packages` (search, theme, duration, destination, sort), `/packages/:slug`, `/contact`
(enquiry + FAQ), `/privacy-policy`, `/terms-and-conditions`, `/404` (+ catch-all), `/admin`.

**Content** — typed models in `src/types/content.ts`, defaults in `src/data/*`. Services carry a `status`
(`proposed` | `operational`) shown on every surface; destinations and packages carry an `illustrative` flag. Prices are
never invented ("quoted on request"). When Supabase is configured, published rows override the bundled data.

**Photos** — 35 licensed Unsplash photos in `public/images/` (WebP, 1600w + 800w with `srcset`), listed in
`src/data/photos.json` and fetched by `node scripts/fetch-photos.mjs`. Anything without a photo falls back to the
seeded SVG artwork in `components/ui/Artwork.tsx`.

---

## Enquiries

The multi-step form (`components/sections/EnquiryForm.tsx`) validates each step with Zod (conditional fields for
passenger transport, goods, logistics and corporate), sanitises text, and adds spam friction (honeypot, minimum fill
time, client cool-down). Submission channels, in order:

1. **Supabase** (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) — insert-only via RLS; the database re-validates
   (CHECK constraints) and rate-limits (trigger: 5/hour per email, burst guard).
2. **Form endpoint** (`VITE_ENQUIRY_ENDPOINT`, e.g. Formspree) — JSON POST.
3. **Neither configured** — the form says clearly that online submission isn't connected and offers WhatsApp / email /
   copy-to-clipboard. **It never shows a fake success.**

## Admin panel (`/admin`)

A complete CMS so the business can run the website without a developer:

- **Pages & text** — every heading, paragraph, list and photo on Home, About, Services, Destinations, Packages,
  Contact, FAQ, Privacy and Terms (form-based editors; no code or JSON needed).
- **Destinations / Packages / Services** — add, edit, duplicate, hide/show, delete (owners), with photo pickers,
  day-by-day itinerary editor, highlights, inclusions, pricing text, map position and SEO text.
- **Photos** — drag-and-drop uploads (auto-resized and converted to WebP in the browser) to Supabase Storage, plus the
  35 bundled photos.
- **Enquiries** — search, filter, status, notes, WhatsApp/email reply, CSV export, delete (owners).
- **Contact & Google** — phone, WhatsApp, email, address, social links, SEO title/description/share image.
- **Sign-in** — one admin account, email + password (created in Supabase; public sign-ups are off).

Changes are live immediately (the site reads Supabase at runtime). Security is enforced in Postgres with Row Level
Security and `security definer` RPCs — see `supabase/migrations/`.

**Setup:** [ADMIN_SETUP.md](ADMIN_SETUP.md) (one-time, ~10 min). **Day-to-day guide (Hinglish):** [ADMIN_GUIDE.md](ADMIN_GUIDE.md).

In `npm run dev` only, `/admin` offers a **local preview** with in-memory sample data so the UI can be reviewed before a
backend exists. It is stripped from production builds.

---

## Configuration

See `.env.example`. Every `VITE_*` value is public (compiled into the bundle) — only publishable values belong there.

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical URL base, sitemap, OG tags |
| `VITE_BASE` | Public path (`/` locally, `/skyhigh-travel/` on GitHub Pages — set automatically in CI) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Live enquiries, admin, remote content |
| `VITE_ENQUIRY_ENDPOINT` | Alternative enquiry endpoint |
| `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_ADDRESS` | Contact channels (hidden when empty) |
| `VITE_GA4_ID`, `VITE_GTM_ID`, `VITE_META_PIXEL_ID` | Analytics — loaded only after cookie consent |

Tracked events: `cta_click`, `service_select`, `enquiry_start`, `enquiry_submit_success`, `whatsapp_click`,
`contact_click`.

## Deployment (GitHub Pages)

1. Create the repository `skyhigh-travel` and push `main`.
2. Settings → Pages → **Source: GitHub Actions**.
3. (Optional) Settings → Secrets and variables → Actions: secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`;
   variables for contact/analytics and `VITE_SITE_URL` if you use a custom domain.
4. `.github/workflows/deploy.yml` type-checks, lints, tests, builds and deploys on every push to `main`.

Direct deep links work: the build writes an `index.html` into every known route's folder (so each page answers
HTTP 200 for search engines) and copies it to `404.html` as the fallback for anything else. For a custom domain, set `VITE_BASE=/` and `VITE_SITE_URL`, and add a `CNAME`
file to `public/`.

## Project structure

```
src/
  animations/   GSAP setup, shared scene state
  components/
    layout/     Header (mega menu, mobile menu), Footer, Layout (Lenis, transitions), PageHero
    sections/   Home sections, EnquiryForm, PlanJourney
    three/      HeroScene, Aircraft, Atmosphere (sky, clouds), GlobeScene, WebGLBoundary
    ui/         Button, Logo, Artwork, Motion helpers, Cards, Seo, Chrome (cursor, loader, consent)
  config/       env, site/company info, brand mark geometry
  data/         services, destinations, packages
  hooks/        content provider, media queries, WebGL detection
  pages/        route components + admin/
  services/     supabase, content, enquiry (+ schema), analytics, adminApi
  styles/       Tailwind v4 theme tokens & utilities
  types/        content models
supabase/migrations/   schema, RLS, triggers
scripts/               brand generator, postbuild (sitemap/robots/404), social image renderer
tests/                 unit tests + e2e smoke script
```

## Before launch — business checklist

- [ ] Add real contact details (env or admin) and social links.
- [ ] Review the **draft** privacy policy and terms with legal advisers (pages are flagged as drafts).
- [ ] Switch each service to `operational` only once it is genuinely live.
- [ ] Replace illustrative destinations/packages and add photography you hold rights to.
- [ ] Confirm the registered address before displaying it.
- [ ] Run Lighthouse on the deployed URL and on a real mid-range phone.
