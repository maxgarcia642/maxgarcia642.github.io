# maximiliano-garcia-portfolio

Frutiger Aero portfolio (Wii + transparent Mac aesthetic) — static site ready for GitHub Pages.

**Live (if repo is `maxgarcia642.github.io`):**  
https://maxgarcia642.github.io/

## Files included
- `index.html` — main page
- `styles.css` — Frutiger Aero styling
- `script.js` — interactions (smooth scroll, reveal, terminals, carousel, pixel art game)
- `assets/` — add `resume.pdf`, `project1.pdf`, `project2.pdf`, etc.
- `.github/workflows/pages.yml` — optional auto-deploy workflow (recommended for any repo)

## Quick setup (local)
1. Create project folder and copy files.
2. Add your assets:
   - `assets/resume.pdf`
   - `assets/project1.pdf`
   - `assets/project2.pdf`
3. Edit placeholders in `index.html`:
   - Replace `https://raw.githubusercontent.com/example-user/...` with your raw GitHub URLs for terminal `data-raw`.
   - Replace `https://linktr.ee/YOUR_LINKTREE_URL` with your LinkTree URL.
4. Test locally:
   - Serve the directory with a simple server (recommended for iframe previews):
     ```bash
     python3 -m http.server 8000
     ```
   - Open `http://localhost:8000`.

## Deploy to GitHub Pages (recommended: with auto-deploy)
If your repo is named `maxgarcia642.github.io`, pushing to `main` publishes to `https://maxgarcia642.github.io/`.

### Using Git (one-time)
```bash
git init
git add .
git commit -m "feat: Frutiger Aero portfolio"
git branch -M main
git remote add origin https://github.com/maxgarcia642/maxgarcia642.github.io.git
git push -u origin main
