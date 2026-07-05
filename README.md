# Rober

Rober is an investor-demo MVP for "One Stop, Perfect Fit": a mobile-first, cross-brand jeans shopping app that normalizes size charts against a shopper's body profile, fit preferences, and known-good denim.

This repo is structured as a production-minded Expo monorepo with a pure TypeScript fit engine, seeded fictional jeans catalog, Supabase schema and edge-function stubs, mockable AI/search/checkout providers, and a polished iPhone-style mobile/web demo path.

## Quick Start

```bash
npm install
npm run web
```

Open the Expo URL in a browser or device. The app runs in demo mode without credentials.

For native development:

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
npm run export:web   # Static web export
npm run lint         # Workspace lint/type guard
npm run typecheck    # Strict TypeScript
npm run test         # Unit tests
npm run seed         # Generate demo catalog artifact
npm run seed:jeans   # Generate jeans size-chart database artifact
```

Supabase migrations live in `supabase/migrations`. Configure the Supabase CLI, then run the command printed by `npm run supabase:migrate`.

## Demo Routes

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

1. Open `/` and start from the Rober welcome screen.
2. Choose "I have a favorite pair of jeans" and enter a brand, size, and fit note.
3. Review the estimated waist, hip, and inseam profile, then build recommendations.
4. Open Home and point out the favorite-jeans baseline, indexed brands, and ranked jeans across price points.
5. Open `/compare`, search "straight denim jeans under $150", and show the highlighted best-fit card, recommended size, confidence, slider controls, and alternatives.
6. Open the PDP, show distinct gallery images, dimension reasoning, size chips with per-size fit scores, and add to bag.
7. Complete checkout with the mock Stripe test-mode fallback.
8. Open Orders and submit "Did it fit?" feedback.
9. Open Stylist and ask for "curvy jeans under $100"; recommendations are grounded in catalog and fit-score lookups.
10. Open `/investor-demo` and call out that all impact metrics are synthetic demo data.

## External Services

All external services are optional for the demo:

- Supabase: schema and client are wired; demo data is local when keys are absent.
- OpenAI: AI stylist and search parser use deterministic mock providers when `OPENAI_API_KEY` is absent.
- Voyage AI: embeddings are represented as nullable vectors in schema; tag/search fallback is used locally.
- Stripe: checkout uses the same interface as PaymentSheet, with a clean mock success path when test keys are absent.
- Shopify: provider interfaces and mock provider are included; live credentials are not required.
- PostHog/Sentry: wrappers avoid sending raw body measurements and no-op without keys.

## Supabase

The initial migration is in `supabase/migrations/20260704000000_initial_schema.sql` and includes:

- pgvector and pgcrypto extensions
- profile, body/fit/style, catalog, commerce, chat, search, recommendation, notification, import, and analytics tables
- RLS enabled for user-owned and sensitive tables
- public read policies for active catalog data and approved size-chart measurements

Apply locally after configuring the Supabase CLI:

```bash
npm run supabase:migrate
```

Edge function stubs live in `supabase/functions/*` and are designed to be replaced with service-role implementations as credentials are added.

## Seeding

```bash
npm run seed
npm run seed:jeans
```

`npm run seed:jeans` writes `supabase/seed/jeans-size-chart-database.json` with normalized jeans size-chart rows and cross-brand recommendations. The in-app catalog uses fictional display brands such as Marlow Denim, Loom & Line, Range Standard, Harbor Denim, and Alder Curve. Source size charts are used as benchmark inputs only; the demo does not claim retailer partnerships. Product imagery is supplied denim packshot placeholder imagery stored under `apps/mobile/public/images/jeans`.

## Stripe Test Mode

The app uses a mock PaymentSheet-compatible fallback when Stripe keys are absent. When test keys are configured, use Stripe's test card:

```text
4242 4242 4242 4242
```

Server-side total calculation lives in `packages/api-client/src/checkout.ts`; production payment state should be finalized by `stripe-webhook`.

## Fit Engine

The fit engine is framework-agnostic TypeScript in `packages/fit-engine`. It scores garment specs with weighted dimension closeness, stretch tolerance, fit-preference modifiers, data-quality penalties, and explanations. Missing measurements lower confidence rather than pretending certainty.

Unit tests cover exact matches, too-small/too-large garments, stretch tolerance, missing measurements, fit preference adjustment, best-size selection, explanation generation, parser fallback, and recommendation weighting.

## What Is Mocked

- Auth: UI and guest flow are implemented; Supabase Auth is credential-gated.
- AI: deterministic parser/stylist fallback is implemented; OpenAI structured outputs/tool calls can replace the provider.
- Embeddings: schema supports pgvector; local demo uses tags and fit/style scores.
- Checkout: mock Stripe fallback succeeds; real test-mode PaymentSheet needs keys.
- Shopify: provider interfaces and mock provider exist; live ingestion is intentionally not required.
- Push: permission/token/deep-link helpers exist; real delivery needs Expo project/device setup.
- Metrics: investor dashboard values are synthetic and clearly labeled.

## Architecture

- `apps/mobile`: Expo Router app, design system, feature screens, stores, services, and local demo providers.
- `packages/fit-engine`: pure TypeScript scoring, parser, recommendation, and size-chart helpers.
- `packages/api-client`: catalog, checkout, ingestion, provider interfaces, and tests.
- `packages/ui`: shared Rober design tokens.
- `supabase`: migrations, edge-function stubs, and generated seed artifact.

## Roadmap

- Wire Supabase Auth and persisted user profile rows.
- Move fit-score computation into shared edge-function code with cache invalidation.
- Add OpenAI structured-output normalization and stylist tool calls behind the existing provider interface.
- Add Stripe test PaymentSheet and signed webhooks.
- Add authenticated admin role checks and service-role catalog writes.
- Add production push notification delivery and feature flags.
- Replace supplied placeholder product imagery with owned or fully licensed catalog imagery before production.

## Synthetic Metrics

The investor dashboard uses explicitly labeled synthetic demo data shaped like the production measurement pipeline. It must not be represented as production return-rate reduction.

## Deliberately Out Of Scope

This MVP does not implement AR try-on, 3D body scanning, production payment capture, app-store submission, live retailer API dependencies, or a trained ML fit model.
