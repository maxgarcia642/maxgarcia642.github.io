# maximiliano-garcia-portfolio — v4 "Shapeshifter"

Static portfolio for GitHub Pages. **Fifty** full themes, one skeleton.
Zero build step, zero backend, zero secrets in the repo.

**Live:** <https://maxgarcia642.github.io/>

> ⚠️ **Pages requires a public repo on the free plan.** Flipping this repo
> private on 2026-07-16 disabled GitHub Pages and 404'd the entire site.
> Keep it public (the deployed site exposes all client code anyway), upgrade
> to GitHub Pro, or migrate to Cloudflare Pages for private-repo deploys.

> **v4 (2026-07-17, expanded 2026-07-20):** 50 animated themes with per-theme particle weather (registry and CSS verified 50/50) · Top-50 Market Pulse in five groups (all 50 auto-refresh daily via CI; crypto+FX also live in-browser) · playlist music with skip + any-format visitor uploads · the admin token panel is retired in favor of a credential-free **Layout Settings** page · a Theme Studio to paint your own · the 🧭 Individualism section for personality-assessment posters · full spec in `Superprompt_v4_Website_Change_Spec.txt`.

## What's here

| File | Role |
| --- | --- |
| `index.html` | Structure + inline FOUC guard + meta-CSP + SRI-pinned PDF.js |
| `styles.css` | Layout skeleton — consumes theme tokens only |
| `themes.css` | The 50 personalities, generated from a config table (see the file header) — Frutiger Aero is the default; the full roster lives in `content.json → themes` |
| `script.js` | Theme dock, looping music + custom-track upload, lazy PDF.js rendering, protected doc reader, arcade facades, pixel studio, CoinGecko + Frankfurter refresh, converter, aero bubbles |
| `content-loader.js` | Fetches `content.json` + `finance.json`, renders posts / finance / arcade / dock |
| `content.json` | Site text, projects, arcade entries, theme registry |
| `finance.json` | The Financial Liberty Project: 10 works (9 live), Top-50 market pulse in five groups, honesty flags, research desk |
| `admin.html` + `settings.js` | Layout Settings — credential-free, localStorage-only page customization (the token admin panel is retired) |
| `theme-studio.js` | 🖌️ Theme Studio — paint a theme, preview live, save to your dock, export CSS |
| `assessments/` | 🧭 Individualism posters (IPIP-300 self-assessment; model runs land here too) |
| `vendor/fuse/` | Vendored Fuse.js 7.5.0 (Apache-2.0) powering site search — LICENSE + PROVENANCE included |
| `vendor/mammoth/` | Vendored mammoth.js 1.11.0 (BSD-2-Clause) — DOCX → HTML for the view-only reader |
| `vendor/xlsx/` | Vendored SheetJS CE 0.20.3 (Apache-2.0) — XLSX → tables for the view-only reader |
| `scripts/update-pulse.mjs` | Zero-dep daily refresher for all 50 pulse chips — CoinGecko + Frankfurter + Yahoo, host-allowlisted (run by CI or locally) |
| `.github/workflows/market-pulse.yml` | Daily Action: refresh live chips → commit → Pages redeploys with fresh data |
| `files/` | Downloadable deliverables (DOCX/XLSX) + compressed resume PDF |
| `superprompt-changelog.md` | Auto-appended by admin actions; feed for Cursor |
| `SECURITY.md` | The honest security model |
| `Cursor_Superprompt_Handover.txt` | Paste-ready handover for Cursor sessions |

## Grok round-1 features (2026-07-16)

**Site search** — press `/` anywhere or hit 🔎 in the nav. Fuzzy search over
every Financial Liberty work, research-desk link, post, arcade entry, and
section, powered by vendored Fuse.js 7.5.0 loaded lazily on first open. If
the vendor file ever goes missing, a built-in substring fallback keeps search
alive — the note under the results says which engine is running.

**Pixel Art Studio v2.1** — palettes (PICO-8 16-color, Game Boy DMG 4-color,
Mono), grid sizes 16/24/32 (resize confirms before clearing), horizontal
mirror mode (`M`), and size-aware PNG export. Feature set inspired by the
mimopixel editor from the repo scout; implemented natively with zero deps
because that repo ships no LICENSE file (see the changelog's audit notes).

**Self-refreshing market pulse** — a daily GitHub Action runs
`scripts/update-pulse.mjs`, which updates only the `live: true` crypto chips
from CoinGecko and commits when prices move; the push redeploys Pages so the
public site stays fresh with zero manual work. Snapshot chips (gold, S&P,
cards) stay hand-verified and dated, never auto-edited.

**Vendoring policy** — third-party runtime code lives in `vendor/<name>/`
with the upstream LICENSE and a PROVENANCE.md recording exact version,
source URL, fetch date, and update procedure. No LICENSE file upstream = no
code reuse, ideas only.

## Deploy

1. Push to `main` — the Pages workflow deploys the repo root.
2. That's it. No node, no build.

## The one manual step

**NWTI Works PDF.** The NWTI card currently links straight to OneDrive (the
share-link buttons were removed by request — one clean redirect). To bring it
on-site later:

1. Download the PDF from your OneDrive.
2. Compress it: `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=NWTI_Works.pdf input.pdf`
   (the `/ebook` preset, 150 dpi, is the balanced choice; verify quality after).
3. Drop it at `files/NWTI_Works.pdf` and add `"localPdf": "files/NWTI_Works.pdf"`
   back to the `nwti` entry in `content.json`.

## Music

`assets/music/track1.mp3` loops site-wide, starting on the visitor's first
interaction (browsers block true autoplay). ♫ mutes/unmutes (remembered);
🎧 lets a visitor play their own local file for the visit. See
`assets/music/README.md` for what ships and its licensing flag.

## Document reader (no downloads)

Research papers (DOCX) and workbooks (XLSX) open in a view-only modal reader —
mammoth.js and SheetJS render them client-side, download links are gone, and
selection/copy/context-menu are blocked in the reader. **This is deterrence,
not DRM** — see SECURITY.md for the honest limits.

## Arcade embeds (maintainer notes — the public UI shows no flaw hints)

- `nwaero.netlify.app` and the bolt.host app load in-place on click (Netlify
  and bolt don't force X-Frame-Options by default — verify after deploy).
- **Shuffle Rush:** facade shows a 🎵 logo and opens itch.io in a new tab. To
  embed in-place instead, paste your itch.io embed URL (itch → Distribute →
  Embed game) into the `embedUrl` field of the `shufflerush` entry in
  `content.json`. itch's Cloudflare layer intermittently blocks off-site
  frames, which is why the open-in-new-tab button never disappears.
- **Maxfolio:** the `_vercel_share` token in the current link expires. Swap in
  a production domain (and clear Vercel's X-Frame-Options) to enable embedding.
- **Handshake (Connect):** the tree links to joinhandshake.com generically —
  swap in the real profile URL in `index.html` when Max provides it.

## Retired from v1 (traceable, not silent)

- `server.js`, `replit.md`, `package.json` / `package-lock.json` — the Replit
  backend is gone; the site is fully static.
- `project-loader.js` — merged into `content-loader.js` (one request fewer).
- `adminPassword` in `content.json` — a public bcrypt hash protected nothing;
  see `SECURITY.md` for what replaced it.
- `SETUP.md` — superseded by this README + `SECURITY.md`.

## Editing content

Small edits: GitHub web editor or the admin panel (`/admin.html`).
Structured edits: `content.json` (site text, projects, arcade, themes) and
`finance.json` (Financial Liberty works + market pulse). Both are validated as
JSON by the admin editor before commit.

Patience pays. 🦞
