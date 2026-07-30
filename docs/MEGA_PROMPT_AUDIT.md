# Mega Prompt Delivery Audit

Evidence reviewed: 2026-07-29. The authoritative brief is `MEGA_PROMPT.md`.
This document records proof and blockers; it does not convert pending external
configuration into a completed claim.

## Stage Status

| Stage             | Status                  | Repository and runtime evidence                                                                                                                                                                                              | Remaining work                                                                                                                          |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Foundations    | Met                     | Shared matching package, CI, secret scan, dependency gate, env examples, append-only migrations                                                                                                                              | None in code                                                                                                                            |
| 1. Web shell      | Met                     | Desktop Next.js shell, design tokens, responsive navigation, route transitions, empty/loading/error states                                                                                                                   | Continue visual regression review as features change                                                                                    |
| 2. Supabase/auth  | Partial                 | Email magic-link auth, guest mode, one-time guest merge, profiles, live RLS tests, seeded Postgres index                                                                                                                     | Configure and verify Google OAuth in provider consoles                                                                                  |
| 3. Anchor flow    | Met                     | Three-step brand/model/size flow, parser variants, full Levi's 505 construction resolution, self-report fallback, ingestion enqueue, multiple anchors                                                                        | None in code                                                                                                                            |
| 4. Ingestion moat | Met for chart ingestion | Real Serper discovery, RFC-correct robots handling, throttled bounded fetch, deterministic and mocked-LLM extraction, five golden layouts, private snapshots, confidence/versioning, takedown, five live brands and 162 rows | No live source currently proves model-level garment construction; body/unknown charts remain excluded from matching                     |
| 5. Matches        | Met                     | Live Postgres catalog, shared scorer, filters, animated reranking, fit detail overlay, provenance, saves, outbound event links                                                                                               | Licensed/live inventory feeds remain outside MVP scope                                                                                  |
| 6. Admin          | Met                     | Server and middleware role gate, review/edit/approve/reject/takedown, jobs, health, metrics, audit log                                                                                                                       | Operator review remains required for five new sources                                                                                   |
| 7. Hardening      | Partial                 | Rate limits, CSP/nonces, headers, RLS, secret boundary check, Dependabot, Sentry/PostHog code paths, backup and restore workflows, runbook                                                                                   | Configure off-site backup secrets and perform restore; configure Sentry/PostHog and observe test events; run external Observatory check |
| 8. Launch         | Partial                 | Landing-to-product journey, public brand pages, SEO files, a11y, performance budgets, 90-second Playwright path, guest-merge browser proof                                                                                   | Deploy permanent Vercel production/custom domain and verify production environment separation                                           |

## Live Corpus Proof

`npm run test:ingestion:corpus` currently proves:

- five completed `ingest_size_chart` jobs with stored Serper-ranked candidates;
- five published official-domain source records readable through public RLS;
- 162 bounded factual chart rows;
- five private raw-snapshot references;
- deterministic parse provenance on every source;
- zero `body` or `unknown` rows entering garment-to-garment matching.

This is intentionally distinct from the seeded construction benchmark: the
live charts increase factual sizing coverage, while only explicit garment
measurements may influence the core scorer.

## Definition Of Done

| Requirement                                            | Result                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Cold-user 90-second path                               | Proven in Playwright locally; production-domain rerun pending             |
| Seed corpus plus five real Serper-ingested brands      | Met and repeatably verified                                               |
| Auth, RLS, limits, headers, secret hygiene             | Met for email auth; Google provider configuration pending                 |
| Nightly backups and one real restore drill             | Workflows exist; external credentials and successful drill pending        |
| Sentry and PostHog events visible                      | Instrumentation exists; provider credentials/live visibility pending      |
| CI lint, types, unit, RLS, golden parsers, browser E2E | Workflow now contains all gates; next GitHub run must be observed green   |
| Runbook and README current                             | Met for current repository state                                          |
| No fabricated live-data claims                         | Met: benchmark listings are labeled; scraped basis/provenance is explicit |

## Launch Blockers

1. Rotate the service-role and Serper credentials previously exposed in chat.
2. Configure Google OAuth and verify its callback in the production project.
3. Configure Sentry and PostHog, then capture one test error and the five funnel
   events in their provider dashboards.
4. Configure the protected backup environments and complete the recorded
   scratch restore drill.
5. Deploy a permanent Vercel URL/custom domain and rerun browser, Lighthouse,
   CSP/header, and Observatory acceptance against that exact origin.
