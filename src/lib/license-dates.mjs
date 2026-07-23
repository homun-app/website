export function changeDate(publishedAt) {
	const date = new Date(publishedAt);
	if (Number.isNaN(date.valueOf())) {
		throw new Error(`Invalid release timestamp: ${publishedAt}`);
	}
	date.setUTCFullYear(date.getUTCFullYear() + 2);
	return date.toISOString();
}
