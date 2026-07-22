# Website privacy design

## Goal

Give visitors to `homun.app` a complete, easily accessible explanation of the
website analytics already in use without introducing a consent banner. Preserve
useful aggregate page-view and product-interest statistics while minimizing the
data sent to Umami Cloud.

This document defines the website implementation and factual disclosures. It is
not a substitute for professional legal advice.

## Decisions

- Do not add Klaro or another consent-management platform at this stage.
- Keep Umami analytics active without prior opt-in.
- Publish a dedicated privacy notice in English and Italian.
- Identify **Fabio Cantone** as the data controller and Homun as the project.
- Use `hello@homun.app` as the privacy contact.
- Do not publish a tax identification number because it is not needed for this
  privacy notice.
- Keep the product security guide separate from the website privacy notice.

## Public information architecture

Create two standalone pages:

- `/privacy/` in English;
- `/it/privacy/` in Italian.

Every marketing and documentation page must expose an unambiguous `Privacy`
link in its footer or equivalent global navigation. Italian documentation must
link to the Italian notice. `Privacy & security` remains available as product
documentation and must not be the only route to the website notice.

## Privacy notice content

Both versions must communicate the same facts in clear language and include:

1. the controller: Fabio Cantone, responsible for the Homun project, Italy;
2. the contact address: `hello@homun.app`;
3. the purpose: aggregate audience measurement and understanding interest in
   downloads, GitHub resources, and public-roadmap activity;
4. the stated legal basis: the controller's legitimate interest in measuring
   and improving the public website with privacy-oriented aggregate analytics;
5. the categories of information processed by Umami: page path and title,
   referrer, browser language, screen size, browser, operating system, device
   type, approximate country, timestamps, page views, visits, and selected
   interaction events;
6. the provider's technical use of the request IP address to derive approximate
   location and an anonymous session hash, together with the provider's statement
   that the IP address itself is not stored;
7. the exact selected interactions: download intent, outbound GitHub
   navigation, roadmap project opening, and roadmap participation;
8. explicit exclusions: no Homun account data, workspace content, prompts,
   files, advertising identifiers, personal names, email addresses, custom
   distinct IDs, or session-replay data;
9. a statement that the tracker does not set cookies and is not used by Homun
   to identify visitors across websites;
10. Umami Software, Inc. / Umami Cloud as the analytics provider and processor,
   including the possibility of processing in the EU and United States and the
   safeguards documented by the provider;
11. a retention period of no more than 24 months, subject to the actual controls
    available in the Umami Cloud account;
12. the visitor's applicable GDPR rights, the right to object to processing,
    the right to complain to a supervisory authority, and the privacy contact;
13. the effective date and a statement that material changes will be reflected
    on the page.

The notice must avoid claiming that the implementation is legally compliant by
itself. Any statement about Umami must remain consistent with the provider's
current documentation and the site's actual configuration.

## Tracker minimization

Both places that load the Umami tracker—the marketing layout and the Starlight
documentation head—must use the same privacy configuration:

- `data-do-not-track="true"` so the browser's Do Not Track preference is
  respected;
- `data-exclude-search="true"` so query parameters are not collected;
- `data-exclude-hash="true"` so URL fragments are not collected;
- `data-domains="homun.app,www.homun.app"` so production analytics do not run
  on previews, local development, or unrelated hosts.

Custom event payloads remain limited to the stable, non-personal context already
defined by the analytics integration. Navigation and downloads must continue to
work if Umami is blocked, unavailable, or disabled by Do Not Track.

## Retention operations

The public notice states a maximum of 24 months only if the controller can
enforce it in the active Umami Cloud account. Before publication, verify the
account's deletion or retention controls. If automatic expiry is unavailable,
document a recurring manual deletion procedure or revise the public criterion
to match what can actually be enforced before deployment.

## Error handling

- A blocked or failed Umami request must not surface an error to visitors.
- Privacy pages are static and must remain readable without JavaScript.
- External links to Umami documentation and the supervisory authority must use
  safe external-link attributes.
- Missing analytics must never block navigation or download behavior.

## Verification

Automated checks must verify that:

1. both privacy pages build successfully and contain the controller name,
   contact email, provider, tracked categories, exclusions, retention, rights,
   and effective date;
2. English and Italian global navigation routes visitors to the matching
   privacy page;
3. every substantive rendered HTML page, including the rendered 404 page,
   contains exactly one Umami script; framework-generated redirect stubs that
   perform no page rendering are explicitly excluded and must contain none;
4. both Umami script integrations contain all four minimization attributes;
5. no query string, fragment, email address, account data, prompt, file, or
   workspace content is attached to custom events;
6. the existing analytics event-classification and fail-open tests continue to
   pass.

Run the full production build and the existing analytics and roadmap contract
checks. Inspect representative rendered marketing and documentation pages at
desktop and mobile widths to confirm that the privacy link is visible and the
notice remains readable.

## Out of scope

- A cookie banner or consent-management platform.
- Klaro integration.
- Advertising, profiling, session replay, fingerprinting, or cross-site
  tracking.
- Forms, newsletters, account registration, billing, or Homun desktop-product
  privacy terms.
- Tax, company, ecommerce, or general legal-imprint disclosures unrelated to
  website analytics.
