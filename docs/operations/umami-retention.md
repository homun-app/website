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
   target; do not rely on a partial name or an assumed selection. Create a replacement
   website before changing or deleting the old dataset.
4. Replace the website ID in `src/layouts/Base.astro`,
   `src/components/docs/AnalyticsHead.astro`, `scripts/check-privacy-build.mjs`, and
   `scripts/check-analytics-build.mjs`.
5. Run `npm run build`, `npm run test:analytics-build`, and `npm run test:privacy`.
6. Deploy the website and verify production traffic reaches the replacement analytics
   view.
7. Only after that verification, export only the aggregate reports needed for the record,
   then delete or reset the exact old dataset before it reaches 24 months. Record the
   next deletion deadline in the review log.

Deletion or reset is irreversible. Do not delete active analytics before replacement
verification.

## Review log

| Date | Website state | Action | Next deadline |
| --- | --- | --- | --- |
| 22 July 2026 | New website | Initial policy | 22 July 2028 |
