# Homun download routing design

## Goal

Let visitors download the newest Homun installer for their operating system with one click, without requiring an account or updating the website whenever a new release is published. Visitors must also be able to choose an installer for another supported operating system.

The public sources are:

- release binaries: `https://github.com/homun-app/homun-releases`
- source code: `https://github.com/homun-app/homun-core`

## User experience

The primary call to action adapts its label to the detected operating system:

- `Download for macOS`
- `Download for Windows`
- `Download for Linux`
- `Download Homun` when the operating system cannot be identified

Clicking the primary action resolves the latest public GitHub release and immediately downloads the preferred installer for the detected operating system. Detection happens only in the browser and does not identify or register the visitor.

The download section also exposes a `Download for another platform` control. It reveals every installer type currently supported by the latest release:

- macOS: `.dmg`
- Windows: `.exe`
- Linux: `.AppImage` and `.deb`

The UI must not claim that an architecture or installer is available unless a matching asset exists in the latest release. In particular, the current macOS release contains an Apple Silicon `.dmg` but no Intel `.dmg`, so the website must not promise Intel support until that asset is published.

## Release resolution

A small client-side resolver requests the latest release metadata from the public GitHub Releases API when a visitor initiates a download or opens the alternate-platform chooser. It selects assets by operating system and installer extension rather than embedding a version number.

Preferred installer order:

1. macOS: `.dmg`
2. Windows: `.exe`
3. Linux: `.AppImage`, with `.deb` available as an alternative

Release metadata is cached in memory for the page session so opening the chooser and downloading do not repeat the request. No token or GitHub authentication is embedded in the website.

## Failure behaviour

If the operating system is unknown, GitHub cannot be reached, the API rate limit is exhausted, or no compatible asset is present, the visitor is sent to:

`https://github.com/homun-app/homun-releases/releases/latest`

The primary action remains usable while metadata is loading, shows a brief resolving state after activation, and prevents duplicate activations until resolution finishes. It must never leave the visitor on a disabled button without a fallback destination.

## Website integration

- Hero download action: uses the adaptive direct-download behaviour.
- Navigation download action: uses the same behaviour.
- Homepage download section: shows the detected primary installer and the alternate-platform chooser.
- Download documentation: links to the latest releases and accurately describes the currently published platforms and installer types.
- Footer: replaces the generic GitHub link with `Source code` pointing to `homun-core`, and adds `All releases` pointing to `homun-releases/releases/latest`.

All download entry points use one shared resolver and one source of truth for repository URLs, asset matching, labels, and fallback behaviour.

## Accessibility and privacy

- Download controls remain standard links or buttons with keyboard access and visible focus states.
- Loading and error changes are announced without moving focus unexpectedly.
- The alternate-platform chooser exposes its expanded state to assistive technology.
- Operating-system detection stays local to the browser. Homun does not store it or require an account.

## Verification

Automated checks cover:

- macOS, Windows, Linux, and unknown-platform selection;
- correct preference between Linux `.AppImage` and `.deb`;
- exclusion of updater metadata, blockmaps, archives, and unsupported assets;
- fallback to the latest-release page on API or matching failure;
- the presence of direct-download integration in the hero, navigation, download section, documentation, and footer;
- a full static site build.

Browser verification covers:

- the detected label on desktop and mobile;
- successful opening of the alternate-platform chooser;
- direct download targeting without actually saving a large installer during the test;
- fallback behaviour with a simulated resolver failure;
- no layout overflow and no console errors.
