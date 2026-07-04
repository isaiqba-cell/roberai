# ROBER AI

ROBER AI is an investor-demo MVP for "One Stop, Perfect Fit": a mobile-first, cross-brand fashion shopping app that normalizes size charts against a shopper's body profile, fit preferences, and known-good garments.

This repo is structured as a production-minded Expo monorepo with a pure TypeScript fit engine, seeded fictional catalog, Supabase schema and edge-function stubs, mockable AI/search/checkout providers, and a polished mobile/web demo path.

## Quick Start

```bash
npm install
npm run web
```

Open the Expo URL in a browser or device. The app runs in demo mode without credentials.

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
```

Supabase migrations live in `supabase/migrations`. Configure the Supabase CLI, then run the command printed by `npm run supabase:migrate`.

## Demo Routes

- Main app: `/`
- Compare / Best Fit Finder: `/compare`
- AI Stylist: `/stylist`
- Product detail: `/product/fieldstone-overshirt-clay`
- Checkout: `/checkout`
- Orders: `/orders`
- Investor dashboard: `/investor-demo`
- Admin size-chart review: `/admin`
- Component playground: `/components-playground`

## External Services

All external services are optional for the demo:

- Supabase: schema and client are wired; demo data is local when keys are absent.
- OpenAI: AI stylist and search parser use deterministic mock providers when `OPENAI_API_KEY` is absent.
- Voyage AI: embeddings are represented as nullable vectors in schema; tag/search fallback is used locally.
- Stripe: checkout uses the same interface as PaymentSheet, with a clean mock success path when test keys are absent.
- Shopify: provider interfaces and mock provider are included; live credentials are not required.
- PostHog/Sentry: wrappers avoid sending raw body measurements and no-op without keys.

## Fit Engine

The fit engine is framework-agnostic TypeScript in `packages/fit-engine`. It scores garment specs with weighted dimension closeness, stretch tolerance, fit-preference modifiers, data-quality penalties, and explanations. Missing measurements lower confidence rather than pretending certainty.

## Synthetic Metrics

The investor dashboard uses explicitly labeled synthetic demo data shaped like the production measurement pipeline. It must not be represented as production return-rate reduction.

## Deliberately Out Of Scope

This MVP does not implement AR try-on, 3D body scanning, production payment capture, app-store submission, live retailer API dependencies, or a trained ML fit model.
