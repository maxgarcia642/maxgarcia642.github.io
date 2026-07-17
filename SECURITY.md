# Security model — honest edition

This is a **public static site**. Everything below follows from that one fact.

## What is real here

1. **Zero secrets in the repo.** The old `content.json` shipped a bcrypt hash of
   the admin password to every visitor. It's gone. Nothing in this repo can be
   stolen because nothing here is secret.
2. **Fine-grained PAT, in memory only.** The admin panel writes to the repo via
   the GitHub Contents API using a token you paste each session. Scope it to
   this single repo, Contents: Read/write, ≤ 90-day expiry. It's held in a JS
   closure variable — never localStorage, never sessionStorage, never the repo.
   Close the tab and it's gone. If it ever leaks into a public commit, GitHub
   secret scanning auto-revokes it as a backstop.
3. **SRI on the CDN library.** `pdf.min.js` from cdnjs is pinned with a
   sha384 integrity hash computed from the actual file (2026-07-16). A tampered
   CDN copy will refuse to execute.
4. **Meta-CSP.** Script/style/frame/connect sources are pinned to the origins
   this site actually uses.
5. **Write throttling.** Admin writes are serialized ~1/1.2s, well under
   GitHub's secondary limit of 80 content-generating requests/minute.
6. **Vendored dependencies over CDN trust.** Fuse.js 7.5.0 ships in
   `vendor/fuse/` with its Apache-2.0 LICENSE and a PROVENANCE.md (exact
   version, source URL, fetch date). Self-hosting means the search library is
   covered by the repo's own integrity story instead of a third origin, and
   the site's search degrades to a built-in fallback if the file is absent.
   Rule for all future vendoring: verified LICENSE file upstream or the code
   doesn't come in — during the 2026-07-16 repo audit, two scout picks
   (mimopixel, HairyDuck/terminal) claimed MIT in their READMEs but shipped
   no LICENSE file, so only their *ideas* were reused, never their code.
7. **CI writes use the workflow's own `GITHUB_TOKEN`.** The daily
   market-pulse Action commits with the ephemeral, repo-scoped token GitHub
   issues to each run (`permissions: contents: write`) — no PAT stored, no
   secret configured, nothing to leak. It can only touch this repo, and the
   script it runs refuses to write anything on fetch failure.

## What is deliberately NOT here (because it would be theater)

- **No client-side "login."** Any password check in public JavaScript is
  obfuscation: the gated content already shipped to the browser. The token IS
  the auth. If genuinely private content ever needs to live here, encrypt it
  for real (StatiCrypt: AES-256-CBC + PBKDF2 at 600k iterations, strong
  passphrase) — ciphertext is the only thing a static host can protect.
  Verified in the 2026-07-16 repo audit (MIT, LICENSE present, PBKDF2 +
  WebCrypto confirmed in source). Recipe when the day comes:
  `npx staticrypt private.html -p "<long passphrase>"` → commit only the
  generated encrypted file, never the plaintext.
- **No WebAuthn/passkeys.** They verify assertions against a server. There is
  no server. Promising passkey security on a backend-free site would be a lie.
- **No "decentralized security" claims.** Content signing (minisign/C2PA)
  proves provenance and IPFS mirroring adds availability — neither adds access
  control. Worth doing if provenance itself becomes a showcase; not sold here
  as protection.

## Known limits (and the upgrade path)

- **Meta-tag CSP can't do everything.** `frame-ancestors`, `report-uri`, and
  sandbox directives are ignored in meta form — so clickjacking protection is
  absent on GitHub Pages. Real headers require a host that sets them:
  **Cloudflare Pages** (free, private-repo deploys, unlimited bandwidth,
  custom headers) is the designated migration target if/when that matters.
- **The PDF.js worker can't carry SRI.** `Worker()` has no integrity
  attribute; the CSP `script-src` origin pin (cdnjs only) is the control. To
  remove the CDN trust entirely, vendor `pdf.min.js` + `pdf.worker.min.js`
  into `/pdfjs/` and point `script.js` + `index.html` at the local copies.
- **`'unsafe-inline'` in script-src** exists solely for the 3-line FOUC guard.
  Moving to a host with real headers allows a nonce'd CSP instead.
- **GitHub Pages = public source.** Even a private repo would not hide the
  deployed HTML/CSS/JS (View Source sees all). Private-repo deploys need
  GitHub Pro or Cloudflare Pages; neither hides shipped client code.

## Token hygiene checklist

- [ ] Fine-grained, single-repo, Contents R/W only
- [ ] ≤ 90-day expiry, calendar reminder to rotate
- [ ] Pasted per-session; never saved anywhere
- [ ] Revoke immediately at github.com/settings/tokens if a device is lost
