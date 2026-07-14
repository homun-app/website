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
 * @returns {{ underReview: boolean, canParticipate: boolean }}
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
		canParticipate: item?.status === "ideas"
			&& item?.voting === "open"
			&& issueUrlMatches,
	};
}
