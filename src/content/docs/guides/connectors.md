---
title: Plugins
description: Connect Gmail, Trello, Slack and a thousand other apps, or any MCP server, once for all your bots.
---

Open **Plugin** from the sidebar: connectors, MCP servers and skills all live there. You
connect an app once and **every bot can use it** (an app can also be limited to some
bots).

## Connecting an app

Find the app in the connectors list and press connect. Each app's card says where its
data goes:

- **direct MCP**: Homun talks to the service's own server from your computer, with no
  intermediary — Notion, Linear, Cloudflare, Sentry and Stripe work this way today;
- **via Composio**: sign-in and actions go through Composio's servers — Gmail, Trello,
  Slack, HubSpot and a thousand more. The sign-in happens in the browser, with no key to
  create, and the card says the app passes through Composio.

## More than one account

You can connect several accounts of the same app, for example a work and a personal
Gmail. Each account has its own name, which you can change, and bots know which one they
are using. Draft cards show the account a message will leave from.

## What bots may do with an app

Apps follow the same rules as everything else, set by **When to ask** in
[Approvals & safety](/guides/security/):

- **reading** is free;
- **sending** becomes a [draft](/guides/chat/#drafts) that leaves only when you confirm;
- **writing** (creating, changing, deleting) shows an approval card.

## MCP servers

From the **Add** menu choose **Custom MCP server**: a local command (stdio) or a URL
(HTTP). Bearer tokens are saved encrypted, and the connection is tested as soon as you
save it — the row shows how many tools the server offers.

## No connection? The browser

When a site has no app, the bot can open the browser on the [bots'
computer](/guides/local-computer/) and do the job there.
