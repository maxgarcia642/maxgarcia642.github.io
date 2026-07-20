/* settings.js — Layout Settings page. Reads/writes localStorage("mg-layout")
   and mirrors the same application logic script.js runs on the main page.
   Zero network, zero credentials — the old Contents-API admin is retired
   (superprompt-changelog.md has the entry). */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const byId = (id) => document.getElementById(id);
  const SECTIONS = [
    ["programming", "💻 Website Programming Work"],
    ["posts", "📁 Articles & Posts"],
    ["finance", "💸 The Financial Liberty Project"],
    ["arcade", "🕹️ Games & Projects Arcade"],
    ["individualism", "🧭 Individualism"],
    ["connect", "🌳 Connect"]
  ];
  let L = {};
  try { L = JSON.parse(localStorage.getItem("mg-layout") || "{}"); } catch (e) { L = {}; }
  L.hidden = Array.isArray(L.hidden) ? L.hidden : [];
  L.order = Array.isArray(L.order) && L.order.length ? L.order : SECTIONS.map(s => s[0]);

  const save = () => {
    try { localStorage.setItem("mg-layout", JSON.stringify(L)); } catch (e) { /* private mode */ }
    applyHere();
    const n = $("#saveNote");
    n.textContent = "Saved. The main page picks this up instantly.";
    clearTimeout(save._t); save._t = setTimeout(() => { n.textContent = ""; }, 1800);
  };

  /* Mirror of script.js applyLayout(), scoped to this page's preview.
     Same table shape: attribute → { layout key, allowed values }. */
  const ATTR_RULES = {
    "data-motion":   { key: "motion",    allowed: ["off"] },
    "data-width":    { key: "width",     allowed: ["wide", "cozy"] },
    "data-corners":  { key: "corners",   allowed: ["sharp"] },
    "data-dock":     { key: "dock",      allowed: ["left", "hidden"] },
    "data-fontmode": { key: "fontmode",  allowed: ["sans", "serif", "mono"] },
    "data-contrast": { key: "contrast",  allowed: ["high"] },
    "data-underline":{ key: "underline", allowed: ["on"] },
    "data-density":  { key: "density",   allowed: ["compact"] }
  };
  function applyHere() {
    const root = document.documentElement;
    Object.entries(ATTR_RULES).forEach(([attr, rule]) => {
      const v = L[rule.key];
      if (rule.allowed.includes(v)) root.setAttribute(attr, v);
      else root.removeAttribute(attr);
    });
    root.style.setProperty("--user-font-scale", { s: ".92", m: "1", l: "1.12" }[L.font] || "1");
  }
  try {
    const t = localStorage.getItem("mg-theme");
    if (t) root_setTheme(t);
  } catch (e) { /* default stands */ }
  function root_setTheme(t) {
    const MAP = { aurora: "indigo", clay: "coral", swiss: "bauhaus", midnight: "noir" };
    document.documentElement.setAttribute("data-theme", MAP[t] || t);
  }

  /* Each segment group binds its click handler exactly once; repaints are
     collected so a reset can refresh every group without re-binding. */
  const segPainters = [];
  const seg = (hostId, key, def) => {
    const host = byId(hostId.replace("#", ""));
    const paint = () => host.querySelectorAll(".seg").forEach(b =>
      b.setAttribute("aria-pressed", String((L[key] || def) === b.dataset.v)));
    segPainters.push(paint);
    host.addEventListener("click", (e) => {
      const b = e.target.closest(".seg"); if (!b) return;
      L[key] = b.dataset.v === def ? undefined : b.dataset.v;
      if (b.dataset.v === def) delete L[key];
      paint(); save();
    });
    paint();
  };
  const repaintSegs = () => segPainters.forEach(p => p());
  seg("#setParticles", "particles", "normal");
  seg("#setFont", "font", "m");
  seg("#setCorners", "corners", "rounded");
  seg("#setWidth", "width", "default");
  seg("#setDock", "dock", "right");
  seg("#setFontmode", "fontmode", "theme");
  seg("#setDensity", "density", "default");
  seg("#setContrast", "contrast", "default");
  seg("#setUnderline", "underline", "off");
  seg("#setShuffle", "shuffle", "off");
  seg("#setArcade", "arcade", "preview");

  /* Copy or restore the whole setup (layout + theme) as one little code */
  const codeBox = $("#layoutCode");
  async function exportSetup() {
    let theme = null;
    try { theme = localStorage.getItem("mg-theme"); } catch (e) { /* private mode */ }
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({ layout: L, theme }))));
    codeBox.value = code;
    const n = $("#saveNote");
    try { await navigator.clipboard.writeText(code); n.textContent = "Copied. Keep it anywhere and paste it back later."; }
    catch (e) { codeBox.focus(); codeBox.select(); n.textContent = "Select the code and copy it."; }
    clearTimeout(save._t); save._t = setTimeout(() => { n.textContent = ""; }, 2600);
  }
  function importSetup() {
    const n = $("#saveNote");
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(codeBox.value.trim()))));
      if (data.layout && typeof data.layout === "object") {
        L = data.layout;
        localStorage.setItem("mg-layout", JSON.stringify(L));
      }
      if (typeof data.theme === "string" && data.theme) localStorage.setItem("mg-theme", data.theme);
      n.textContent = "Setup restored. Reloading so everything applies.";
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      n.textContent = "That code didn't read as a setup. Paste the whole thing and try again.";
      clearTimeout(save._t); save._t = setTimeout(() => { n.textContent = ""; }, 2600);
    }
  }
  $("#layoutExport")?.addEventListener("click", exportSetup);
  $("#layoutImport")?.addEventListener("click", importSetup);

  $("#setMotion").value = L.motion === "off" ? "off" : "full";
  $("#setMotion").addEventListener("change", (e) => {
    if (e.target.value === "off") L.motion = "off"; else delete L.motion;
    save();
  });
  $("#setAutoplay").value = (function () {
    try { return localStorage.getItem("mg-music") === "off" ? "off" : "on"; } catch (e) { return "on"; }
  })();
  $("#setAutoplay").addEventListener("change", (e) => {
    try { localStorage.setItem("mg-music", e.target.value === "off" ? "off" : "on"); } catch (err) {}
    save();
  });

  function renderSections() {
    const list = $("#secList");
    list.innerHTML = "";
    L.order.forEach((id, idx) => {
      const meta = SECTIONS.find(s => s[0] === id);
      if (!meta) return;
      const row = document.createElement("div");
      row.className = "sec-item";
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = !L.hidden.includes(id);
      cb.setAttribute("aria-label", `Show ${meta[1]}`);
      cb.addEventListener("change", () => {
        L.hidden = cb.checked ? L.hidden.filter(h => h !== id) : [...L.hidden, id];
        save();
      });
      const name = document.createElement("span");
      name.className = "grow"; name.textContent = meta[1];
      const up = document.createElement("button");
      up.type = "button"; up.className = "seg"; up.textContent = "↑";
      up.disabled = idx === 0;
      up.setAttribute("aria-label", `Move ${meta[1]} up`);
      up.addEventListener("click", () => {
        [L.order[idx - 1], L.order[idx]] = [L.order[idx], L.order[idx - 1]];
        renderSections(); save();
      });
      const down = document.createElement("button");
      down.type = "button"; down.className = "seg"; down.textContent = "↓";
      down.disabled = idx === L.order.length - 1;
      down.setAttribute("aria-label", `Move ${meta[1]} down`);
      down.addEventListener("click", () => {
        [L.order[idx + 1], L.order[idx]] = [L.order[idx], L.order[idx + 1]];
        renderSections(); save();
      });
      row.append(cb, name, up, down);
      list.appendChild(row);
    });
  }
  renderSections();

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset every layout setting to default?")) return;
    L = { hidden: [], order: SECTIONS.map(s => s[0]) };
    try { localStorage.removeItem("mg-layout"); } catch (e) {}
    renderSections();
    $("#setMotion").value = "full";
    repaintSegs(); /* repaint only — handlers stay bound exactly once */
    applyHere();
    $("#saveNote").textContent = "Reset. Defaults are back.";
  });

  applyHere();
})();
