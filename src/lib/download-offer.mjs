// The offer at build time. The download UI renders from the same snapshot the
// changelog reads — never a hand-written platform list — and the resolver in
// the browser replaces it with the live one on click.
import { offerFromRelease, pickCurrentRelease } from "../scripts/downloads.mjs";
import snapshot from "../data/releases.json";

const toGitHubShape = ({ version, publishedAt, prerelease, assets }) => ({
	tag_name: version,
	published_at: publishedAt,
	prerelease,
	draft: false,
	assets: (assets ?? []).map(({ name, downloadUrl }) => ({ name, browser_download_url: downloadUrl })),
});

export function buildTimeOffer() {
	return offerFromRelease(pickCurrentRelease(snapshot.items.map(toGitHubShape)));
}
