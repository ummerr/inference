---
name: scrape-genmedia-prices
description: Scrape current API prices for generative media models and merge them into data/genmedia-prices.json. Triggers on "scrape prices", "update video prices", "refresh genmedia pricing", or explicit /scrape-genmedia-prices invocation. v1 scope is video (Seedance 2.0, Grok Imagine/Video).
---

# scrape-genmedia-prices

Refresh the repo's GenMedia pricing dataset at `data/genmedia-prices.json` by scraping provider pricing docs. v1 covers **video** only, for two providers: **Seedance 2.0** (ByteDance/Volcengine) and **xAI Grok Imagine/Video**.

The output JSON is a reference dataset. It is **not** auto-wired into the site build — the human reviews it and decides whether to update `src/modalities.ts`.

## Scope (v1)

| Provider | Model | Primary source URL | Fallback |
|---|---|---|---|
| ByteDance | Seedance 2.0 | https://www.volcengine.com/docs/82379 | https://www.volcengine.com/product/doubao |
| ByteDance | Seedance 2.0 (pricing page) | https://www.volcengine.com/pricing?product=doubao | WebSearch: `Seedance 2.0 API pricing per second` |
| xAI | Grok Imagine / Grok Video | https://docs.x.ai/docs/models | https://x.ai/api |
| xAI | Grok Video (pricing) | https://x.ai/api#pricing | WebSearch: `xAI Grok video API pricing per second` |

## Procedure

1. **Load existing data.** Read `data/genmedia-prices.json`. If missing, start from `{ "updated": null, "modality": "video", "entries": [] }`.

2. **Fetch each primary URL with `WebFetch`.** Use this extraction prompt verbatim per URL:

   > "Extract any pricing for video generation models. For each model/tier return: model name, version, variant (e.g. Pro/Lite, resolution tier), price (with currency and unit — per second of output video, per clip, per 1M tokens, etc.), supported resolutions, max clip duration, and any free-tier or rate-limit notes. If no video pricing appears on this page, say so explicitly."

3. **Fallback on miss.** If a primary URL 404s, returns no pricing, or the page is behind a login wall: `WebSearch` the fallback query from the table above and `WebFetch` the top 1–2 results that are on an official provider domain (volcengine.com, bytedance.com, x.ai, docs.x.ai). Do not accept third-party aggregator prices unless no official source is reachable; if you must, note `"source_quality": "third_party"` in the entry.

4. **Normalize.** Convert every entry to the schema below. Rules:
   - `price_usd` is **always USD**. If the source quotes CNY, convert at a fixed rate of **1 USD = 7.2 CNY** and put `"fx_rate": "1USD=7.2CNY"` in `notes`.
   - `unit` is one of: `per_second_of_video`, `per_clip`, `per_1k_tokens`, `per_1m_tokens`, `per_image`, `per_request`. If the provider uses a custom unit (e.g. "resource pack"), pick the closest and explain in `notes`.
   - If a field is truly unknown, use `null` — do not guess.

5. **Merge.** Match existing entries by the composite key `(provider, model, version, variant)`. If an entry with the same key exists:
   - Move the old entry into its `history[]` array (create if absent), capped at the most recent 5 history records.
   - Overwrite top-level fields with the new values.
   - If `price_usd` changed, flag in the diff output.

   New entries are appended. Entries present in the old file but not re-scraped this run are left untouched (not deleted).

6. **Write** the updated JSON back to `data/genmedia-prices.json` with `updated` set to the current ISO-8601 UTC timestamp. Pretty-print with 2-space indent.

7. **Report.** Emit a markdown table to the user:
   ```
   | Provider | Model | Variant | Old $ | New $ | Δ | Source |
   ```
   Plus a short "Warnings" section listing any entry with `price_usd: null`, ambiguous units, or fallback-source usage.

## JSON schema

```json
{
  "updated": "2026-04-14T00:00:00Z",
  "modality": "video",
  "entries": [
    {
      "provider": "bytedance",
      "model": "seedance",
      "version": "2.0",
      "variant": "pro-1080p",
      "unit": "per_second_of_video",
      "price_usd": 0.15,
      "resolution": "1920x1080",
      "max_duration_s": 10,
      "source_url": "https://www.volcengine.com/pricing?product=doubao",
      "source_fetched_at": "2026-04-14T00:00:00Z",
      "source_quality": "official",
      "notes": "fx_rate: 1USD=7.2CNY",
      "history": []
    }
  ]
}
```

## Validation (run before writing)

- Reject the run if zero entries were successfully parsed — tell the user which URLs failed and stop.
- Flag (do not reject) entries where `price_usd` is null, `unit` is ambiguous, or `source_quality != "official"`.
- Verify JSON parses cleanly after write.

## Non-goals (v1)

- Do not edit `src/modalities.ts`. The human backports numbers manually after reviewing the JSON.
- Do not create a git commit or open a PR. Leave the diff staged for the human.
- Do not scrape image/audio/world-model providers yet — extending the skill there is a future task that should add a `modality` branch to this same file.
