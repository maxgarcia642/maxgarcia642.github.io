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
    refreshCodeBox();
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
    "data-fontmode": { key: "fontmode",  allowed: ["sans", "serif", "mono", "rounded", "scifi", "arcade", "hand"] },
    "data-contrast": { key: "contrast",  allowed: ["high"] },
    "data-underline":{ key: "underline", allowed: ["on"] },
    "data-density":  { key: "density",   allowed: ["compact"] },
    "data-bganim":   { key: "bganim",    allowed: ["still", "drift", "hue"] },
    "data-cards":    { key: "cards",     allowed: ["clear", "solid"] },
    "data-vibrancy": { key: "vibrancy",  allowed: ["low", "high"] }
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
  seg("#setBganim", "bganim", "theme");
  seg("#setCards", "cards", "theme");
  seg("#setVibrancy", "vibrancy", "default");

  /* Particle weather style: one pinned preset over every theme's own */
  const FX_STYLES = ["bubbles", "orbs", "snow", "rain", "embers", "fireflies", "stars", "petals", "leaves", "motes", "glyphs", "confetti", "shapes", "prisms", "steam", "dust", "bokeh", "pollen", "ash", "comets", "sparks", "pixels", "rings", "fog", "shards"];
  const fxSel = byId("setFx");
  if (fxSel) {
    FX_STYLES.forEach(f => fxSel.appendChild(new Option(f, f)));
    fxSel.value = FX_STYLES.includes(L.fx) ? L.fx : "theme";
    fxSel.addEventListener("change", () => {
      if (fxSel.value === "theme") delete L.fx; else L.fx = fxSel.value;
      save();
    });
  }

  /* Copy or restore the whole setup (layout + theme) as one little code */
  const codeBox = $("#layoutCode");
  function currentCode() {
    let theme = null;
    try { theme = localStorage.getItem("mg-theme"); } catch (e) { /* private mode */ }
    return btoa(unescape(encodeURIComponent(JSON.stringify({ layout: L, theme }))));
  }
  function refreshCodeBox() {
    if (codeBox && document.activeElement !== codeBox) codeBox.value = currentCode();
  }
  async function exportSetup() {
    const code = currentCode();
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
  refreshCodeBox();

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

  /* ---- Cards inside sections: reorder the files/cards, not just sections.
     Lists come from the same content.json / finance.json the main page uses;
     the chosen order saves to L.items and the main page re-renders live. */
  const ITEM_GROUPS = [
    { key: "posts",   label: "🗂️ Articles & Posts — General row", pick: c => (c.projects || []).filter(p => p.id !== "linkedin-blog") },
    { key: "claw",    label: "🦞 Clawmaxxing papers",              pick: c => c.clawmaxxing?.papers || [] },
    { key: "arcade",  label: "🕹️ Games & Projects Arcade (after the pixel studio)", pick: c => (c.arcade || []).filter(a => a.kind !== "inline") },
    { key: "finance", label: "💸 Financial Liberty works",         pick: (c, f) => f?.works || [] }
  ];
  function renderItemGroup(host, group, items) {
    const box = document.createElement("div");
    box.className = "item-group";
    const h = document.createElement("h3");
    h.textContent = group.label;
    box.appendChild(h);
    const saved = (L.items || {})[group.key];
    let ids = items.map(i => i.id);
    if (Array.isArray(saved) && saved.length) {
      ids = saved.filter(id => ids.includes(id)).concat(ids.filter(id => !saved.includes(id)));
    }
    const titleOf = (id) => {
      const it = items.find(i => i.id === id);
      return it ? `${it.emoji ? it.emoji + " " : ""}${it.title}` : id;
    };
    const commit = () => {
      L.items = L.items || {};
      L.items[group.key] = ids;
      save();
      draw();
    };
    const draw = () => {
      box.querySelectorAll(".sec-item").forEach(r => r.remove());
      ids.forEach((id, idx) => {
        const row = document.createElement("div");
        row.className = "sec-item";
        const name = document.createElement("span");
        name.className = "grow"; name.textContent = titleOf(id);
        const up = document.createElement("button");
        up.type = "button"; up.className = "seg"; up.textContent = "↑";
        up.disabled = idx === 0;
        up.setAttribute("aria-label", `Move ${titleOf(id)} up`);
        up.addEventListener("click", () => { [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]; commit(); });
        const down = document.createElement("button");
        down.type = "button"; down.className = "seg"; down.textContent = "↓";
        down.disabled = idx === ids.length - 1;
        down.setAttribute("aria-label", `Move ${titleOf(id)} down`);
        down.addEventListener("click", () => { [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]]; commit(); });
        row.append(name, up, down);
        box.appendChild(row);
      });
    };
    draw();
    host.appendChild(box);
    return () => { ids = items.map(i => i.id); draw(); }; /* reset hook */
  }
  const itemResets = [];
  (async function initItemLists() {
    const host = byId("itemLists");
    if (!host) return;
    try {
      const [content, finance] = await Promise.all([
        fetch("./content.json", { cache: "no-cache" }).then(r => r.json()),
        fetch("./finance.json", { cache: "no-cache" }).then(r => r.json())
      ]);
      host.innerHTML = "";
      ITEM_GROUPS.forEach(g => itemResets.push(renderItemGroup(host, g, g.pick(content, finance))));
    } catch (e) {
      host.innerHTML = "<p class=\"hint\">Couldn't load the card lists (content.json/finance.json unreachable). Everything else here still works.</p>";
    }
  })();

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset every layout setting to default?")) return;
    L = { hidden: [], order: SECTIONS.map(s => s[0]) };
    try { localStorage.removeItem("mg-layout"); } catch (e) {}
    renderSections();
    itemResets.forEach(r => r());
    $("#setMotion").value = "full";
    const fxReset = byId("setFx"); if (fxReset) fxReset.value = "theme";
    repaintSegs(); /* repaint only — handlers stay bound exactly once */
    applyHere();
    refreshCodeBox();
    $("#saveNote").textContent = "Reset. Defaults are back.";
  });

  applyHere();
})();
