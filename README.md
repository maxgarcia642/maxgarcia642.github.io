# maximiliano-garcia-portfolio

Frutiger Aero portfolio (Wii + transparent Mac aesthetic) — static site ready for GitHub Pages.

**Deployed at (for repo `maxgarcia642/maxgarcia642.github.io`):**  
https://maxgarcia642.github.io/

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
   - Replace `https://raw.githubusercontent.com/example-user/...` in terminal `data-raw` attributes with your raw GitHub URLs to fetch snippets automatically.
   - Replace `https://linktr.ee/YOUR_LINKTREE_URL` with your LinkTree URL.
4. Test locally:
   - Serve the directory (some iframes like PDF previews work more reliably on `http(s)`):
     ```bash
     python3 -m http.server 8000
     ```
   - Open `http://localhost:8000`.

## Deploy to GitHub Pages (manual)
Because this repo is named `maxgarcia642.github.io`, push to `main` and GitHub Pages will publish automatically from root.

1. If you haven't already:
```bash
git init
git add .
git commit -m "feat: initial Frutiger Aero portfolio (Wii + Mac translucent style)"
git branch -M main
git remote add origin https://github.com/maxgarcia642/maxgarcia642.github.io.git
git push -u origin main
