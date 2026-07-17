# maximiliano-garcia-portfolio — v2 "Shapeshifter"

Static portfolio for GitHub Pages. Ten full themes, one skeleton. Zero build
step, zero backend, zero secrets in the repo.

**Live:** <https://maxgarcia642.github.io/>

## What's here

| File | Role |
| --- | --- |
| `index.html` | Structure + inline FOUC guard + meta-CSP + SRI-pinned PDF.js |
| `styles.css` | Layout skeleton — consumes theme tokens only |
| `themes.css` | The 10 personalities: Frutiger Aero (default), Liquid Glass, Neobrutalism, Terminal CRT, Pixel Arcade, Aurora Mesh, Claymorphism, Cyberpunk Neon, Editorial Swiss, Dark Luxe |
| `script.js` | Theme dock, gesture-gated music, lazy PDF.js rendering, arcade facades, pixel studio, CoinGecko refresh, aero bubbles |
| `content-loader.js` | Fetches `content.json` + `finance.json`, renders posts / finance / arcade / dock |
| `content.json` | Site text, projects, arcade entries, theme registry |
| `finance.json` | The Financial Liberty Project: 10 works, market pulse (dated), honesty flags, research desk |
| `admin.html` | GitHub Contents API panel — direct commits, no PRs, auto-changelog |
| `vendor/fuse/` | Vendored Fuse.js 7.5.0 (Apache-2.0) powering site search — LICENSE + PROVENANCE included |
| `scripts/update-pulse.mjs` | Zero-dep refresher for the live crypto chips (run by CI or locally) |
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

**NWTI Works PDF.** The old OneDrive redirect existed because the PDF was too
large to embed. The viewer now handles big PDFs (pages render only when
scrolled into view), so:

1. Download the PDF from your OneDrive.
2. Compress it: `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=NWTI_Works.pdf input.pdf`
   (the `/ebook` preset, 150 dpi, is the balanced choice; verify quality after).
3. Drop it at `files/NWTI_Works.pdf` (the admin panel's upload does this in one
   commit). The "Read on-site" button on the NWTI card starts working the
   moment the file exists; the OneDrive links remain as fallback.

Same recipe for any future large PDF: compress → `files/` → reference it via
`localPdf` in `content.json`.

## Music

Drop a **royalty-free** MP3 at `assets/music/track1.mp3` — see
`assets/music/README.md` for the licensing rules. The ♪ dock button handles
the rest (no autoplay, ever — browsers block it and it's hostile anyway).

## Arcade embeds

- `nwaero.netlify.app` and the bolt.host app load in-place on click (Netlify
  and bolt don't force X-Frame-Options by default — verify after deploy).
- **Shuffle Rush:** paste your itch.io embed URL (itch → Distribute → Embed
  game) into the `embedUrl` field of the `shufflerush` entry in `content.json`.
  itch's Cloudflare layer intermittently blocks off-site frames, which is why
  the open-in-new-tab button never disappears.
- **Maxfolio:** the `_vercel_share` token in the current link expires. Swap in
  a production domain (and clear Vercel's X-Frame-Options) to enable embedding.

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
