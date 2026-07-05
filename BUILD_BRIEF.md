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
