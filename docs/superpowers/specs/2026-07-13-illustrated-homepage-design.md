# Illustrated Homun homepage design

## Goal

Make the Homun homepage lighter, more memorable, and easier to scan without weakening its credibility as a serious work environment. The page will combine a proprietary illustration language with real product screenshots: illustrations explain the system, while screenshots prove the product exists and works.

The approved direction is **B2 — The adaptable workshop**, applied with **balanced narrative density**.

## Visual idea

Homun is represented as a stable modular workshop. Projects, memory, permissions, and the workspace form the durable environment. Model providers, tools, plugins, and output types appear as replaceable modules that connect to it.

The illustration language must feel:

- precise but not clinical;
- dimensional but not photorealistic;
- warm enough to relieve the dark interface;
- technical without looking like a network diagram;
- distinctive to Homun rather than an imitation of AnythingLLM.

Avoid laptops as the main metaphor, AI brains, robots, mascots, graph-paper backgrounds, decorative grids, and generic orbit diagrams.

## Visual system

Illustrations use simplified axonometric objects, shallow perspective, rounded modules, and light connecting paths. Surfaces remain sparse so the drawings read at both desktop and mobile sizes.

Color roles:

- teal: Homun, continuity, active paths, and the stable workspace;
- blue: remote or cloud models;
- magenta: replaceable modules and ecosystem extensions;
- amber: completed output or a user decision;
- cream and muted green-grey: structure, labels, and neutral work objects.

Teal remains dominant. Secondary colors appear only inside illustrations and never compete with the primary calls to action.

## Homepage storyboard

### 1. Hero — adaptable workshop

Keep the approved headline, positioning copy, adaptive download action, and availability line on the left. Replace the current generic `Live workspace` operator panel on the right with the main B2 illustration.

The scene contains:

- the stable Homun workshop at the centre;
- a Projects module;
- a Memory module;
- one model module that is visibly replaceable;
- two small peripheral markers for tools and output.

The illustration explains the product promise without repeating the headline as text inside the drawing.

### 2. Model freedom — replaceable engines

Preserve the existing model-freedom copy and the Cloud, Open source, and Local explanation cards. Add a wide illustrated transition after them.

The transition shows the stable Homun workspace in the middle while differently coloured model modules can enter or leave along one continuous path. The centre remains visually fixed; movement belongs to the engines around it.

### 3. Real work — four spot illustrations

Keep the four current use cases and their copy:

1. Develop software
2. Create deliverables
3. Operate locally
4. Continue the project

Replace the large ordinal emphasis with four compact scenes:

- a code surface;
- a document/presentation surface;
- a contained local-computer module;
- a continuous project path.

Retain `01–04` as small metadata so the section still feels ordered. Each drawing is simpler than a main scene and uses no more than two accent colours.

### 4. Local control — real product proof

Do not add an illustration. Preserve the real Homun workspace and settings/permission screenshots as the page's main evidence layer.

The surrounding layout may be tightened to improve rhythm, but screenshots must remain readable and must not be stylised into fictional UI.

### 5. Living system — Projects and Marketplace

Restructure the section header into a desktop split:

- left: `A living system`, headline, and supporting copy;
- right: a B2 ecosystem scene connecting a Projects module to a Plugins/Marketplace module.

The existing Projects and Marketplace product cards remain below the header and keep their real status, calls to action, and optional-account language. The illustration introduces the ecosystem; the cards provide the details.

### 6. Download — practical action

Do not add a large illustration. Keep the adaptive operating-system download, three platform cards, alternate-platform chooser, installation guide, and self-hosting link.

This section should feel like the practical conclusion of the page, not another narrative scene.

## Motion

Motion is restrained and communicates modularity:

- the central Homun workshop never floats or wobbles;
- peripheral modules may drift by 2–4 pixels over long durations;
- connecting paths may use a slow opacity pulse;
- the replaceable-engine transition may shift one module slightly along its path;
- no continuous rotation, bounce, or cursor parallax is added to the illustrations.

All illustration motion stops when `prefers-reduced-motion: reduce` is active. The existing cursor-following atmospheric light remains independent and unchanged.

## Responsive behaviour

- Hero: copy appears first, illustration second; the scene simplifies below tablet width.
- Model transition: retains the stable centre and at least two engine modules on mobile; secondary markers may be hidden.
- Work spots: four columns on wide desktop, two columns on tablet, one column on narrow mobile.
- Ecosystem header: stacks copy above the illustration on mobile.
- Decorative labels too small to read are removed rather than scaled below legibility.

No illustration may cause horizontal overflow or push the primary action below an unreasonable first-screen distance.

## Accessibility and semantics

Illustrations are decorative explanations adjacent to equivalent text and use `aria-hidden="true"`. They contain no essential copy or interactive controls. Semantic headings, links, screenshots, and calls to action remain in the page structure.

Contrast for real text continues to follow the existing design system. Tiny labels inside decorative SVGs are not relied upon to convey meaning.

## Implementation boundaries

Create focused Astro components rather than embedding large SVGs directly in section components:

- main workshop illustration;
- replaceable-engine transition;
- work spot illustration with a finite `kind` variant;
- ecosystem illustration.

Each illustration owns its SVG markup and local animation styles. Section components own layout and copy. Shared colours come from the existing design tokens where possible.

Do not introduce an illustration library, canvas runtime, 3D dependency, or remote image service. Inline SVG keeps the assets sharp, themeable, lightweight, and available offline.

## Performance

- SVGs are static markup with CSS-only motion.
- No illustration requires JavaScript.
- Repeated decorative shapes should use SVG groups or component variants without producing an excessively large page.
- The production build must not add remote image requests or layout shifts.

## Verification

Automated checks cover:

- the presence of the four approved illustration components;
- the absence of banned grid, brain, robot, and laptop metaphors in illustration markup and accessible text;
- preservation of the adaptive download controls and required homepage messages;
- reduced-motion CSS for every animated illustration;
- a full static build.

Browser verification covers:

- visual hierarchy at desktop, tablet, and mobile widths;
- no horizontal overflow;
- readability of real product screenshots;
- correct stacking of hero and ecosystem scenes;
- restrained animation and reduced-motion behaviour;
- no console errors.
