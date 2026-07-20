/* content-loader.js — single data layer for the whole page.
   Fetches content.json + finance.json, renders posts / finance / arcade / dock.
   (project-loader.js from the old repo is retired — its job lives here now;
   recorded in superprompt-changelog.md so the change is traceable.) */

window.MG = { content: null, finance: null };

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

/* ---------- Posts carousel ---------- */
/* Doc buttons open the protected on-site reader (script.js) — no downloads. */
function docButtons(docs, title) {
  return (docs || []).map(d =>
    `<button class="btn doc-view" type="button" data-doc="${esc(d.path)}" data-title="${esc(title)} — ${esc(d.label)}">📖 ${esc(d.label)}</button>`
  ).join("");
}

function renderPosts(projects) {
  const track = document.getElementById("projectTrack");
  if (!track) return;
  track.innerHTML = "";
  const stripLead = (s) => String(s || "").replace(/^[^\p{L}\p{N}]+/u, "");
  projects
    .filter(p => p.id !== "linkedin-blog") // lives in the section description now, not as a card
    .slice()
    .sort((a, b) => stripLead(a.title).localeCompare(stripLead(b.title), undefined, { sensitivity: "base" }))
    .forEach(p => {
    const el = document.createElement("article");
    el.className = "post-card";
    el.setAttribute("role", "listitem");
    const updated = p.dateUpdated ? new Date(p.dateUpdated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    let actions = docButtons(p.docs, p.title);
    if (p.pdf) actions += `<button class="btn view-pdf" type="button" data-pdf="${esc(p.pdf)}" data-title="${esc(p.title)}">📖 Read paper</button>`;
    if (p.driveLink) actions += `<button class="btn ghost view-frame" type="button" data-frame="${esc(p.driveLink.replace("/view?usp=sharing", "/preview"))}" data-title="${esc(p.title)}">Preview</button>`;
    if (p.link) actions += `<a class="link-btn" href="${esc(p.link.url)}" target="_blank" rel="noopener">${esc(p.link.label)}</a>`;
    const badge = p.soon ? `<span class="badge soon">${esc(p.badge || "Coming soon")}</span>` : (p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "");
    el.innerHTML = `
      <h3>${esc(p.title)} ${badge}</h3>
      <div class="dates">Updated ${esc(updated)}</div>
      <p class="muted small">${esc(p.description)}</p>
      <div class="arcade-actions">${actions}</div>`;
    track.appendChild(el);
  });
}

/* ---------- Clawmaxxing research row (its own scroll, inside Articles) ---------- */
function renderClawmaxxing(claw) {
  const wrap = document.getElementById("clawRow");
  const track = document.getElementById("clawTrack");
  if (!wrap || !track || !claw || !Array.isArray(claw.papers) || !claw.papers.length) return;
  const title = document.getElementById("clawTitle");
  const desc = document.getElementById("clawDesc");
  if (title) title.textContent = claw.title || "🦞 The Clawmaxxing Project";
  if (desc) desc.textContent = claw.description || "";
  track.innerHTML = "";
  claw.papers.forEach(p => {
    const el = document.createElement("article");
    el.className = "post-card";
    el.setAttribute("role", "listitem");
    el.dataset.searchId = p.id;
    const badge = p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
    el.innerHTML = `
      <h3>${esc(p.title)} ${badge}</h3>
      <p class="muted small">${esc(p.description)}</p>
      <div class="arcade-actions">${docButtons(p.docs, p.title)}</div>`;
    track.appendChild(el);
  });
  wrap.hidden = false;
}

/* ---------- Individualism: personality-assessment posters ---------- */
function renderAssessments(list) {
  const grid = document.getElementById("assessmentGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (list || []).forEach(a => {
    const card = document.createElement("article");
    card.className = "assessment-card";
    card.dataset.searchId = a.id;
    card.innerHTML = `
      <button class="assessment-open" type="button" data-assessment="${esc(a.html)}" data-title="${esc(a.title)}" aria-label="Open ${esc(a.title)}">
        <span class="assessment-emoji" aria-hidden="true">${esc(a.emoji || "🧭")}</span>
        <span class="assessment-open-label">Open report</span>
      </button>
      <div class="assessment-body">
        <h3>${esc(a.title)} ${a.badge ? `<span class="badge">${esc(a.badge)}</span>` : ""}</h3>
        ${a.subtitle ? `<p class="assessment-sub">${esc(a.subtitle)}</p>` : ""}
        <p class="muted small">${esc(a.detail || "")}</p>
      </div>`;
    grid.appendChild(card);
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

  const groupsHost = document.getElementById("pulseGroups");
  if (groupsHost) {
    groupsHost.innerHTML = "";
    const groups = fin.marketPulse.groups || [{ id: null, label: "", sub: "" }];
    groups.forEach(g => {
      const wrap = document.createElement("div");
      wrap.className = "pulse-group";
      const h = document.createElement("h4");
      h.innerHTML = `${esc(g.label)} <span class="sub">${esc(g.sub || "")}</span>`;
      const strip = document.createElement("div");
      strip.className = "pulse-strip";
      fin.marketPulse.items
        .filter(item => !g.id || item.group === g.id)
        .forEach(item => {
          const chip = document.createElement("div");
          chip.className = "pulse-chip";
          chip.dataset.pulseId = item.id;
          if (item.coingeckoId) chip.dataset.coingecko = item.coingeckoId;
          if (item.fxCode) chip.dataset.fx = item.fxCode;
          if (item.yahoo) chip.dataset.yahoo = item.yahoo;
          chip.innerHTML = `
            <div class="p-label">${esc(item.label)}${item.live ? " · live-capable" : ""}</div>
            <div class="p-value">${esc(item.value)}</div>
            <div class="p-context">${esc(item.context)}</div>`;
          strip.appendChild(chip);
        });
      wrap.append(h, strip);
      groupsHost.appendChild(wrap);
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
        `<button class="link-btn doc-view" type="button" data-doc="${esc(f.path)}" data-title="${esc(w.title)} — ${esc(f.label)}">📖 ${esc(f.label)}</button>`).join("");
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
    const art = `<span class="facade-emoji" aria-hidden="true">${esc(item.emoji || "🕹️")}</span>`;
    if (item.kind === "facade") {
      const canEmbed = Boolean(item.embedUrl);
      card.innerHTML = `
        <button class="facade" type="button"
                data-embed="${esc(item.embedUrl || "")}"
                data-open="${esc(item.openUrl || "")}"
                aria-label="${canEmbed ? "Load" : "Open"} ${esc(item.title)}">
          ${art}
          <span class="facade-title">${esc(item.title)}</span>
        </button>
        <div class="arcade-body">
          <h3>${esc(item.title)} <span class="badge">${esc(item.badge)}</span></h3>
          <p>${esc(item.description)}</p>
          <div class="arcade-actions">
            ${docButtons(item.docs, item.title)}
            ${item.openUrl ? `<a class="link-btn" href="${esc(item.openUrl)}" target="_blank" rel="noopener">Open in new tab</a>` : ""}
          </div>
        </div>`;
    } else { // coming soon
      card.innerHTML = `
        <div class="facade static" aria-hidden="true">
          ${art}
          <span class="facade-title">${esc(item.title)}</span>
        </div>
        <div class="arcade-body">
          <h3>${esc(item.title)} <span class="badge soon">${esc(item.badge)}</span></h3>
          <p>${esc(item.description)}</p>
          ${item.docs ? `<div class="arcade-actions">${docButtons(item.docs, item.title)}</div>` : ""}
        </div>`;
    }
    grid.appendChild(card);
  });
}

/* ---------- Theme dock orbs ---------- */
function renderDock(themes) {
  const dock = document.getElementById("themeDock");
  if (!dock) return;
  const host = document.getElementById("dockOrbs");
  const divider = dock.querySelector(".dock-divider");
  const current = document.documentElement.getAttribute("data-theme") || "aero";
  themes.forEach(t => {
    const orb = document.createElement("button");
    orb.className = "theme-orb";
    orb.type = "button";
    orb.style.background = t.swatch;
    orb.dataset.theme = t.id;
    orb.dataset.label = t.label;
    if (t.vibe) orb.dataset.vibe = t.vibe;
    orb.setAttribute("aria-label", `Switch theme to ${t.label}`);
    orb.setAttribute("aria-pressed", String(t.id === current));
    if (host) host.appendChild(orb); else dock.insertBefore(orb, divider);
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
    finTitle: c.sections?.finance?.title,
    arcadeTitle: c.sections?.arcade?.title,
    arcadeDesc: c.sections?.arcade?.description,
    individualismTitle: c.sections?.individualism?.title,
    individualismDesc: c.sections?.individualism?.description,
    connectTitle: c.sections?.connect?.title,
    connectDesc: c.sections?.connect?.description
  };
  for (const [id, text] of Object.entries(map)) {
    if (!text) continue;
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  const credit = document.getElementById("progCredit");
  if (credit && c.sections?.programming?.credit) credit.textContent = c.sections.programming.credit;
  const pd = document.getElementById("postsDesc");
  if (pd && c.sections?.posts?.description) {
    pd.textContent = c.sections.posts.description + " ";
    const a = document.createElement("a");
    a.href = "https://www.linkedin.com/in/maximiliano-garcia642/";
    a.target = "_blank"; a.rel = "noopener";
    a.textContent = "LinkedIn: maximiliano-garcia642 ↗";
    pd.appendChild(a);
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
    renderClawmaxxing(content.clawmaxxing);
    renderAssessments(content.assessments || []);
    renderFinance(finance);
    renderArcade(content.arcade || []);
    renderDock(content.themes || []);
    document.dispatchEvent(new CustomEvent("mg:content-ready"));
  } catch (err) {
    console.error("Content load failed:", err);
    const track = document.getElementById("projectTrack");
    if (track) track.innerHTML = `<p class="muted">Couldn't load content.json or finance.json. Check the console and that both files exist at the site root.</p>`;
  }
})();
