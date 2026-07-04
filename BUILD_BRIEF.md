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
