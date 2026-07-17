/* content-loader.js — single data layer for the whole page.
   Fetches content.json + finance.json, renders posts / finance / arcade / dock.
   (project-loader.js from the old repo is retired — its job lives here now;
   recorded in superprompt-changelog.md so the change is traceable.) */

window.MG = { content: null, finance: null };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

/* ---------- Posts carousel ---------- */
function renderPosts(projects) {
  const track = document.getElementById("projectTrack");
  if (!track) return;
  track.innerHTML = "";
  projects.forEach(p => {
    const el = document.createElement("article");
    el.className = "post-card";
    el.setAttribute("role", "listitem");
    const updated = p.dateUpdated ? new Date(p.dateUpdated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    let actions = "";
    if (p.localPdf) {
      actions += `<button class="btn view-pdf" type="button" data-pdf="${esc(p.localPdf)}" data-title="${esc(p.title)}">Read on-site</button>`;
    }
    if (p.driveLink) actions += `<button class="btn ghost view-frame" type="button" data-frame="${esc(p.driveLink.replace("/view?usp=sharing", "/preview"))}" data-title="${esc(p.title)}">Preview</button>`;
    if (p.shareLink) actions += `<a class="link-btn" href="${esc(p.shareLink)}" target="_blank" rel="noopener">Share link</a>`;
    if (p.directLink) actions += `<a class="link-btn" href="${esc(p.directLink)}" target="_blank" rel="noopener">Direct link</a>`;
    el.innerHTML = `
      <h3>${esc(p.title)}</h3>
      <div class="dates">Updated ${esc(updated)}</div>
      <p class="muted small">${esc(p.description)}</p>
      <div class="arcade-actions">${actions}</div>`;
    track.appendChild(el);
  });
}

/* ---------- Financial Liberty Project ---------- */
function renderFinance(fin) {
  const tagline = document.getElementById("finTagline");
  if (tagline) tagline.textContent = fin.sectionTagline;

  const asOf = document.getElementById("pulseAsOf");
  if (asOf) asOf.textContent = `Figures verified ${fin.marketPulse.asOf}`;
  const note = document.getElementById("pulseNote");
  if (note) note.textContent = fin.marketPulse.note;

  const strip = document.getElementById("pulseStrip");
  if (strip) {
    strip.innerHTML = "";
    fin.marketPulse.items.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "pulse-chip";
      chip.dataset.pulseId = item.id;
      if (item.coingeckoId) chip.dataset.coingecko = item.coingeckoId;
      chip.innerHTML = `
        <div class="p-label">${esc(item.label)}${item.live ? " · live-capable" : ""}</div>
        <div class="p-value">${esc(item.value)}</div>
        <div class="p-context">${esc(item.context)}</div>`;
      strip.appendChild(chip);
    });
  }

  const grid = document.getElementById("financeGrid");
  if (grid) {
    grid.innerHTML = "";
    fin.works.forEach(w => {
      const card = document.createElement("article");
      card.className = "work-card";
      card.dataset.searchId = w.id;
      const badge = w.status === "live"
        ? `<span class="badge">Live · ${esc(w.updated)}</span>`
        : `<span class="badge soon">Coming soon</span>`;
      const files = w.files.map(f =>
        `<a class="link-btn" href="${esc(f.path)}" download>${esc(f.label)}</a>`).join("");
      const flags = (w.flags || []).map(f =>
        `<div class="honesty-flag">${esc(f)}</div>`).join("");
      card.innerHTML = `
        <div class="work-head"><h3>${esc(w.emoji)} ${esc(w.title)}</h3>${badge}</div>
        <p class="muted small" style="margin:0">${esc(w.blurb)}</p>
        ${files ? `<div class="work-files">${files}</div>` : ""}
        ${flags}`;
      grid.appendChild(card);
    });
  }

  const desk = document.getElementById("deskGrid");
  if (desk) {
    desk.innerHTML = "";
    fin.researchDesk.forEach(g => {
      const box = document.createElement("div");
      box.className = "desk-group";
      box.innerHTML = `<h4>${esc(g.group)}</h4>` +
        g.links.map(l => `<a class="link-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
      desk.appendChild(box);
    });
  }
}

/* ---------- Arcade (facades + coming-soon) ---------- */
function renderArcade(items) {
  const grid = document.getElementById("arcadeGrid");
  if (!grid) return;
  items.filter(i => i.kind !== "inline").forEach(item => {
    const card = document.createElement("article");
    card.className = "arcade-card";
    if (item.kind === "facade") {
      const canEmbed = Boolean(item.embedUrl);
      card.innerHTML = `
        <button class="facade" type="button"
                data-embed="${esc(item.embedUrl || "")}"
                data-open="${esc(item.openUrl || "")}"
                aria-label="${canEmbed ? "Load" : "Open"} ${esc(item.title)}">
          <span class="play-ring" aria-hidden="true">${canEmbed ? "▶" : "↗"}</span>
          <span class="facade-title">${esc(item.title)}</span>
        </button>
        <div class="arcade-body">
          <h3>${esc(item.title)} <span class="badge">${esc(item.badge)}</span></h3>
          <p>${esc(item.description)}</p>
          <div class="arcade-actions">
            ${item.openUrl ? `<a class="link-btn" href="${esc(item.openUrl)}" target="_blank" rel="noopener">Open in new tab</a>` : ""}
          </div>
          ${!canEmbed && item.embedNote ? `<p class="embed-hint">ℹ️ ${esc(item.embedNote)}</p>` : ""}
        </div>`;
    } else { // coming soon
      card.innerHTML = `
        <div class="facade" style="cursor:default" aria-hidden="true">
          <span class="play-ring">⏳</span>
          <span class="facade-title">${esc(item.title)}</span>
        </div>
        <div class="arcade-body">
          <h3>${esc(item.title)} <span class="badge soon">${esc(item.badge)}</span></h3>
          <p>${esc(item.description)}</p>
        </div>`;
    }
    grid.appendChild(card);
  });
}

/* ---------- Theme dock orbs ---------- */
function renderDock(themes) {
  const dock = document.getElementById("themeDock");
  if (!dock) return;
  const divider = dock.querySelector(".dock-divider");
  const current = document.documentElement.getAttribute("data-theme") || "aero";
  themes.forEach(t => {
    const orb = document.createElement("button");
    orb.className = "theme-orb";
    orb.type = "button";
    orb.style.background = t.swatch;
    orb.dataset.theme = t.id;
    orb.title = t.label;
    orb.setAttribute("aria-label", `Switch theme to ${t.label}`);
    orb.setAttribute("aria-pressed", String(t.id === current));
    dock.insertBefore(orb, divider);
  });
}

/* ---------- Section titles from content.json ---------- */
function applySectionText(c) {
  const map = {
    introTitle: c.intro?.title ? `👋 ${c.intro.title}` : null,
    introDesc: c.intro?.description,
    progTitle: c.sections?.programming?.title,
    progDesc: c.sections?.programming?.description,
    postsTitle: c.sections?.posts?.title,
    postsDesc: c.sections?.posts?.description,
    finTitle: c.sections?.finance?.title,
    arcadeTitle: c.sections?.arcade?.title,
    arcadeDesc: c.sections?.arcade?.description,
    connectTitle: c.sections?.connect?.title,
    connectDesc: c.sections?.connect?.description
  };
  for (const [id, text] of Object.entries(map)) {
    if (!text) continue;
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  const dl = document.getElementById("resumeDownload");
  const shell = document.getElementById("resumeShell");
  if (c.resumeFile && dl) dl.href = c.resumeFile;
  if (c.resumeFile && shell) shell.dataset.pdf = c.resumeFile;
}

(async function init() {
  try {
    const [content, finance] = await Promise.all([
      loadJSON("./content.json"),
      loadJSON("./finance.json")
    ]);
    window.MG.content = content;
    window.MG.finance = finance;
    applySectionText(content);
    renderPosts(content.projects || []);
    renderFinance(finance);
    renderArcade(content.arcade || []);
    renderDock(content.themes || []);
    document.dispatchEvent(new CustomEvent("mg:content-ready"));
  } catch (err) {
    console.error("Content load failed:", err);
    const track = document.getElementById("projectTrack");
    if (track) track.innerHTML = `<p class="muted">Couldn't load content.json / finance.json — check the console and that both files exist at the site root.</p>`;
  }
})();
