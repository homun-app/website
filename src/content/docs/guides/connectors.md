---
title: Apps
description: Connect Gmail, Trello, Slack and more than a thousand other apps, or any MCP server, once for all your bots.
---

Open **Apps** from the sidebar. You connect an app once and **every bot can use it**:
bots know which apps you connected and use them straight away.

## Connecting an app

Search for the app and press connect. Homun shows where the app's data goes:

- **Direct**: the permission stays on your computer, and Homun talks to the service
  itself.
- **Through Composio**: sign-in and actions go through Composio's servers. With your own
  Composio key (the free plan is enough) you can connect more than a thousand apps, such
  as Gmail, Slack and HubSpot.

## More than one account

You can connect several accounts of the same app, for example a work and a personal
Gmail. Each account has its own name, which you can change, and bots know which one they
are using. Draft cards show the account a message will leave from.

## What bots may do with an app

Apps follow the same rules as everything else:

- **reading** is free;
- **sending** becomes a [draft](/guides/chat/#drafts) that leaves only when you confirm;
- **writing** (creating, changing, deleting) shows an approval card.

See [Approvals & safety](/guides/security/) to change how often bots ask.

## MCP servers

Under **For developers** you can add your own MCP servers, as a local command (stdio) or
a URL (HTTP). Headers and bearer tokens are saved encrypted. Use **test** to see the tools
a server offers.

## No connection? The browser

When a site has no app, the bot opens the browser on [its computer](/guides/local-computer/)
and does the job there.
