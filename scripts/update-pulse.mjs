#!/usr/bin/env node
/**
 * update-pulse.mjs — refreshes the live crypto chips in finance.json.
 *
 * Zero dependencies (Node 18+ built-in fetch). Run by the market-pulse
 * GitHub Action daily, or locally: `node scripts/update-pulse.mjs`.
 *
 * Rules:
 *  - Only touches marketPulse items with `live: true` AND a `coingeckoId`.
 *    Snapshot chips (gold, silver, S&P, cards) are never modified here —
 *    those carry dated, hand-verified figures with honesty context.
 *  - Updates `marketPulse.asOf` to today (UTC) only when a price changed.
 *  - Any fetch failure exits 0 without writing, so a CoinGecko rate-limit
 *    never turns the workflow red or commits garbage.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "finance.json");

const fmtUsd = (v) => {
  if (v >= 10000) return `~$${Math.round(v / 1000)}K`;
  if (v >= 1000) return `~$${(v / 1000).toFixed(1)}K`;
  return `~$${Math.round(v).toLocaleString("en-US")}`;
};

const data = JSON.parse(readFileSync(file, "utf8"));
const liveItems = (data.marketPulse?.items || []).filter(i => i.live && i.coingeckoId);
if (!liveItems.length) {
  console.log("No live chips with coingeckoId — nothing to do.");
  process.exit(0);
}

const ids = liveItems.map(i => i.coingeckoId).join(",");
let prices;
try {
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  prices = await res.json();
} catch (err) {
  console.log(`Fetch failed (${err.message}) — leaving finance.json untouched.`);
  process.exit(0);
}

let changed = false;
for (const item of liveItems) {
  const usd = prices[item.coingeckoId]?.usd;
  if (typeof usd !== "number") { console.log(`No price for ${item.coingeckoId} — skipped.`); continue; }
  const next = fmtUsd(usd);
  if (item.value !== next) {
    console.log(`${item.label}: ${item.value} → ${next}`);
    item.value = next;
    changed = true;
  } else {
    console.log(`${item.label}: unchanged (${next})`);
  }
}

if (changed) {
  data.marketPulse.asOf = new Date().toISOString().slice(0, 10);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote finance.json (asOf → ${data.marketPulse.asOf}).`);
} else {
  console.log("No price movement — file untouched.");
}
