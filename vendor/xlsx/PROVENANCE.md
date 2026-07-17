# SheetJS CE (xlsx) — provenance

- **Version:** 0.20.3
- **License:** Apache-2.0 (see LICENSE alongside — verified in-package)
- **Source:** https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
- **Fetched:** 2026-07-16
- **Role:** XLSX → HTML table rendering for the on-site workbook viewer.
  This was flagged as a future candidate in the Grok round-1 scout ledger
  ("reading the actual XLSX deliverables in-browser") — that future is now.
- **Load pattern:** lazy `<script>` injection on first workbook open.
- **Update procedure:** new versions publish to cdn.sheetjs.com (NOT npm —
  the npm `xlsx` package is stale at 0.18.x); update the URL + this file.
