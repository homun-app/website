---
title: Models
description: Use a cloud provider, a model on your network, or the model built into Homun that runs entirely on your computer.
---

Each bot uses a model you choose. You can mix them: a cloud model for the bot that writes
reports, a local one for the bot that reads your mail.

## Three kinds of model

- **Built-in**: a model that runs inside Homun on your computer. No costs, and your data
  stays on your machine. It is slower and makes more mistakes than cloud models.
- **On your network**: [Ollama](https://ollama.com) and [LM Studio](https://lmstudio.ai)
  running on your computer are found automatically; you can also add a server elsewhere
  on your network by its address.
- **Cloud**: OpenAI, Anthropic, Mistral, OpenRouter, Z.ai, xAI, DeepSeek, Groq, or any
  OpenAI-compatible service, with your API key. You pay the provider per use.

## Adding a provider

Open **Settings › Models** and press **Add provider**. Enter the API key, or the address
for a server on your network; Homun tests it and shows how many models are available.
API keys are stored encrypted in the [Vault](/guides/security/#the-vault).

## The built-in model

The built-in model is **Qwen3.5 4B** (about 2.7 GB, Apache-2.0 license). Install it from
**Settings › Models › Built-in**. Homun checks your computer first: with less than 16 GB
of memory it warns you that the model will be slow, and it needs enough free disk space.
You can pause, resume and remove the download.

## Choosing the model of each bot

- **Bot model** in **Settings › Models** is the default for every bot. Add **fallbacks**:
  if the model does not answer, bots move to the next one.
- To give one bot a different model, open its panel and change the model under its name.
- **Approvals model** is the model that reviews actions when approvals are set to
  **Automatic**. Without one, Automatic always asks.

## Costs

**Settings › Usage & costs** shows what cloud models cost this month, bot by bot.
