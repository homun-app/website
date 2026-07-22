# Umami Cloud retention procedure

## Scope and owner

This procedure applies to the current Homun website ID
`f3bdb523-4352-430b-b2a2-c7fdf4c0131f`. The owner is Fabio Cantone.

## Policy

Umami Cloud analytics must never be retained for more than 24 months. Review retention
quarterly. The first hard deletion deadline is **22 July 2028**.

## Procedure

1. Sign in to Umami Cloud and inspect the oldest analytics date for the tracked website.
2. If an age-based retention control is available, configure it for the 24-month limit
   and record the configured setting in the review log.
3. If that control is not available, resolve and verify the exact old tracked website
   target; do not rely on a partial name or an assumed selection. Record its website ID,
   then create a replacement website and record the new website ID before changing the
   live integration.
4. Replace the website ID in all six ID-bearing locations:
   - `src/layouts/Base.astro`;
   - `src/components/docs/AnalyticsHead.astro`;
   - `scripts/check-privacy-build.mjs`;
   - `scripts/check-analytics-build.mjs`;
   - `scripts/check-container-runtime.mjs`;
   - this runbook, `docs/operations/umami-retention.md`, including the current ID in the
     scope and the new/current ID in the review log.
5. Run `npm run build`, `npm run test:analytics-build`, and `npm run test:privacy`.
6. Deploy the website, verify the deployed HTML contains the replacement ID, and verify
   new production traffic reaches the replacement analytics view.
7. Export only the aggregate reports needed for the record after replacement traffic is
   verified.
8. Delete the exact old website and its analytics history before the 24-month deadline.
   A reset is not an equivalent retirement action: it leaves the old website record
   active, and stale or cached pages can send traffic to the old ID and repopulate it.
   Deletion is required to retire the old website.
9. Record the old ID, replacement ID, deletion confirmation, and the replacement's next
   hard deletion deadline in the review log.

Deletion is irreversible. Do not delete active analytics before the replacement has
been tested, deployed, and verified to receive production traffic.

## Review log

| Date | Old website ID | New/current website ID | Website state | Action | Next deadline |
| --- | --- | --- | --- | --- | --- |
| 22 July 2026 | — | `f3bdb523-4352-430b-b2a2-c7fdf4c0131f` | New website | Initial policy | 22 July 2028 |
