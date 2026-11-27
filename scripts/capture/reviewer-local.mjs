// The reviewer `local` of the site's capture: a fixture, not a model.
// The engine runs it as a `command` reviewer (reviewers.yaml): the request
// JSON arrives on stdin, the answer leaves on stdout —
// `{ decision: accept | reject | escalate, reason, confidence }`.
// Fixed rule: what the user stated is accepted with confidence 0.9; a reason
// that hedges ("once") is still an accept, but at 0.6, under the policy's
// min_confidence (0.8), so the proposal stays in the queue; the rest goes
// to the person (escalate).
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
	input += chunk;
});
process.stdin.on("end", () => {
	let request;
	try {
		request = JSON.parse(input);
	} catch {
		process.stdout.write(JSON.stringify({ decision: "escalate", reason: "Unreadable request", confidence: 0 }));
		return;
	}
	const reason = String(request.proposal?.reason ?? "");
	const said = /user (said|stated|told)|the user/i.test(reason);
	let answer;
	if (!said) {
		answer = { decision: "escalate", reason: "Not something the user stated: a human decides", confidence: 0.5 };
	} else if (/\bonce\b/i.test(reason)) {
		answer = { decision: "accept", reason: "The user said so, but only once", confidence: 0.6 };
	} else {
		answer = { decision: "accept", reason: "A stable fact the user stated", confidence: 0.9 };
	}
	process.stdout.write(JSON.stringify(answer));
});
