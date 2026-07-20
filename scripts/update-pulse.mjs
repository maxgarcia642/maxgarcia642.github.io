#!/usr/bin/env node
/* update-pulse.mjs v2 — daily CI refresh for ALL 50 Market Pulse chips.
   Three keyless sources, one per group family:
     · crypto      → CoinGecko simple/price   (items with coingeckoId)
     · currencies  → Frankfurter (ECB)        (items with fxCode)
     · benchmarks  → Yahoo Finance v8 chart   (items with a yahoo symbol) —
       metals, energy, agriculture, indices. Yahoo has no CORS for browsers,
       but this runs server-side in Actions where CORS doesn't apply.
   Values are written back into finance.json preserving each chip's display
   format; usdPerUnit/perUsd update for the converter; asOf bumps only when
   something actually changed. Any source failing soft-fails alone — a bad
   day at one API never blocks the other 40 chips. GITHUB_TOKEN only. */
import { readFile, writeFile } from "node:fs/promises";

const PATH = new URL("../finance.json", import.meta.url);
const fin = JSON.parse(await readFile(PATH, "utf8"));
const items = fin.marketPulse.items;
const UA = { "User-Agent": "maxgarcia642.github.io market-pulse (contact: repo issues)" };
let changed = 0;

const fmtUsd = (v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: v >= 100 ? 0 : v >= 1 ? 2 : 4 })}`;

async function getJSON(url, headers = UA) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

/* Re-render a chip's display string in the same style it already uses. */
function reformat(item, v) {
  const old = item.value;
  if (/^\$/.test(old)) {
    const unit = (old.match(/\/[a-zA-Z]+$/) || [""])[0];
    const dp = (old.match(/\.(\d+)/) || [, ""])[1].length;
    return `$${v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}${unit}`;
  }
  if (/¢\//.test(old)) {
    const unit = old.slice(old.indexOf("¢"));
    const dp = (old.match(/\.(\d+)¢/) || [, ""])[1].length;
    return `${v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}${unit}`;
  }
  if (/%$/.test(old)) return `${v.toFixed(2)}%`;
  if (/\/\$$/.test(old)) return old; // fx handled separately
  return v.toLocaleString("en-US", { maximumFractionDigits: /\./.test(old) ? 2 : 0 });
}
function apply(item, v) {
  if (!Number.isFinite(v)) return;
  const prevRaw = item.raw;
  item.raw = v;
  if (item.perUsd !== undefined || item.fxCode) {
    item.perUsd = v;
    item.value = `${v.toLocaleString("en-US", { maximumSignificantDigits: 4 })} ${item.fxCode}/$`;
  } else {
    if (!item.noCalc) item.usdPerUnit = item.group === "agri" && /¢/.test(item.value) ? +(v / 100).toFixed(6) : v;
    item.value = item.coingeckoId ? fmtUsd(v) : reformat(item, v);
  }
  if (prevRaw !== v) changed++;
}

/* 1 — CoinGecko */
try {
  const cs = items.filter(i => i.coingeckoId);
  if (cs.length) {
    const data = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${cs.map(i => i.coingeckoId).join(",")}&vs_currencies=usd`);
    for (const i of cs) apply(i, data[i.coingeckoId]?.usd);
    console.log(`coingecko: ${cs.length} chips`);
  }
} catch (e) { console.error("coingecko soft-fail:", e.message); }

/* 2 — Frankfurter */
try {
  const fs_ = items.filter(i => i.fxCode);
  if (fs_.length) {
    const data = await getJSON(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${fs_.map(i => i.fxCode).join(",")}`);
    for (const i of fs_) apply(i, data.rates?.[i.fxCode]);
    console.log(`frankfurter: ${fs_.length} chips`);
  }
} catch (e) { console.error("frankfurter soft-fail:", e.message); }

/* 3 — Yahoo (sequential + small delay; be a polite guest) */
const ys = items.filter(i => i.yahoo);
for (const i of ys) {
  try {
    const d = await getJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(i.yahoo)}?interval=1d&range=1d`,
      { "User-Agent": "Mozilla/5.0 (compatible; market-pulse CI)" });
    apply(i, d?.chart?.result?.[0]?.meta?.regularMarketPrice);
    await new Promise(r => setTimeout(r, 400));
  } catch (e) { console.error(`yahoo soft-fail ${i.id}:`, e.message); }
}
console.log(`yahoo: ${ys.length} chips attempted`);

if (changed) {
  fin.marketPulse.asOf = new Date().toISOString().slice(0, 10);
  await writeFile(PATH, JSON.stringify(fin, null, 2) + "\n");
  console.log(`updated ${changed} values → asOf ${fin.marketPulse.asOf}`);
} else {
  console.log("no changes — finance.json untouched");
}
