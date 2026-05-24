#!/usr/bin/env node
// Fetch all real audio podcasts from EngineerPro's Substack archive and
// print them as TypeScript object literals ready to paste into
// src/lib/podcasts.ts.
//
// Usage:
//   node .cursor/skills/sync-engineerpro-podcasts/scripts/fetch-podcasts.mjs
//
// See SKILL.md in the same directory for the full workflow.

const API = "https://engineerprovn.substack.com/api/v1/archive";
const PAGE = 30;

async function fetchBatch(offset) {
  const url = `${API}?sort=new&offset=${offset}&limit=${PAGE}&type=podcast`;
  const res = await fetch(url, {
    headers: { "User-Agent": "lampham-portfolio-sync/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: HTTP ${res.status} for offset=${offset}`);
  }
  return res.json();
}

function formatDuration(rawSeconds) {
  if (!rawSeconds) return "0:00";
  const s = Math.floor(rawSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function inferSeries(p) {
  const t = (p.title || "").toLowerCase();
  const s = (p.subtitle || "").toLowerCase();
  const slug = (p.slug || "").toLowerCase();
  const combo = `${t} ${s} ${slug}`;

  if (/(hieu|hiếu)/.test(combo)) return "Coffee with Lam & Mr. Hiếu";
  if (/low.?level|machine coding/.test(t)) return "Big Tech Interview Style";
  if (/lộ trình|lo trinh|giải đáp.*lộ trình/.test(combo)) return "Lộ trình EngineerPro";
  if (/coffee with lam/.test(combo)) return "Coffee with Lam";
  return "Coffee with Lam";
}

async function main() {
  // Substack's archive API is quirky:
  //   * offset=0 with type=podcast returns a mix of audio and text "podcast"
  //     posts (text posts have no podcast_upload_id and we drop them).
  //   * offset=2+ returns only true audio episodes.
  // Walking offset by 2 and deduping by canonical_url collects everything.
  const seen = new Map();
  const STEP = 2;
  const MAX_OFFSET = 500; // safety
  let emptyInARow = 0;

  for (let offset = 0; offset < MAX_OFFSET; offset += STEP) {
    const batch = await fetchBatch(offset);
    if (!Array.isArray(batch) || batch.length === 0) {
      emptyInARow += 1;
      if (emptyInARow >= 2) break;
      continue;
    }
    emptyInARow = 0;
    for (const p of batch) {
      if (!p.podcast_upload_id) continue;
      if (!p.canonical_url) continue;
      seen.set(p.canonical_url, p);
    }
  }

  const sorted = [...seen.values()].sort((a, b) =>
    String(b.post_date).localeCompare(String(a.post_date)),
  );

  const j = (v) => JSON.stringify(v);

  console.log(`// Fetched ${sorted.length} live audio episodes from EngineerPro Substack.`);
  console.log(`// Diff against src/lib/podcasts.ts — paste the missing ones at the top of the array.`);
  console.log("");

  for (const p of sorted) {
    const date = (p.post_date || "").slice(0, 10);
    const duration = formatDuration(p.podcast_duration);
    const series = inferSeries(p);
    const title = (p.title || "").trim();
    const url = p.canonical_url;

    console.log("  {");
    console.log(`    title: ${j(title)},`);
    console.log(`    series: ${j(series)},`);
    console.log(`    date: ${j(date)},`);
    console.log(`    duration: ${j(duration)},`);
    console.log(`    url: ${j(url)},`);
    console.log("  },");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
