# Public roadmap operations

The public roadmap is a reviewed projection of one GitHub Project. GitHub Issues hold
the public problem, discussion, and thumbs-up votes; the Project controls publication;
published Releases provide evidence for shipped work. The website never infers a
commitment from votes or issue activity.

## Moderating a new idea

1. A new issue carrying the `idea` label remains outside the Project until a maintainer
   checks duplicates, product fit, clarity, and safety.
2. Add an accepted proposal to the Project and set `Publication status: Draft` before
   setting any other public field. Missing required fields may make synchronization fail
   while the previous snapshot stays live; they must never be inferred as Published.
3. Complete `Slug`, `Area`, `Public status: Ideas`, `Voting`, `Order`, public copy, and
   `Public update date`. Set `Publication status: Published` only after reviewing the
   complete public representation.
4. Archive a rejected or duplicate proposal with `Publication status: Archived` and an
   `Archive reason`. Do not delete the item or merely remove it from the Project.

## Changing a published initiative

1. Promotion to `Next`, `Building`, or `Shipped` requires `Publication status: Review`
   first. During Review, the website preserves the last approved record and displays
   only `Under review`.
2. Review the new public status, order, progress, target direction, featured state,
   update text, and update date before returning the item to Published.
3. Never move a previously published item back to Draft. Use Review for changes and
   Archived for removal.
4. At most one Building initiative may have `Featured: Yes`.

## Shipping and releases

1. `Shipped` requires a verified `Roadmap: slug` line in a published, non-draft,
   non-prerelease Homun Release before the Project item returns to Published.
2. A release may exist without roadmap links, but it cannot prove an initiative was
   shipped unless it names the exact stable slug.
3. Publishing a release triggers the website reconciliation. Scheduled reconciliation
   remains the recovery path.

## Voting

Thumbs-up reactions on the linked public issue are advisory. Vote totals may update the
website snapshot, but never move, order, feature, publish, or ship an initiative
automatically.

## Migration and recovery commands

Inventory and preview the Project without writes:

```bash
npm run roadmap:project-rollout -- --project-number <number> --dry-run
```

Apply only after reviewing the printed operations and receiving approval:

```bash
npm run roadmap:project-rollout -- --project-number <number> --apply
```

Type `apply` at the confirmation prompt. The command creates only missing governance
fields, updates items by stable slug, re-fetches the Project, and fails unless the
follow-up plan contains zero operations. Keep the legacy `Public` and `Status` fields
through at least one successful scheduled no-op reconciliation.

An empty candidate must never replace a non-empty public snapshot. Use the workflow's
`allow_empty` recovery input only for an intentional, separately reviewed empty
publication.
