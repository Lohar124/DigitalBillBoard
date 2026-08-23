# Digital Billboard

A real-time pay-to-rank public billboard and leaderboard site built with Next.js and shadcn/ui. Entries compete for billboard positions by claiming a spot at a higher bid, with a live leaderboard, trending/activity feeds, and per-entry metadata.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shadcn-labs/outbid-template)

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components (in `components/ui`)
- [Supabase](https://supabase.com) (Postgres) — leaderboard storage
- [Upstash Redis](https://upstash.com) — caches leaderboard reads
- [Polar](https://polar.sh) — checkout for outbidding a listing
- [Umami](https://umami.is) — analytics
- TypeScript

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app. The dev server supports Fast Refresh, so edits to `app/` and `components/` show up immediately.

Other scripts:

```bash
pnpm build       # production build
pnpm start       # run the production build
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write
```

## Project structure

```
app/
  page.tsx                    # home page (leaderboard, trending, activity)
  about/, rules/, stats/, friends/   # static/info pages
  api/
    fetch-meta/route.ts       # fetches title/description/favicon for a URL
    leaderboard/route.ts      # GET: cached leaderboard read (Redis -> Supabase)
    checkout/route.ts         # POST: validates a bid, creates a Polar checkout
    webhooks/polar/route.ts   # Polar order.paid webhook -> writes to Supabase, busts cache
components/
  ui/                    # shadcn/ui primitives (Button, Card, Sheet, ...)
  header.tsx, footer.tsx, hero-section.tsx
  leaderboard-list.tsx, leaderboard-card.tsx, leaderboard-card-skeleton.tsx
  trending-section.tsx, latest-activity.tsx
  mobile-layout.tsx, app-sidebar.tsx
  umami-analytics.tsx
lib/
  leaderboard-data.ts    # types + static seed data (used until Supabase is configured)
  leaderboard.ts         # cache-aside read (Redis) + cache invalidation
  supabase/server.ts     # service-role Supabase client (server-only)
  redis.ts               # Upstash Redis client
  polar.ts               # Polar SDK client
  utils.ts               # `cn()` class-merging helper
supabase/
  schema.sql             # leaderboard_entries + bids tables
hooks/
  use-mobile.ts
```

## Customizing for your own project

- **Branding** — the site name (`outbid.lol`) and nav links live in `components/header.tsx`; update the footer in `components/footer.tsx`.
- **Copy pages** — `app/about`, `app/rules`, `app/friends`, and `app/stats` are placeholder content pages; edit or remove as needed.
- **Link metadata** — `app/api/fetch-meta/route.ts` scrapes the `<title>`, meta description, and favicon for a given URL at request time. If you don't need live metadata, you can store it alongside your leaderboard data instead.
- **Theme** — colors and design tokens live in `app/globals.css`; the `ThemeProvider`/`ThemeToggle` components support light/dark mode out of the box.

## Adding shadcn/ui components

```bash
npx shadcn@latest add <component>
```

This places new components in `components/ui`. Import them as:

```tsx
import { Button } from "@/components/ui/button"
```

The base `Card` component (`components/ui/card.tsx`) already ships with `border border-border` baked in — don't add an extra `border` class on top of it, or you'll get a double border.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For checkout | Base URL used for the Polar checkout success redirect. |
| `SUPABASE_URL` | For live data | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | For live data | Service-role key — server-only, never expose to the client. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | For live data | Upstash Redis REST credentials, used to cache leaderboard reads. |
| `POLAR_ACCESS_TOKEN` | For checkout | Polar organization access token. |
| `POLAR_WEBHOOK_SECRET` | For checkout | Secret for verifying incoming Polar webhooks. |
| `POLAR_PRODUCT_ID` | For checkout | The product used to represent "claim a leaderboard spot". |
| `POLAR_SERVER` | No | `sandbox` (default) or `production`. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Enables [Umami](https://umami.is) analytics. Leave unset to disable tracking entirely (default). |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | No | Only needed for a self-hosted Umami instance; defaults to Umami Cloud's script. |

Until the Supabase/Redis/Polar variables are set, the app runs fine off the static seed data in `lib/leaderboard-data.ts` and the "Claim" button will surface the API's error response — nothing crashes, it just isn't wired to a real backend yet.

## Backend setup (Supabase + Redis + Polar)

The bidding mechanic is: read the leaderboard often (cheap, cached), write to it rarely (a paid claim). That maps to Postgres for the source of truth, Redis in front of it for reads, and Polar handling the actual charge.

**1. Supabase (Postgres)**

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` against it (SQL Editor, or `supabase db push` with the CLI). This creates `leaderboard_entries` (current standings) and `bids` (one row per checkout attempt).
3. Copy the project URL and the **service role** key (Project Settings → API) into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. This key is only ever used server-side, in route handlers.

**2. Upstash Redis**

1. Create a database at [console.upstash.com](https://console.upstash.com) (or use the Vercel integration, which sets the env vars for you automatically).
2. Copy the REST URL and token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. `GET /api/leaderboard` (`lib/leaderboard.ts`) reads from Redis first and only falls back to Supabase on a cache miss, with a 30s TTL — so the leaderboard, which gets hit constantly, isn't hammering Postgres on every page load. The cache is also explicitly invalidated the moment a bid is paid, so it never shows stale standings for longer than a webhook round-trip.

**3. Polar (payments)**

1. Create an organization at [polar.sh](https://polar.sh) and a product to represent a claimed spot (any placeholder price — the actual charge amount is set per-checkout to match the bid).
2. Create an Organization Access Token and set it as `POLAR_ACCESS_TOKEN`; set the product's ID as `POLAR_PRODUCT_ID`.
3. Add a webhook endpoint pointing at `https://<your-domain>/api/webhooks/polar`, subscribed to `order.paid`, and put its signing secret in `POLAR_WEBHOOK_SECRET`.
4. Flow: the hero section's "Claim" button posts the URL + bid to `POST /api/checkout` (`app/api/checkout/route.ts`), which checks the bid beats the current one in Supabase, creates a Polar checkout with an ad-hoc price for that exact bid, and redirects the browser to Polar. On successful payment, the `order.paid` webhook (`app/api/webhooks/polar/route.ts`) upserts the entry into `leaderboard_entries` and busts the Redis cache.
5. Use `POLAR_SERVER=sandbox` while testing — Polar's sandbox lets you complete checkouts without a real card.

## Analytics

Analytics are powered by [Umami](https://umami.is), a privacy-friendly, open-source alternative to Google Analytics. The tracking script (`components/umami-analytics.tsx`) only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set, so it's a no-op in local development unless you configure it.

1. Create a site in [Umami Cloud](https://cloud.umami.is) (or your self-hosted instance) and copy its website ID.
2. Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` if self-hosting) in your environment.
3. Redeploy — pageviews will start showing up in your Umami dashboard.
