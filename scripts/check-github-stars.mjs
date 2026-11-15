import assert from "node:assert/strict";
import { fetchStarCount, formatStars } from "../src/lib/github-stars.mjs";

const response = (data) => async () => ({ ok: true, json: async () => data });
assert.equal(await fetchStarCount(response({ stargazers_count: 7600 })), 7600);
assert.equal(await fetchStarCount(async () => { throw new Error("offline"); }), null);
assert.equal(await fetchStarCount(async () => ({ ok: false })), null);
assert.equal(await fetchStarCount(response({})), null);
assert.equal(await fetchStarCount(response({ stargazers_count: -1 })), null);
assert.equal(await fetchStarCount(() => new Promise(() => {}), { timeoutMs: 10 }), null);
for (const [value, display] of [[999, "999"], [7600, "7.6k"], [12000, "12k"]]) {
	assert.equal(formatStars(value), display);
}
console.log("GitHub stars formatting and failure handling passed");
