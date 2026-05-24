---
name: sync-engineerpro-podcasts
description: Pull the latest podcast episodes from the EngineerPro Substack archive and merge any new ones into src/lib/podcasts.ts. Use when the user says "pull podcast mới", "sync podcast", "có podcast mới chưa", or asks to refresh the podcast list on the portfolio.
---

# Sync EngineerPro podcasts

The portfolio's `Podcasts` section is backed by a hand-curated array in `src/lib/podcasts.ts`. New episodes appear on the [EngineerPro Substack](https://engineerprovn.substack.com/podcast/archive) over time. This skill is the one-command workflow to refresh that array.

## TL;DR

```bash
make sync-podcasts          # prints all live episodes as TS objects
```

Then look at `src/lib/podcasts.ts`, paste in any episodes whose `url` is missing.

## How it works under the hood

1. Substack's public archive page only shows ~12 episodes (UI truncation).
2. The **internal archive API** returns everything when paginated:
   ```
   GET https://engineerprovn.substack.com/api/v1/archive
     ?sort=new
     &offset=N
     &limit=30
     &type=podcast
   ```
3. Each post is JSON. Real audio episodes have `podcast_upload_id` set (not `null`); other posts are text masquerading as `type: "podcast"` — skip those.
4. The script `scripts/fetch-podcasts.mjs` paginates, dedupes by URL, infers a series tag from the title/subtitle, and prints TypeScript object literals ready to paste into `src/lib/podcasts.ts`.

## Workflow for the agent

When the user asks to sync podcasts:

1. **Run the script** to get the live list:

   ```bash
   node .cursor/skills/sync-engineerpro-podcasts/scripts/fetch-podcasts.mjs
   ```

   (or the shortcut: `make sync-podcasts`)

2. **Read `src/lib/podcasts.ts`** and collect existing `url` values into a set.

3. **Diff**: any object in the script output whose `url` isn't already in the file is *new*.

4. **Insert new episodes** into the `podcasts` array, **at the top** (newest first — the rest of the array is already in descending date order). Keep the surrounding objects untouched.

5. **Sanity-check the series tag** the script inferred:
   - `Coffee with Lam` — default
   - `Coffee with Lam & Mr. Hiếu` — when title or subtitle mentions Hiếu / Hieu
   - `Big Tech Interview Style` — for one-off interview-style topics
   - `Lộ trình EngineerPro` — for roadmap/Q&A episodes
   - If the script's guess looks wrong (e.g. it gave `Coffee with Lam` to something co-hosted), override it manually.

6. **Title cleanup** (only if needed):
   - Substack titles are often `ALL CAPS WITH – EN-DASH` clickbait. Convert to sentence case in Vietnamese (keep proper nouns and `Big Tech`, capitalise sparingly).
   - Use `—` (em dash) instead of `-` between clauses.
   - Keep the original meaning. This matches the tone used in `lampham-humble-story` skill.

7. **Reading time / scale check**: the `duration` field comes from the API (`podcast_duration` seconds → `HH:MM:SS` or `MM:SS`). Do not edit.

8. **Run the build** to verify:

   ```bash
   make github       # full prod build
   # or
   npm run build
   ```

9. **Report back** to the user: how many episodes added, list of titles, oldest/newest dates.

## Don't touch

- The first 5 fields of the `Podcast` type (`title`, `series`, `date`, `duration`, `url`) match the array shape — don't change the type definition.
- `PODCAST_HOME`, `PODCAST_SPOTIFY`, `PODCAST_SPOTIFY_EMBED` constants — those are stable.

## If the API ever changes

The script catches HTTP errors and exits with code 1. Symptoms of a Substack API change:

- Script prints `Fetch failed: HTTP 4xx/5xx` → endpoint moved or rate-limited.
- Script prints zero items but exit 0 → field renamed (e.g. `podcast_upload_id` → something else).

Inspect a sample response in the browser:

```
https://engineerprovn.substack.com/api/v1/archive?sort=new&offset=0&limit=5&type=podcast
```

Adjust the field name in `scripts/fetch-podcasts.mjs` if needed.
