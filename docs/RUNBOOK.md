# Rober Web Operations Runbook

Last reviewed: 2026-07-30

## Current Recovery Status

- The production Supabase project is linked and migrations are applied through
  `20260730002000_supersede_parser_revisions.sql`.
- Supabase manages physical daily backups on current projects; PITR availability
  depends on the paid plan and must be confirmed under **Database > Backups**
  before launch. Do not claim PITR until that dashboard shows an active recovery
  window.
- `.github/workflows/nightly-backup.yml` creates a logical Postgres archive,
  copies private size-chart snapshots, verifies checksums, and writes both to a
  separate S3-compatible provider. The destination must have a 30-day lifecycle.
- A real local dump was attempted on 2026-07-29. Supabase CLI stopped before
  reading data because Docker Desktop/`pg_dump` is not installed. No restore
  success is claimed. Configure the GitHub backup secrets and run the guarded
  restore workflow before calling recovery launch-ready.
- Supabase Storage does not support S3 object versioning. Rober therefore stores
  raw snapshots at immutable content/version paths, keeps `content_hash` and
  `version` in `size_chart_sources`, forbids public access, and copies every
  version to an off-site bucket where provider versioning and retention apply.
- The daily ingestion cron also removes expired API limiter rows. The database
  independently rejects analytics event names, fields, and nested values outside
  Rober's approved measurement-free funnel contract.
- The web workspace pins Next.js and `eslint-config-next` to
  `16.3.0-canary.103`. At review time, the latest stable release bundled
  high-severity vulnerable PostCSS and Sharp versions. Keep the exact pin until
  the first stable release that passes `npm run audit:high`, then return both
  packages to the same patched stable version in one reviewed change.

## Environment Inventory

Public build values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (canonical production HTTPS origin)
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (optional; defaults to US ingest)

Server-only runtime values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SERPER_API_KEY`
- `OPENAI_API_KEY`
- `SENTRY_DSN` (the DSN is public by design, but is configured server-side once)
- `CRON_SECRET`
- `RATE_LIMIT_SECRET` (optional dedicated HMAC key)
- `ADMIN_EMAILS`

Deployment-only monitoring values:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_RELEASE` (optional; Vercel commit SHA is the fallback)

Backup environment secrets:

- `SUPABASE_DB_URL` (direct/session connection with database password)
- `SUPABASE_STORAGE_S3_ENDPOINT`
- `SUPABASE_STORAGE_S3_ACCESS_KEY`
- `SUPABASE_STORAGE_S3_SECRET_KEY`
- `BACKUP_S3_ENDPOINT`
- `BACKUP_S3_BUCKET`
- `BACKUP_AWS_ACCESS_KEY_ID`
- `BACKUP_AWS_SECRET_ACCESS_KEY`
- `SCRATCH_DATABASE_URL` (restore workflow only; name must include `scratch` or
  `restore`)

Never place server-only values in `NEXT_PUBLIC_*`, source files, issue text,
screenshots, or analytics. The service-role and Serper credentials previously
shared in chat must be rotated before production launch.

## Live Source Corpus

The current corpus has two deliberately separate layers:

- Five official-domain general chart sources discovered by completed
  Serper-backed jobs: Levi's, Madewell, Dickies, Dockers, and American Eagle.
  Together they publish 162 bounded chart rows and reference five immutable raw
  snapshots. Their basis is `body` or `unknown`, so none may enter matching.
- Four official Everlane model pages with explicit point-of-measure garment
  tables. They publish 104 complete garment rows, four factual prices, four
  official product images, and four canonical outbound links. These records do
  enter matching with scraped provenance and no live-inventory claim.

Run the read-only internet audit before changing extractor behavior:

```bash
npm run audit:ingestion:sources
```

Queue the canonical corpus through Serper discovery, drain it through the
protected `/api/cron/ingest` worker, then prove the stored result:

```bash
npm run ingest:corpus:enqueue -- --discover
npm run test:ingestion:corpus
npm run ingest:garments:enqueue
npm run test:ingestion:garments
```

The verification must report five Serper-completed brands, at least 50 chart
rows, five private snapshot references, five public source records, and zero
non-garment rows in `garment_reference_catalog`. A `body` or `unknown` chart is
valid provenance evidence but is never a garment-construction match input.

With the production web server running, prove that published garment rows reach
the user-facing scorer, detail response, image, and retailer link:

```bash
npm run test:matching:live
```

The garment verification must report four official model sources, at least 90
fit-ready rows, four product styles, four factual retailer links, and anonymous
RLS parity. The matching verification must return a scraped Everlane result in
`live` mode, preserve its exact recommended size, expose at least five garment
deltas, and build an outbound URL on `everlane.com`.

## Deploy And Roll Back

1. Require green CI: secret scan, dependency audit, boundary check, lint,
   typecheck, Jest, Playwright, RLS checks, and production build.
2. Apply migrations with `npm run supabase:migrate` before promoting the web
   deployment. Migrations are append-only.
3. Deploy a Vercel preview, complete the 90-second guest flow, verify `/admin`
   is a true 404 for a non-admin, and inspect CSP/rate-limit headers.
4. Promote the tested immutable commit to production. Record commit SHA and
   migration version in the release note.
5. For a web regression, roll Vercel back to the prior deployment. Do not roll
   database migrations backward in place; ship a forward corrective migration.
6. If a migration breaks reads or writes, put ingestion/admin mutations into
   maintenance mode, restore from PITR/daily backup if needed, then deploy a
   forward fix.

## Nightly Backup

1. Create a separate S3-compatible bucket outside the Supabase project.
2. Enable provider-side encryption, object versioning where available, access
   logging, and a lifecycle that expires `rober/` objects after 30 days while
   retaining `restore-proofs/` for one year.
3. Add the backup secrets to the protected `backup-production` GitHub
   environment. Grant write-only/list-minimal permissions to the workflow key.
4. Enable Supabase Storage S3 access and scope its key to read the private
   `size-chart-snapshots` bucket.
5. Run **Nightly off-site backup** manually once. Confirm the summary names a UTC
   version and the off-site provider contains the dump, snapshot archive, and
   SHA-256 manifest.
6. Alert on a missing successful run within 26 hours.

Supabase database backups exclude Storage objects; both archive types are
required for a complete recovery.

## Restore Drill

1. Create an empty scratch Postgres database whose URL visibly includes
   `scratch` or `restore`. Never use the production URL.
2. Put its URL in the protected `backup-restore-drill` environment.
3. Run **Restore drill** with confirmation `restore-scratch-only`.
4. The workflow verifies SHA-256, checks `pg_restore --list`, restores with
   ownership/privileges stripped, counts critical tables, lists the snapshot
   archive, and writes immutable proof off-site.
5. Open the proof, compare counts with the production admin dashboard, and test
   one brand, product, source, and parsed size row in the scratch database.
6. Record the workflow URL, backup version, duration, counts, and operator below.

Restore drill evidence: **pending first configured workflow run**.

## Key Rotation

1. Generate the replacement in its provider. Keep the old key active briefly.
2. Update Vercel and GitHub environments without printing the value.
3. Redeploy and verify health, ingestion, monitoring, and backup workflows.
4. Revoke the old key and check logs for failed requests.
5. For Supabase service-role rotation, retest RLS and admin 404 behavior. For
   `CRON_SECRET`/`RATE_LIMIT_SECRET`, expect limiter identity hashes to reset.
6. Record operator, provider, and timestamp without recording the secret.

## Source Takedown

1. Open `/admin`, locate the source by URL/domain, and capture the complaint or
   policy reason in the takedown field.
2. Use the audited takedown action. Confirm publication is disabled and matching
   cache invalidation removes the source from live results.
3. Preserve the private immutable snapshot only when legally permitted. If it
   must be deleted, remove every off-site copy under the same version and record
   the exceptional deletion in the incident log.
4. Verify public brand and product pages no longer imply the removed provenance.

## Incident Basics

1. Declare severity and incident lead. Preserve timestamps in UTC.
2. Contain: disable affected keys/routes, pause ingestion, or roll back web code.
3. Inspect Sentry release/errors, Vercel logs, Supabase logs, `audit_log`, jobs,
   and first-party aggregate analytics. Do not paste customer measurements into
   tickets or chat.
4. Recover using the smallest reversible action. Validate RLS, admin isolation,
   matching, saves, outbound redirects, and backup freshness.
5. Communicate known facts, customer impact, and next update time.
6. Rotate exposed keys, document root cause and follow-ups, and run a new restore
   drill if database or storage integrity was involved.
