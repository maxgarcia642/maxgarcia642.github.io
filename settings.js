/* settings.js — Layout Settings page. Reads/writes localStorage("mg-layout")
   and mirrors the same application logic script.js runs on the main page.
   Zero network, zero credentials — the old Contents-API admin is retired
   (superprompt-changelog.md has the entry). */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
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

  /* Mirror of script.js applyLayout(), scoped to this page's preview */
  function applyHere() {
    const root = document.documentElement;
    const set = (k, v) => v ? root.setAttribute(k, v) : root.removeAttribute(k);
    set("data-motion", L.motion === "off" ? "off" : null);
    set("data-width", ["wide", "cozy"].includes(L.width) ? L.width : null);
    set("data-corners", L.corners === "sharp" ? "sharp" : null);
    set("data-dock", ["left", "hidden"].includes(L.dock) ? L.dock : null);
    set("data-fontmode", ["sans", "serif", "mono"].includes(L.fontmode) ? L.fontmode : null);
    set("data-contrast", L.contrast === "high" ? "high" : null);
    set("data-underline", L.underline === "on" ? "on" : null);
    set("data-density", L.density === "compact" ? "compact" : null);
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

  const seg = (hostId, key, def) => {
    const host = $(hostId);
    const paint = () => host.querySelectorAll(".seg").forEach(b =>
      b.setAttribute("aria-pressed", String((L[key] || def) === b.dataset.v)));
    host.addEventListener("click", (e) => {
      const b = e.target.closest(".seg"); if (!b) return;
      L[key] = b.dataset.v === def ? undefined : b.dataset.v;
      if (b.dataset.v === def) delete L[key];
      paint(); save();
    });
    paint();
  };
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
  $("#layoutExport")?.addEventListener("click", async () => {
    let theme = null;
    try { theme = localStorage.getItem("mg-theme"); } catch (e) {}
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({ layout: L, theme }))));
    codeBox.value = code;
    const n = $("#saveNote");
    try { await navigator.clipboard.writeText(code); n.textContent = "Copied. Keep it anywhere and paste it back later."; }
    catch (e) { codeBox.focus(); codeBox.select(); n.textContent = "Select the code and copy it."; }
    clearTimeout(save._t); save._t = setTimeout(() => { n.textContent = ""; }, 2600);
  });
  $("#layoutImport")?.addEventListener("click", () => {
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
  });

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
    document.querySelectorAll(".seg-row .seg").forEach(b => b.setAttribute("aria-pressed", "false"));
    seg("#setParticles", "particles", "normal"); seg("#setFont", "font", "m");
    seg("#setCorners", "corners", "rounded"); seg("#setWidth", "width", "default");
    seg("#setDock", "dock", "right"); seg("#setFontmode", "fontmode", "theme");
    seg("#setDensity", "density", "default"); seg("#setContrast", "contrast", "default");
    seg("#setUnderline", "underline", "off"); seg("#setShuffle", "shuffle", "off");
    seg("#setArcade", "arcade", "preview");
    applyHere();
    $("#saveNote").textContent = "Reset. Defaults are back.";
  });

  applyHere();
})();
