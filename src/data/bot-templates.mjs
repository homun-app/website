// The six bot templates of Homun 0.3. Ids, names, emojis and behaviors come
// from ~/Projects/Bot/Sandbot/src/main/templates/*.json (name.en, avatar and
// the routine prompt each template ships with). Every scene is a short chat
// arc grounded in what the template really does — free reads, reply drafts to
// approve, silence on empty days, facts kept in memory — and always ends with
// the decision left to the user: a bot never sends on its own. `shortName` is
// the chip label; `name` stays in the "Then pick …" line and the window title.

export const BOT_TEMPLATES = [
	{
		id: "inbox-manager",
		name: "Inbox manager",
		shortName: "Inbox",
		emoji: "📬",
		tagline: "Triage the mail. Draft the replies.",
		scene: [
			{ from: "system", text: "⏱ mail check · weekday mornings" },
			{ from: "bot", text: "morning mail is in — 11 read, two want a decision" },
			{ from: "bot", text: "the supplier thread needs a yes or a no by friday" },
			{ from: "bot", status: "draft", text: "draft reply ready — holds the price, waits for you" },
			{ from: "user", text: "hold it, i'll read the thread first" },
			{ from: "bot", text: "ok — nothing leaves the outbox without you" },
		],
	},
	{
		id: "meeting-prep",
		name: "Meeting preparation assistant",
		shortName: "Meeting prep",
		emoji: "🗓️",
		tagline: "Tomorrow's meetings, prepared tonight.",
		scene: [
			{ from: "system", text: "⏱ tomorrow's prep · 17:00" },
			{ from: "bot", text: "two meetings tomorrow: the design review and your 1:1" },
			{ from: "bot", text: "prep card ready — agenda points found, who's in, last decision on file" },
			{ from: "bot", text: "the notes say one question is still open — i did not guess an answer" },
			{ from: "user", text: "put that question on top" },
			{ from: "bot", status: "done", text: "done — it opens the card tomorrow morning" },
		],
	},
	{
		id: "daily-briefing",
		name: "Daily briefing editor",
		shortName: "Daily briefing",
		emoji: "☀️",
		tagline: "Agenda, loose ends, news. One line each.",
		scene: [
			{ from: "system", text: "⏱ morning briefing · 07:00" },
			{ from: "bot", text: "three meetings today, first at 09:30" },
			{ from: "bot", text: "yesterday's loose end: the invoice thread is still open" },
			{ from: "bot", text: "one story for you, source cited — the rest stayed quiet" },
			{ from: "user", text: "keep it this short" },
			{ from: "bot", status: "done", text: "noted in memory — tomorrow, same three lines" },
		],
	},
	{
		id: "chief-of-staff",
		name: "Chief of staff",
		shortName: "Chief of staff",
		emoji: "🧭",
		tagline: "What still stands. What needs you.",
		scene: [
			{ from: "system", text: "⏱ end-of-day picture · 18:00" },
			{ from: "bot", text: "the day closes with two things still standing" },
			{ from: "bot", text: "the contract thread asks for a decision, the rest can wait" },
			{ from: "bot", text: "tomorrow wants an hour of you — the morning is full" },
			{ from: "user", text: "if i act on one thing only?" },
			{ from: "bot", text: "answer the contract thread tonight — the rest follows" },
		],
	},
	{
		id: "mention-monitor",
		name: "Mention monitor",
		shortName: "Mentions",
		emoji: "👂",
		tagline: "Your name in public. Only what matters.",
		scene: [
			{ from: "system", text: "⏱ mention round · 08:30" },
			{ from: "bot", text: "watch list checked — two hits, one clears the bar" },
			{ from: "bot", text: "a forum thread cites your project, link is real" },
			{ from: "bot", text: "the other hit looks like a namesake — logged, not flagged" },
			{ from: "user", text: "wake me only for the real ones" },
			{ from: "bot", status: "done", text: "agreed — silence unless it clears the bar" },
		],
	},
	{
		id: "executive-assistant",
		name: "Executive assistant",
		shortName: "Executive assistant",
		emoji: "🤵",
		tagline: "Your open list, kept from day to day.",
		scene: [
			{ from: "system", text: "⏱ morning · 08:30" },
			{ from: "bot", text: "opening your list — one thing came over from yesterday: the insurance renewal is still unsigned" },
			{ from: "bot", text: "adding one for today: the landlord wants an answer by noon" },
			{ from: "user", text: "the insurance is done, i signed it last night" },
			{ from: "bot", status: "done", text: "crossed out — the list is down to the landlord reply" },
			{ from: "bot", text: "i'll carry the rest to tomorrow, nothing gets dropped" },
		],
	},
];

export const DEFAULT_TEMPLATE_ID = "inbox-manager";

export function findTemplate(templateId) {
	return (
		BOT_TEMPLATES.find((template) => template.id === templateId) ??
		BOT_TEMPLATES.find((template) => template.id === DEFAULT_TEMPLATE_ID)
	);
}
