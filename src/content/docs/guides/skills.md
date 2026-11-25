---
title: Skills
description: Recipes that teach a bot how to do a piece of work your way.
---

A **skill** is a recipe: the steps, the format and the details for a piece of work, done
the way you like it. A bot that has a skill follows it every time.

## Where skills come from

- **You write them**: open the **Plugin** page, press **Add** and choose **Create a
  skill** — or **Create with a bot**, which starts the chat with your request ready.
- **A bot saves them**: after a job that went well, ask the bot to save it as a skill.
  The bot proposes the change on an approval card — «{bot} wants to change skills» — and
  you allow it or deny it.
- **The catalog**: the **Browse** section offers a curated list of skills, downloaded
  from GitHub repositories at the exact commit the catalog pins.
- **Your other apps**: **Import skills** brings in the skills already on your Mac from
  Cursor, Claude Code, Codex or ZCode.
- **Plugins**: a plugin in the Claude Code format can carry skills and MCP servers.
  Homun never runs a plugin's hooks or commands; when a bot wants to install one, you
  get a card and you decide.

## Finding and using skills

The **Plugin** page lists every skill, with a search by name; each skill says where it
comes from, and skills with a GitHub origin can be updated from it.

Bots choose the right skill on their own when a request matches it. Some skills run only
when you call them with **/** in the chat.
