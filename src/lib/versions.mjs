export const MIN_PUBLIC_VERSION = "0.3.0";

const versionPattern = /^v?(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(tag) {
	if (typeof tag !== "string") return null;
	const match = versionPattern.exec(tag.trim());
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareVersions(a, b) {
	const left = parseVersion(a);
	const right = parseVersion(b);
	if (!left && !right) return 0;
	if (!left) return -1;
	if (!right) return 1;
	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) return left[index] - right[index];
	}
	return 0;
}

// A pre-release tag names the version it precedes: "v0.3.1001-beta.20" is a
// pre-release of 0.3.1001. The line it belongs to is what places a release
// in a product ("Homun 2" is everything before MIN_PUBLIC_VERSION).
export function baseVersion(tag) {
	if (typeof tag !== "string") return null;
	return tag.trim().replace(/-[a-zA-Z][\w.-]*$/, "");
}
