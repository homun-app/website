/**
 * Derive public presentation flags from an approved roadmap item.
 *
 * @param {{
 *   status?: string,
 *   voting?: string,
 *   issueNumber?: number | null,
 *   githubUrl?: string,
 *   underReview?: boolean,
 * }} item
 * @returns {{ underReview: boolean, hasIssue: boolean, canDiscuss: boolean, canVote: boolean }}
 */
export function roadmapPresentation(item) {
	const issueNumber = item?.issueNumber;
	let issueUrlMatches = false;

	if (Number.isInteger(issueNumber) && issueNumber > 0) {
		try {
			const url = new URL(item.githubUrl);
			const match = url.pathname.match(/^\/[^/]+\/[^/]+\/issues\/(\d+)\/?$/);
			issueUrlMatches = url.protocol === "https:"
				&& url.hostname === "github.com"
				&& Number(match?.[1]) === issueNumber;
		} catch {
			issueUrlMatches = false;
		}
	}

	return {
		underReview: item?.underReview === true,
		hasIssue: issueUrlMatches,
		canDiscuss: issueUrlMatches,
		canVote: issueUrlMatches
			&& item?.status === "ideas"
			&& item?.voting === "open"
	};
}

/**
 * Select the one initiative that can truthfully be presented as currently building.
 *
 * @template {{ status?: string, featured?: boolean }} T
 * @param {T[]} items
 * @returns {T | undefined}
 */
export function selectFeaturedProject(items = []) {
	return items.find((item) => item.status === "building" && item.featured)
		?? items.find((item) => item.status === "building");
}
