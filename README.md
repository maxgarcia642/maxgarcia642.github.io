# maximiliano-garcia-portfolio

Frutiger Aero portfolio (Wii + transparent Mac aesthetic) — static site ready for GitHub Pages.

## Files included
- `index.html` — main page
- `styles.css` — Frutiger Aero styling
- `script.js` — interactions (smooth scroll, reveal, terminals, carousel, pixel art game)
- `assets/` — add `resume.pdf`, `project1.pdf`, `project2.pdf`, etc.
- optional `.github/workflows/pages.yml` (example provided below)

## Quick setup (local)
1. Create project folder and copy files.
2. Add your assets:
   - `assets/resume.pdf`
   - `assets/project1.pdf`
   - `assets/project2.pdf`
3. Edit placeholders in `index.html`:
   - Replace `https://raw.githubusercontent.com/example-user/...` in terminal `data-raw` attributes with your raw GitHub URLs.
   - Replace `https://linktr.ee/YOUR_LINKTREE_URL` with your LinkTree URL.
4. Test locally:
   - Open `index.html` in your browser. (For some iframe previews you may need to serve the site via a local http server.)
   - Quick local server (Python): `python3 -m http.server 8000` then open `http://localhost:8000`.

## Deploy to GitHub Pages (manual)
1. Create a repo (example name): `maximiliano-garcia-portfolio`
2. Initialize & push:
```bash
git init
git add .
git commit -m "feat: initial Frutiger Aero portfolio (Wii + Mac translucent style)"
git branch -M main
git remote add origin https://github.com/<your-username>/maximiliano-garcia-portfolio.git
git push -u origin main
