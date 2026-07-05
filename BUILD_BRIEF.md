# ROBER AI Build Brief

## Phase Notes

### Phase 0 - Foundations

- Monorepo scaffold with Expo mobile app, shared packages, Supabase folders, CI, environment sample, and startup documentation.
- Latest package versions were checked on July 4, 2026 before pinning core Expo and React Native dependencies.
- Demo mode is the default; external services are optional and replaceable through provider interfaces.

Deferred:

- Production credentials, live Supabase project linking, real Stripe capture, and app-store submission.

### Phase 1 - Design System And Navigation Shell

- Added theme-aware Rober tokens, light/dark mode, tab navigation, product cards, core commerce controls, fit-specific components, state components, and a component playground.
- Floating pill tabs and accessibility labels are in place for core icon controls.
- Category tiles use Rober's editorial palette instead of the screenshot blue/teal direction.

Deferred:

- Full catalog-backed product rails and checkout state are added in later phases.

### Phase 2 - Auth, Onboarding, Body Profile, And Style Quiz

- Added sign-in UI with email OTP, Apple/Google buttons, and guest browsing.
- Added body profile wizard using React Hook Form and Zod, manual measurements, fit preference capture, guided-measurement placeholder, and garment-reference alternate path.
- Added style quiz, price sensitivity, known-good items, privacy copy, profile summary, and onboarding finish route.

Deferred:

- Supabase Auth persistence is mocked in demo mode until real project credentials are configured.

### Phase 3 - Seeded Catalog, Browse, Search, And Filters

- Added 8 fictional brands and 96 generated products with variants, price diversity, category coverage, product media URLs, materials, colors, fit tags, inventory, and deliberately inconsistent size charts.
- Added search/filter utilities, seed script, `supabase/seed/demo-catalog.json`, catalog-backed Home rails, Discover search/filter grid, and Wishlist preview.
- Product lists use FlashList and fictional brand data only.

Deferred:

- Natural-language parsing is still deterministic/basic here; grounded AI parsing is added in the stylist/recommendation phase.

### Phase 4 - Fit Engine And Best-Fit Compare

- Added pure TypeScript fit scoring with dimension closeness, weighted averages, stretch tolerance, data-quality penalties, fit-preference adjustment, direction, descriptors, explanations, and best-size selection.
- Added unit tests for exact match, too small, too large, stretch tolerance, missing data, preference adjustment, best-size selection, explanations, and fallback parsing.
- Added Compare / Best Fit Finder with natural-language chips, cross-brand computed fit results, highlighted best-fit card, accessible skinnier/baggier controls, recommended size, dimension breakdown, and alternatives.

Deferred:

- Fit-score caching in Supabase is represented by schema/function work in later phases; local demo computes on demand.

### Phase 5 - PDP, Wishlist, Cart, Checkout, And Orders

- Added PDP with full-bleed product imagery, recommended size, confidence, explanations, dimension breakdown, size chips with fit scores, material/cut notes, save/share controls, alternatives, and sticky add-to-bag CTA.
- Added wishlist/cart state, line items, quantity steppers, remove controls, promo/address rows, server-shaped totals calculation, checkout fallback, order confirmation, order history, and post-delivery fit feedback.
- Added checkout totals unit tests and mock Stripe PaymentSheet-compatible service.

Deferred:

- Real Stripe keys, webhooks, and production payment capture remain ask-before actions.

### Phase 6 - Grounded AI Stylist And Recommendations

- Added deterministic stylist fallback that parses natural-language shopping intent, calls catalog search and fit scoring, and only recommends seeded catalog products.
- Added chat UI with parsed chips, grounded product carousel, fit explanation, and Compare handoff.
- Added hybrid recommendation ranking that blends fit, style, availability, merchant chart quality, recency/trending, and confidence.
- Home "Best Fit for You" now uses ranked fit/style recommendations.

Deferred:

- OpenAI structured tool calling is represented by the same provider shape and remains optional until API keys are supplied.

### Phase 7 - Admin Ingestion And Size-Chart Review

- Added Supabase migration with pgvector, core identity/body/catalog/commerce/chat/recommendation/analytics tables, RLS enabled, owner policies, and public catalog-read policies.
- Added edge-function stubs for fit-score, parse-search, search, compare, stylist-chat, normalize-size-chart, create-payment-intent, stripe-webhook, and Shopify ingestion.
- Added manual seed, CSV, Shopify, and mock Shopify provider interfaces with deterministic fallback size-chart normalization and tests.
- Added admin route for raw chart paste, normalized review, approve/reset workflow, import jobs, and recommendation score inspection.

Deferred:

- Live Supabase service-role writes and real OpenAI normalization remain credential-gated.

### Phase 8 - Motion, Accessibility, Offline/Refresh, And Mobile Polish

- Added pull-to-refresh, haptic add-to-cart feedback, notification permission/token helpers, notification deep-link mapping, mock payload helper, and biometric sensitive-access helper.
- Profile now exposes notification and biometric demo controls.
- Existing components maintain large tap targets, accessibility labels for icon buttons, dark-mode tokens, skeleton/empty/offline states, and FlashList catalog surfaces.

Deferred:

- Real push delivery and native biometric enforcement require device/project configuration and production policy decisions.

### Phase 9 - Analytics, Investor Dashboard, Tests, CI, And Web Export

- Added environment, Supabase, analytics, and Sentry wrappers with body-measurement sanitization.
- Added investor demo dashboard with clearly labeled synthetic metrics, impact cards, feedback distribution, and local state snapshot.
- Added Maestro critical path config, expanded README with setup, migration, seed, Stripe test mode, demo script, architecture, mocked-vs-wired notes, and roadmap.
- Verified lint, typecheck, unit tests, seed generation, and Expo web export.

Deferred:

- Maestro was configured but not executed because no simulator/device target is running in this environment.

## Restructure: Garment-to-Garment Fit Matching

The primary product mechanic changed from body-profile-first fit scoring to
reference-garment-first matching: a user's known-good pair becomes a fit
anchor, compared directly against other brands' garment construction specs.
Existing design system, navigation shell, catalog schema, checkout, admin
tooling, and the body-based fit engine were reused, not rebuilt.

### Phase R1 - Schema And Reference-Item Restructure

- Added a migration adding thigh/rise/leg-opening/hem/knee columns to
  `product_measurements`, structured `brand_slug`/`model_name`/`canonical_spec`/
  `resolved_from_catalog` columns to `favorite_reference_items`, a new
  `garment_reference_catalog` table for brand+model+size resolution, and a
  `match_path` column on `fit_scores`/`recommendation_events`.
- Added a `GarmentSpec` type in `packages/fit-engine` and a
  `resolveGarmentReference()` brand+model+size resolver in
  `packages/api-client/src/jeans.ts`, deriving numeric construction specs from
  each jeans style's existing qualitative taxonomy. Falls back to a
  self-reported spec (console-logged as an admin-ingestion gap) when a
  specific brand/model/size isn't indexed.
- `garmentSpec` now attached to every seeded catalog variant; added two chino
  products for category coverage beyond jeans.

Deferred:

- Live Supabase migration run (no local Postgres in this environment).
- A dedicated admin-ingestion queue UI for resolution gaps (currently
  console-logged only).

### Phase R2 - Garment-To-Garment Match Engine

- Added `matchGarments()` in `packages/fit-engine`, reusing the existing
  `closeness()` dimension-tolerance primitive so body-based and garment-based
  scoring share the same math. Thigh/inseam weighted highest, waist/rise next,
  leg opening/hem after, with a cut-adjacency term and stretch tolerance keyed
  to the *minimum* of both garments' stretch percentages.
- Six unit tests cover identical-spec, thigh-mismatch-dominance, stretch-tolerance
  widening, the stretch-anchor-vs-rigid-candidate asymmetry, missing-dimension
  fallback, and cut-adjacent scoring. The body-based `computeFitScore` is
  untouched and remains the fallback path.

### Phase R3 - Onboarding And Compare/Fit Passport Rewire

- Favorite-jeans onboarding is the primary path (unchanged structurally) and
  now collects a model/style name and category, resolving through
  `resolveGarmentReference()` instead of the old waist/hip/inseam-only
  estimate. Body-measurement wizard stays as the secondary/fallback path.
- Compare screen defaults to garment-to-garment matches against the seeded
  catalog once a reference item exists; the skinnier/baggier slider now
  re-ranks candidates by silhouette-cut proximity (with a confidence floor)
  instead of remapping a body fit preference. Added a first-class price sort
  control and generalized "Closest Match/Lower Price/More Stretch/Boot-Friendly"
  into reusable "Best overall match/Best value/Most similar stretch/Silhouette
  variant" categories computed by `matchGarments`.
- Home Fit Passport now computes its four category rows from
  `matchGarments()` over the live catalog and the active reference item's
  canonical spec, replacing the hardcoded taxonomy-based selection.
- Verified live in-browser: onboarding resolves Levi's 501 32x32 to a
  structured spec with thigh/rise data, Compare and Fit Passport both render
  dimension-level explanations, and price sort/silhouette re-ranking behave
  correctly.

### Phase R4 - Seed Data And Dashboard Reframe

- Added per-brand construction-profile deltas (thigh/rise/leg-opening) across
  all 8 jeans brands so catalog variants carry realistic, deliberately varied
  construction specs, not just waist/hip.
- Investor dashboard reframed around dimension-level match accuracy and
  anchor-based-matching adoption (still clearly labeled synthetic/demo data),
  with copy emphasizing the two-sided value prop (consumer time-to-fit and
  retail return-cost reduction).

Deferred:

- Real Shopify/brand size-chart scraping remains out of scope; reference
  garments are user-input only, matched against fictional seeded brands.
- Live returns data and a trained ML fit model remain out of scope per the
  original MVP constraints.

## Add-On: Photo-Based Virtual Try-On

An explicit, intentional pivot beyond the original MVP's AR/3D-try-on
exclusion, built as an additive layer on top of Compare — match %, dimension
explanations, and price sort are unchanged when the feature is off.

### Phase T1 - Consent, Capture, And Storage

- Added `try_on_photos`/`try_on_renders` tables with owner-only RLS and a
  private `try-on-assets` Supabase Storage bucket (never public), with
  folder-scoped storage policies and an `on delete cascade` FK so deleting a
  photo removes every render derived from it, not just the photo row.
- Photo upload is opt-in, never a default onboarding step. `TryOnConsentSheet`
  states in plain language what the photo is used for, that it's private,
  never used for analytics/training beyond the user's own renders, and
  deletable anytime (cascading to renders); it requires an explicit "I am
  18+ and this is a photo of myself" checkbox before upload can proceed.
- A basic person-presence check (`apps/mobile/lib/tryOnSafety.ts`) rejects
  obviously-invalid uploads before ever forwarding them to a generative
  model. This is intentionally an aspect-ratio heuristic, not a full
  moderation pipeline — the assumption made per the standing conservative-
  default guardrail, since a real face/person-detection model was out of
  scope for this pass.

Deferred: real Supabase Storage upload (demo mode has no live bucket — the
local asset URI stands in for `storage_path`), a proper face/person-
detection model, multi-photo support.

### Phase T2 - Provider Interface And Pipeline

- Added a `TryOnProvider` interface (`packages/api-client/src/tryOn.ts`)
  with `MockTryOnProvider` (default, zero credentials), `HuggingFaceTryOnProvider`
  (public Gradio Space REST call), and `ReplicateTryOnProvider` (pay-per-second
  GPU, polls until resolved), selected via `createTryOnProvider(kind)`.
- `findExistingRender()`/`requestTryOnRender()` implement the caching-first
  contract: a (photo, variant) pair is looked up first and the provider is
  only ever called on a genuine miss. Five unit tests cover this, including
  that requesting the same pair twice calls the provider exactly once.
- `apps/mobile/lib/tryOn.ts` wires this into the demo store: pending rows
  are upserted immediately so the UI can show a skeleton via its normal
  reactive store subscription (the demo-mode analog of polling/subscribing
  to Supabase Realtime), with the provider call resolving in the background.

Deferred: live edge function wired to a real Supabase connection (stub only,
in `supabase/functions/generate-try-on`), and an actual Supabase Realtime
subscription (demo mode substitutes zustand reactivity, matching how the
rest of the app already handles checkout/orders).

### Phase T3 - Compare Screen Integration And Stylized Fallback

- Added a "Try it on" toggle to Compare, off by default. Turning it on
  without an active photo opens the consent + upload sheet inline before
  enabling. Each visible result card's image is replaced by its cached/
  generated render, with a skeleton while pending and a silent fallback to
  a body-profile-driven `StylizedAvatar` SVG on failure.
- `ProductCard`/`CompareBrandCard`/`BestFitCompareCard` gained two optional,
  purely additive props (`overrideImageUrl`, `imageOverlay`) so this swap-in
  never changes default rendering when try-on is off.
- Changing the silhouette slider or price sort re-triggers generation for
  newly visible variants via the same cache-first pipeline from Phase T2.

Deferred: end-to-end verification of the ready/failed render swap itself —
`expo-image-picker`'s web path opens a native OS file dialog that headless
browser tooling can't drive. The surrounding pipeline (caching, skeleton,
fallback selection) is unit-tested and type-checked.

### Phase T4 - Demo Reliability Tooling

- Added `scripts/seed/pregenerate-try-ons.ts` (`npm run seed:try-ons`):
  takes a photo URI and a list of variant IDs, retries failures (default 3
  attempts), and exits non-zero if any variant isn't `ready`. `--dry-run`
  checks without calling the provider. Writes a summary to
  `supabase/seed/try-on-pregeneration-report.json`.
- README documents running this the day before a live demo and the
  one-line `TRYON_PROVIDER=replicate` switch if the free Hugging Face tier
  is unreliable on demo day.
- Verified directly: dry-run against valid variant IDs exits 1 (nothing
  generated yet); a real run against the mock provider exits 0 with all
  variants `ready`; an unknown variant ID correctly exits 1.

Deferred: wiring this script against a live Supabase project (no live
project in this environment) — it currently calls the provider directly and
reports results, matching this repo's existing seed-script pattern rather
than writing to a real database.
