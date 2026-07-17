# mammoth.js — provenance

- **Version:** 1.11.0
- **License:** BSD-2-Clause (see LICENSE alongside — verified in-package, not README-claimed)
- **Source:** https://unpkg.com/mammoth@1.11.0/mammoth.browser.min.js
- **Fetched:** 2026-07-16
- **Role:** DOCX → HTML rendering for the on-site document viewer (research
  papers open in a protected modal instead of downloading).
- **Load pattern:** lazy `<script>` injection on first document open — never
  on page load.
- **Update procedure:** bump the unpkg version in this file and re-download
  both files; re-verify the LICENSE ships in the package.
