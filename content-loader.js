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

/* ---------- DOM element factories (no innerHTML on these paths) ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function badgeEl(text, soon) {
  return el("span", soon ? "badge soon" : "badge", text);
}
/* Doc buttons open the protected on-site reader (script.js) — no downloads. */
function docButtonsInto(host, docs, title) {
  (docs || []).forEach(d => {
    const b = el("button", "btn doc-view", `📖 ${d.label}`);
    b.type = "button";
    b.dataset.doc = d.path;
    b.dataset.title = `${title} — ${d.label}`;
    host.appendChild(b);
  });
}

/* ---------- Posts carousel ---------- */
function postCard(p) {
  const card = el("article", "post-card");
  card.setAttribute("role", "listitem");
  if (p.id) card.dataset.searchId = p.id;

  const h = el("h3", null, `${p.title} `);
  if (p.soon) h.appendChild(badgeEl(p.badge || "Coming soon", true));
  else if (p.badge) h.appendChild(badgeEl(p.badge, false));
  card.appendChild(h);

  if (p.dateUpdated) {
    const updated = new Date(p.dateUpdated).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    card.appendChild(el("div", "dates", `Updated ${updated}`));
  }
  card.appendChild(el("p", "muted small", p.description || ""));

  const actions = el("div", "arcade-actions");
  docButtonsInto(actions, p.docs, p.title);
  if (p.pdf) {
    const b = el("button", "btn view-pdf", "📖 Read paper");
    b.type = "button"; b.dataset.pdf = p.pdf; b.dataset.title = p.title;
    actions.appendChild(b);
  }
  if (p.driveLink) {
    const b = el("button", "btn ghost view-frame", "Preview");
    b.type = "button";
    b.dataset.frame = p.driveLink.replace("/view?usp=sharing", "/preview");
    b.dataset.title = p.title;
    actions.appendChild(b);
  }
  if (p.link) {
    const a = el("a", "link-btn", p.link.label);
    a.href = p.link.url; a.target = "_blank"; a.rel = "noopener";
    actions.appendChild(a);
  }
  card.appendChild(actions);
  return card;
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
    .forEach(p => track.appendChild(postCard(p)));
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
  claw.papers.forEach(p => track.appendChild(postCard(p)));
  wrap.hidden = false;
}

/* ---------- Individualism: personality-assessment posters ---------- */
function renderAssessments(list) {
  const grid = document.getElementById("assessmentGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (list || []).forEach(a => {
    const card = el("article", "assessment-card");
    card.dataset.searchId = a.id;

    const open = el("button", "assessment-open");
    open.type = "button";
    open.dataset.assessment = a.html;
    open.dataset.title = a.title;
    open.setAttribute("aria-label", `Open ${a.title}`);
    const emoji = el("span", "assessment-emoji", a.emoji || "🧭");
    emoji.setAttribute("aria-hidden", "true");
    open.append(emoji, el("span", "assessment-open-label", "Open report"));

    const body = el("div", "assessment-body");
    const h = el("h3", null, `${a.title} `);
    if (a.badge) h.appendChild(badgeEl(a.badge, false));
    body.appendChild(h);
    if (a.subtitle) body.appendChild(el("p", "assessment-sub", a.subtitle));
    body.appendChild(el("p", "muted small", a.detail || ""));

    card.append(open, body);
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
      h.textContent = `${g.label} `;
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = g.sub || "";
      h.appendChild(sub);
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
    const card = el("article", "arcade-card");
    const isFacade = item.kind === "facade";

    /* the big emoji face */
    const face = el(isFacade ? "button" : "div", isFacade ? "facade" : "facade static");
    if (isFacade) {
      face.type = "button";
      face.dataset.embed = item.embedUrl || "";
      face.dataset.open = item.openUrl || "";
      face.setAttribute("aria-label", `${item.embedUrl ? "Load" : "Open"} ${item.title}`);
    } else {
      face.setAttribute("aria-hidden", "true");
    }
    const emoji = el("span", "facade-emoji", item.emoji || "🕹️");
    emoji.setAttribute("aria-hidden", "true");
    face.append(emoji, el("span", "facade-title", item.title));

    /* the text body */
    const body = el("div", "arcade-body");
    const h = el("h3", null, `${item.title} `);
    h.appendChild(badgeEl(item.badge, !isFacade));
    body.appendChild(h);
    body.appendChild(el("p", null, item.description));
    const actions = el("div", "arcade-actions");
    docButtonsInto(actions, item.docs, item.title);
    if (isFacade && item.openUrl) {
      const a = el("a", "link-btn", "Open in new tab");
      a.href = item.openUrl; a.target = "_blank"; a.rel = "noopener";
      actions.appendChild(a);
    }
    if (actions.childElementCount) body.appendChild(actions);

    card.append(face, body);
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
