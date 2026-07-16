# Public roadmap operations

The public roadmap is a reviewed product narrative projected from GitHub Project #1.
GitHub Issues hold the public outcome, discussion and thumbs-up votes; the Project
controls editorial state; published Releases remain the evidence for what has shipped.
Votes and issue activity never create commitments automatically.

## Editorial model

Every active record has one product state and one publication state:

- Strategic program: `Available`, `Building now`, `Up next`, or `Exploring`.
- Workflow idea: `Evaluating`, `Selected for pilot`, or `Removed`.
- Publication: `Draft`, `Review`, `Published`, or `Archived`.

Progress is expressed only through named milestone checkboxes in the issue body. Do
not add percentages or dates that have not been committed. Voting is open only for
workflow ideas and deliberately selected Exploring programs. Votes inform discovery;
they do not change stage, priority, order or publication.

The website tells two related but distinct stories:

1. Strategic programs explain the product journey and what Homun is building.
2. Workflow ideas identify repeatable business processes that could become official,
   paid Homun workflow packs after validation with real teams.

## Creating or changing a record

1. Create or update the issue using the stable `roadmap-slug` marker and the required
   sections: outcome, Why now, First release, Milestones, Not included yet and
   Strategic role. Workflow ideas also require Target team, Example process, Likely
   connected systems and Expected output.
2. Add the issue to Project #1 with `Publication status: Draft`. Complete Roadmap
   stage, Item type, Evaluation status when applicable, Public area, Slug, Featured,
   Public update, Public update date, Voting and Order.
3. Move the record to `Review`. During Review the public site keeps the last approved
   version, if one exists, and marks it as under review.
4. Validate the generated snapshot and page locally. Move to `Published` only after
   the public copy, scope, links and ordering have been reviewed.
5. Never return a previously published record to Draft. Use Review for changes and
   Archived for removal. Keep archived issues and Project items as historical evidence.

Only one strategic program in `Building now` may have `Featured: Yes`. An `Available`
program must be named by its stable slug in a published Homun Release using a
`Roadmap: slug` line.

## Roadmap v3 migration

Freeze roadmap editorial changes while migrating. The guarded migration never deletes
issues or Project items and does not publish records during its preparation phase.

1. Preview the exact live operations:

   ```bash
   npm run roadmap:v3-rollout -- --project-number 1 --dry-run
   ```

   The initial approved plan creates four Project fields, creates ten issues,
   transforms issues #5, #7 and #8 without changing their URLs, and archives issues
   #2, #3, #4, #6, #9, #10 and #11 with a supersession comment.

2. After explicit approval of that printed plan, prepare the Project:

   ```bash
   npm run roadmap:v3-rollout -- --project-number 1 --apply
   ```

   Type `roadmap-v3` at the prompt. The command leaves all thirteen active records in
   Review, comments before closing legacy issues, re-fetches the Project and fails if
   any preparation operation remains.

3. Re-run the preparation dry-run and validate the reviewed source and preview:

   ```bash
   npm run roadmap:v3-rollout -- --project-number 1 --dry-run
   npm run check
   ```

   The dry-run must report zero operations. Review the thirteen live Project records
   in Review together with `/roadmap/`, `/roadmap/homun-flow/`,
   `/roadmap/client-work/` and the legacy redirects. The branch-only fixtures provide
   this pre-publication preview but must never be merged.

4. After separate approval of the reviewed public output, publish only the active
   records:

   ```bash
   npm run roadmap:v3-rollout -- --project-number 1 --publish
   ```

   Type `publish-v3` at the prompt. The one-time schema upgrade deliberately accepts
   only Published candidates, so generate the real snapshot immediately afterwards:

   ```bash
   npm run sync:product-data -- --allow-schema-upgrade --write
   npm run check
   ```

   Review the generated pages again, replace every preview snapshot with these real
   synchronized files, and only then merge and deploy the website.

5. Re-run `--dry-run` and the normal product-data synchronization. A successful
   reconciliation reports zero operations and no semantic snapshot changes. Keep the
   legacy fields until a later, separately reviewed cleanup; they are not read by the
   version 3 public projection.

An empty candidate must never replace a non-empty public snapshot. The workflow's
`allow_empty` recovery input is reserved for an intentional, separately reviewed empty
publication.
