# Connected Automations Homepage Section

**Date:** 2026-07-13  
**Status:** Approved design, pending implementation plan

## Purpose

Add a homepage section that makes Homun's connected and automated work tangible. The current homepage explains model freedom, project work, control and the ecosystem, but it does not yet show clearly that Homun can:

- receive work through WhatsApp and Telegram;
- use explicitly connected services through Composio;
- extend its tools through MCP and Skills;
- run automations on a schedule or in response to an event;
- reply automatically where allowed or wait for confirmation before sensitive actions.

The section must explain these capabilities through concrete examples, not a catalog of logos or a dense product screenshot gallery.

## Position in the Homepage

Place the new section between `WorkProof` and `Security`.

The resulting narrative is:

1. Homun turns intentions into real work.
2. Connected channels, services and automations let that work begin and continue without an open chat window.
3. Permissions and confirmation keep the user in control.

This preserves the local-first boundary. Core Homun remains usable without registration. Third-party connections are optional and enabled explicitly by the user.

## Primary Message

**Eyebrow:** Connected action  
**Heading:** From a message to real action.

**Supporting copy:**

> Reach Homun through the channels you already use. Connect the services where your work lives, then turn a message, schedule or event into an action you can review and control.

The section must communicate one continuous system rather than presenting Channels, Connectors and Automations as unrelated features.

## Visual Language

Use the same B2 illustration system as the rest of the approved homepage:

- dark teal atmosphere rather than a grid background;
- thin technical panels with softly rounded corners;
- fixed Homun cube or workspace at the centre;
- small physical modules and outputs arranged as an isometric miniature;
- teal as the primary signal colour, with blue, magenta and amber accents;
- restrained labels in the existing condensed monospace style;
- slow path pulses and 2–4 px peripheral drift;
- no laptop, robot, brain or generic SaaS-dashboard metaphor.

The illustration should feel like another part of the adaptable workshop established in the hero, not a new art direction. Avoid a symmetrical network diagram: the visual must read as a small working scene with an input, a transformation and an output.

## Section Structure

### 1. Connected workspace scene

Use a split header on desktop: copy on the left and the main illustration on the right. Stack copy above illustration on mobile.

The illustration is a miniature isometric workshop:

- a WhatsApp message from Jean enters from the left as the primary example;
- Telegram remains visible as a smaller secondary channel token;
- Composio and `MCP + Skills` are physical tool modules feeding the work path;
- Homun is a fixed central machine/workspace rather than another network node;
- a completed update/reply card leaves on the right;
- the luminous runway conveys `input → Homun works → useful result` without a labelled flowchart.

The scene explains the architecture through motion and physical relationships. Keep only short labels needed to identify WhatsApp, Telegram, Composio, MCP and Skills; do not restore the symmetrical orbit, four matching panels or the lower text rail.

### 2. Automations in motion

Follow the main scene with a second heading:

**Eyebrow:** Automations in motion  
**Heading:** Two ways to begin. Countless ways to continue.

Supporting copy explains that an automation can run at a chosen time or wake up when something happens. Each example uses the same sequence:

`Trigger → tools/context → result`

Show three illustrated story cards.

#### Example A: WhatsApp event

- Trigger: Jean sends a WhatsApp message asking for the latest project update.
- Homun action: find the relevant project context and prepare a response.
- Result: reply drafted, or sent automatically only when the contact and text-only reply satisfy the configured allowlist policy.
- Visible labels: `Event · WhatsApp`, `Incoming`, `Reply drafted`, `Auto-reply if allowed`.

#### Example B: Scheduled Gmail brief

- Trigger: every weekday at 08:30.
- Homun action: read new Gmail messages and prioritise what matters.
- Result: prepare a daily brief and deliver it through Telegram.
- Visible labels: `Schedule · 08:30`, `Gmail`, `Prioritise`, `Daily brief → Telegram`.

#### Example C: Service event workflow

- Trigger: a new invoice arrives by email.
- Homun action: extract the amount and client, then use a connected spreadsheet service.
- Result: update the sheet and notify the user.
- Visible labels: `Event · New invoice`, `Extract`, `Sheets`, `Confirm if required`, `Notify`.

These examples deliberately cover both trigger families:

- scheduled triggers based on time, days or recurrence;
- event triggers caused by a message or connected-service event.

## Safety and Control

Safety is part of the story, not a disclaimer hidden elsewhere.

Add a short note beneath the example cards:

> Text replies can be automatic for allowlisted contacts. Sensitive actions can wait for confirmation.

The visual must not imply unrestricted automatic sending or invisible access to connected services. Composio, MCP, Skills and channels are capabilities the user chooses to connect or enable.

## Interaction and Motion

- Keep the central Homun object fixed.
- Move a small signal along the runway slowly to suggest work progressing.
- Let the incoming message, tool modules and output card drift by no more than 4 px.
- Animate story-card paths sequentially with long pauses so the page remains calm.
- Do not require animation to understand the examples.
- Disable all non-essential animation under `prefers-reduced-motion: reduce`.
- Avoid mouse-following motion inside the story cards; the examples should remain legible while reading.

## Hero Typography Correction

The hero title currently uses a `0.98` line height with gradient-clipped text. This compresses the descender of the final `y` in `Your system.` and makes its tip appear cut.

- Increase the hero title line height to `1.04`.
- Add `0.08em` bottom padding to the title so gradient clipping cannot crop the final descender.
- Preserve the intentional three-line composition and all existing responsive font sizes.
- Verify the descender remains visible at desktop, tablet and mobile sizes.

## Responsive Behaviour

### Desktop

- Main introduction uses a two-column split.
- Three story cards form an equal three-column row.
- Labels and routes remain large enough to read without zooming.

### Tablet

- Introduction may remain split when space permits, otherwise it stacks.
- Story cards use two columns followed by one full-width or centred card.
- No horizontal scrolling.

### Mobile

- Copy precedes the main illustration.
- Peripheral nodes move closer to the centre while preserving distinct paths.
- Story cards stack vertically.
- Decorative micro-labels may be removed if they become too small, but triggers, tools and results remain visible.
- The examples must still distinguish schedule and event triggers without relying on colour alone.

## Product Evidence and Links

The illustrated examples are the primary storytelling device. Add compact links near the section conclusion to the existing guides for:

- Channels;
- Connectors;
- Automations.

Do not place application screenshots in this homepage section. The illustrations carry the examples; the linked guides provide the detailed product evidence.

## Accessibility

- Mark purely decorative SVG groups as hidden from assistive technology.
- Provide a concise accessible description for the main connected-workspace illustration.
- Keep text as HTML wherever it communicates trigger, action or result.
- Maintain visible focus states on guide links.
- Ensure colour contrast matches the existing homepage system.
- Never use colour as the only distinction between schedule and event triggers.

## Implementation Boundaries

Create focused Astro components:

- one section component responsible for copy, layout and guide links;
- one connected-workspace illustration component rendered as the miniature workshop;
- one reusable automation-story illustration component driven by a small set of variants.

Do not restore the older full `Features` section. Reuse its copy and existing guide routes only where relevant. Avoid unrelated homepage refactoring.

## Verification

Extend the homepage illustration contract so automated checks confirm:

- the connected-action section is present in the homepage order;
- WhatsApp, Telegram, Composio, MCP, Skills and Automations are represented;
- both `schedule` and `event` trigger concepts are present;
- all three story examples render;
- links to Channels, Connectors and Automations guides exist;
- reduced-motion overrides cover the new animations.
- the hero title source uses the safe line height and bottom padding required for descenders.

Complete visual QA at desktop, tablet and mobile widths. Confirm:

- no horizontal overflow;
- all required labels are readable;
- the three stories remain understandable without motion;
- no browser console errors;
- the transition from WorkProof into the new section and then Security has a clear visual rhythm.
