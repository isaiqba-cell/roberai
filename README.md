# Rober

Rober is a cross-brand jeans fit translator. A shopper starts with one pair that
already fits; Rober resolves its garment measurements and ranks the size to buy
across an indexed catalog of brands and price points.

The monorepo contains a desktop-first Next.js investor MVP, the original Expo
mobile demo, a shared TypeScript fit engine, a provenance-aware ingestion
pipeline, and a live Supabase backend.

## Desktop Web Quick Start

```bash
npm install
npm run web:dev
```

Open `http://localhost:3000`. Development degrades to an honest seed-data mode
when credentials are absent. Copy `apps/web/.env.example` to
`apps/web/.env.local` to use live Supabase and ingestion services; never commit
that file.

Production intentionally fails fast when required configuration is missing.
Operational setup, backup secrets, deployment, restore, rotation, and incident
steps live in `docs/RUNBOOK.md`.

## Mobile Quick Start

```bash
npm run web
```

Open the Expo URL in a browser or device. For native development:

```bash
npm run ios
npm run android
```

## Useful Scripts

```bash
npm run dev          # Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Expo web
npm run web:dev      # Next.js desktop web
npm run web:build    # Next.js production build
npm run export:web   # Static web export
npm run lint         # Workspace lint/type guard
npm run typecheck    # Strict TypeScript
npm run test         # Unit tests
npm run seed         # Generate demo catalog artifact
npm run seed:jeans   # Generate jeans size-chart database artifact
npm run audit:high   # Production dependency gate
npm run security:boundaries # Server-secret boundary gate
npm run audit:ingestion:sources # Read-only Serper/fetch/parser source audit
npm run test:ingestion:corpus   # Verify the five-brand live corpus
```

Supabase migrations live in `supabase/migrations`. Authenticate and link the
Supabase CLI once, then apply every pending migration with
`npm run supabase:migrate`.

## Desktop Web Routes

- Product landing and embedded anchor start: `/`
- Reference-pair onboarding: `/onboarding`
- Live translated matches: `/matches`
- Product fit detail: `/style/[product-id]`
- Saved fit memory: `/saved`
- Public brand index: `/brands`
- Account/auth: `/account`, `/auth`
- Audited operations console: `/admin` (returns 404 to non-admins)

## Mobile Demo Routes

- Main app: `/`
- Compare / Best Fit Finder: `/compare`
- AI Stylist: `/stylist`
- Product detail: `/product/madewell-perfect-vintage-straight`
- Checkout: `/checkout`
- Orders: `/orders`
- Investor dashboard: `/investor-demo`
- Admin size-chart review: `/admin`
- Component playground: `/components-playground`

## Five-Minute Demo Script

1. Open `/`; the favorite-pair input is already in the hero.
2. Choose Levi's, `505 Regular Straight`, and `32x32`, then confirm the pair.
3. Show the resolved construction sentence and open the ranked matches.
4. Move the silhouette control, set a price cap, and point out size-to-buy plus
   the concrete dimension reason on each card.
5. Open a fit detail panel, compare the dimension deltas, and use the grounded
   retailer link with its source provenance visible beside the action.
6. Save a match, then show that email sign-in merges the guest fit memory.
7. In `/admin`, show the five-brand scraped chart corpus, review flags, job
   history, immutable snapshot references, and audit history.

## Desktop Services

Development can run without credentials; a production deployment cannot:

- Supabase stores accounts, anchors, catalog provenance, jobs, saves, analytics,
  admin audits, and atomic rate limits. RLS is enforced and live-tested.
- Serper discovers candidate size charts server-side. Deterministic parsing runs
  first; OpenAI is a server-only extraction fallback.
- Sentry is wired across browser/server with release tags, privacy
  scrubbing, source-map upload support, and an admin-only verification route.
- PostHog receives the five core funnel events through a strict server relay.
  Raw body and garment measurements are rejected by the shared event schema.
- First-party analytics remain available when a PostHog key is not configured.

## Supabase

The migration chain starts at `supabase/migrations/20260704000000_initial_schema.sql`
and currently runs through `20260729004000_fix_admin_brand_lookup.sql`.
It includes:

- pgvector and pgcrypto extensions
- profile, body/fit/style, catalog, commerce, chat, search, recommendation, notification, import, and analytics tables
- RLS enabled for user-owned and sensitive tables
- public read policies for active catalog data and approved size-chart measurements

Apply locally after configuring the Supabase CLI:

```bash
npm run supabase:migrate
```

For the hosted web MVP, authenticate with `npx supabase login`, link the
project once with `npx supabase link --project-ref <project-ref>`, then run:

```bash
npm run supabase:migrate
npm run seed:web
npm run test:stage2:live
npm run test:ingestion:corpus
```

The Stage 2 gate verifies that email sign-in is enabled, RLS blocks
cross-account access while exposing only published catalog records, and a real
browser can complete magic-link sign-in, merge guest anchors exactly once,
update a profile, and sign out. Google remains a launch configuration item: it
must be configured as a Web OAuth client
in Supabase Auth. Its authorized redirect URI is the project's
`https://<project-ref>.supabase.co/auth/v1/callback`; OAuth secrets belong in
the provider dashboards and must never be committed.

Edge function stubs live in `supabase/functions/*` and are designed to be replaced with service-role implementations as credentials are added.

## Seeding

```bash
npm run seed
npm run seed:jeans
```

`npm run seed:jeans` writes `supabase/seed/jeans-size-chart-database.json` with normalized jeans size-chart rows and cross-brand recommendations. The current investor dataset has 10 public-chart benchmark inputs, 132 illustrative jean styles, and 5,332 size/inseam variants. The in-app catalog uses a mix of benchmark brand names and fictional display brands such as Marlow Denim, Loom & Line, Range Standard, Harbor Denim, and Alder Curve. Source size charts are used as benchmark inputs only; the generated listings are not live retailer inventory and the demo does not claim retailer partnerships. Product imagery is supplied denim packshot placeholder imagery stored under `apps/mobile/public/images/jeans`.

The hosted web index also contains five official-domain chart sources discovered
through live Serper jobs: Levi's, Madewell, Dickies, Dockers, and American
Eagle. They currently contribute 162 bounded factual rows with private raw
snapshots. Four identify themselves as body charts and one remains basis
`unknown`; all are flagged for review and are deliberately excluded from
garment-to-garment scoring. The seeded construction corpus continues to power
matches until a scraped source explicitly proves garment measurements.

The current investor path is anchored on "I wear Levi's 501, size 32x32" and includes a structured fit-translation graph for Levi's, Wrangler, Lee, Dickies, and Dockers across closest-match, roomier, slimmer, stretchier, and boot-friendly alternatives.

## Virtual Try-On

Compare has an optional "Try it on" toggle that swaps each result card's product photo for a render of the user wearing that garment. It is off by default and additive on top of the existing match %, dimension explanations, and price sort — none of that changes when the toggle is off.

**Providers.** `TryOnProvider` (`packages/api-client/src/tryOn.ts`) has three implementations behind one interface, picked via `TRYON_PROVIDER`:

- `mock` — instant, zero external credentials. Default for local dev and CI.
- `huggingface` — calls a public Gradio Space running an open-source VTON model (IDM-VTON or OOTDiffusion). Free but queued/rate-limited; requires `HF_API_TOKEN` and `HF_TRYON_SPACE_ID`.
- `replicate` — the same class of model on Replicate's pay-per-second GPU billing. Costs fractions of a cent per image and removes the public-queue risk. Requires `REPLICATE_API_TOKEN` and `REPLICATE_TRYON_MODEL_VERSION`.

Switching from the free/queued path to the paid/reliable one before a live demo is a one-line env change:

```bash
TRYON_PROVIDER=replicate
```

No code change, no redeploy of app logic — `createTryOnProvider()` reads this at call time.

**Before a live demo:** free/community GPU endpoints are not guaranteed-fast, so don't rely on live generation during a pitch. Run the pre-generation script the day before, against the exact demo account and variant IDs you plan to click through live:

```bash
npm run seed:try-ons -- --photo <demo-user-photo-uri> --variants <variantId1,variantId2,...>
```

Add `--dry-run` to check without calling the provider, or `--retries <n>` to change the retry count (default 3). The script exits `0` only if every requested variant lands in `ready` status, and writes a summary to `supabase/seed/try-on-pregeneration-report.json`. Exit `1` means at least one variant isn't ready — fix it before the demo, don't walk on stage hoping the free tier cooperates live.

Consent, storage, and safety details (why photo upload is opt-in, what's stored, deletion cascade behavior) live in `BUILD_BRIEF.md`.

## Stripe Test Mode

The app uses a mock PaymentSheet-compatible fallback when Stripe keys are absent. When test keys are configured, use Stripe's test card:

```text
4242 4242 4242 4242
```

Server-side total calculation lives in `packages/api-client/src/checkout.ts`; production payment state should be finalized by `stripe-webhook`.

## Fit Engine

The fit engine is framework-agnostic TypeScript in `packages/fit-engine`. It scores garment specs with weighted dimension closeness, stretch tolerance, fit-preference modifiers, data-quality penalties, and explanations. Missing measurements lower confidence rather than pretending certainty.

Unit tests cover exact matches, too-small/too-large garments, stretch tolerance, missing measurements, fit preference adjustment, best-size selection, explanation generation, parser fallback, and recommendation weighting.

## What Remains Demo-Only

- Desktop auth: live Supabase email auth and guest-state merge are implemented;
  Google OAuth still needs provider-console credentials.
- AI: deterministic parser/stylist fallback is implemented; OpenAI structured outputs/tool calls can replace the provider.
- Embeddings: schema supports pgvector; local demo uses tags and fit/style scores.
- Checkout: mock Stripe fallback succeeds; real test-mode PaymentSheet needs keys.
- Shopify: provider interfaces and mock provider exist; live ingestion is intentionally not required.
- Push: permission/token/deep-link helpers exist; real delivery needs Expo project/device setup.
- Metrics: investor dashboard values are synthetic and clearly labeled.
- Virtual try-on: MockTryOnProvider is the default (zero credentials); HuggingFaceTryOnProvider/ReplicateTryOnProvider are wired but credential-gated. Demo mode uploads store the local photo URI as a stand-in for a signed Supabase Storage URL.

## Architecture

- `apps/web`: Next.js App Router product, public growth pages, APIs, auth, and
  audited operations console.
- `apps/mobile`: Expo Router app, design system, feature screens, stores, services, and local demo providers.
- `packages/fit-engine`: pure TypeScript scoring, parser, recommendation, and size-chart helpers.
- `packages/api-client`: catalog, checkout, ingestion, provider interfaces, and tests.
- `packages/ui`: shared Rober design tokens.
- `supabase`: migrations, edge-function stubs, and generated seed artifact.

## Roadmap

- Configure Google OAuth, Sentry, PostHog, and Vercel production credentials.
- Configure the protected off-site backup environments and complete the first
  recorded restore drill.
- Add licensed live-retailer inventory/price feeds; current product prices are
  labeled benchmark values, not live offers.
- Replace supplied placeholder product imagery with owned or fully licensed
  catalog imagery before a commercial launch.

## Synthetic Metrics

The investor dashboard uses explicitly labeled synthetic demo data shaped like the production measurement pipeline. It must not be represented as production return-rate reduction.

## Deliberately Out Of Scope

This MVP does not implement AR try-on, 3D body scanning, production payment capture, app-store submission, live retailer API dependencies, or a trained ML fit model.
