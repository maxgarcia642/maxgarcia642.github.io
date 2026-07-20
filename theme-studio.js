/* theme-studio.js — 🖌️ paint-your-own-theme panel.
   Zero dependencies, zero network: themes save to localStorage("mg-custom-themes")
   as config objects, get injected as real [data-theme="…"] CSS at load, and export
   as the exact block shape themes.css uses — paste it there to make one permanent.
   CSP: this file is 'self'; injected <style> is allowed by style-src 'unsafe-inline'. */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const byId = (id) => document.getElementById(id);
  const KEY = "mg-custom-themes";
  const dlg = $("#studioModal");
  if (!dlg) return;

  const FONT_PAIRS = [
    { id: "friendly", label: "Friendly — Nunito + Inter", display: "'Nunito', 'Inter', sans-serif", body: "'Inter', system-ui, sans-serif", weight: 700 },
    { id: "techy", label: "Technical — Space Grotesk + Inter", display: "'Space Grotesk', 'Inter', sans-serif", body: "'Inter', system-ui, sans-serif", weight: 700 },
    { id: "elegant", label: "Elegant — Playfair + Lora", display: "'Playfair Display', serif", body: "'Lora', Georgia, serif", weight: 600 },
    { id: "scifi", label: "Sci-fi — Orbitron + Sora", display: "'Orbitron', 'Sora', sans-serif", body: "'Sora', 'Inter', sans-serif", weight: 700 },
    { id: "soft", label: "Soft — Quicksand + Nunito", display: "'Quicksand', 'Nunito', sans-serif", body: "'Quicksand', 'Nunito', sans-serif", weight: 700 },
    { id: "sketch", label: "Sketchbook — Caveat + Quicksand", display: "'Caveat', cursive", body: "'Quicksand', sans-serif", weight: 600 },
    { id: "arcade", label: "Arcade — Press Start 2P", display: "'Press Start 2P', monospace", body: "'Quicksand', sans-serif", weight: 400 },
    { id: "terminal", label: "Terminal — JetBrains Mono", display: "'JetBrains Mono', monospace", body: "'JetBrains Mono', monospace", weight: 700 }
  ];
  const FX = ["none", "bubbles", "orbs", "snow", "rain", "embers", "fireflies", "stars", "petals", "leaves", "motes", "glyphs", "confetti", "shapes", "prisms", "steam", "dust"];

  /* Options built as DOM nodes (values are internal constants, but node
     building keeps innerHTML out of the file entirely). */
  FONT_PAIRS.forEach(f => $("#stFont").appendChild(new Option(f.label, f.id)));
  FX.forEach(f => $("#stFx").appendChild(new Option(f === "none" ? "none — clear air" : f, f, f === "stars", f === "stars")));

  /* ---------- color helpers ---------- */
  const hexRgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lum = (h) => {
    const [r, g, b] = hexRgb(h).map(v => v / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  function readForm() {
    const name = ($("#stName").value || "My Theme").trim();
    return {
      name,
      bg1: $("#stBg1").value, bg2: $("#stBg2").value,
      text: $("#stText").value, card: $("#stCard").value, cardA: +$("#stCardA").value,
      accent: $("#stAccent").value, accent2: $("#stAccent2").value,
      radius: +$("#stRadius").value,
      font: $("#stFont").value, fx: $("#stFx").value, fxColor: $("#stFxColor").value,
      anim: $("#stAnim").value, gloss: $("#stGloss").checked
    };
  }

  /* Values computed from the form before the CSS block is assembled. */
  function derived(t) {
    return {
      pair: FONT_PAIRS.find(f => f.id === t.font) || FONT_PAIRS[0],
      dark: lum(t.bg2) < 0.45,
      card: hexRgb(t.card),
      fx: hexRgb(t.fxColor),
      btnText: lum(t.accent) > 0.62 ? "#101018" : "#ffffff",
      anim: t.anim === "hue" ? "mg-bg-hue 40s linear infinite"
        : t.anim === "none" ? "none"
        : "mg-bg-drift 26s ease-in-out infinite alternate"
    };
  }

  function cssFor(t, id) {
    const { pair, dark, card: [cr, cg, cb], fx: [fr, fg, fb], btnText, anim } = derived(t);
    return `[data-theme="${id}"] {
  --bg: linear-gradient(160deg, ${t.bg1}, ${t.bg2});
  --bg-size: 180% 180%;
  --bg-anim: ${anim};
  --text: ${t.text};
  --muted: color-mix(in srgb, ${t.text} 58%, ${t.bg2});
  --card-bg: rgb(${cr} ${cg} ${cb} / ${t.cardA}%);
  --card-border-color: color-mix(in srgb, ${t.accent} 35%, ${dark ? "rgb(255 255 255 / 22%)" : "rgb(255 255 255 / 72%)"});
  --card-border: 1px solid color-mix(in srgb, ${t.accent} 35%, ${dark ? "rgb(255 255 255 / 22%)" : "rgb(255 255 255 / 72%)"});
  --card-shadow: 0 14px 34px rgb(0 0 0 / ${dark ? "45%" : "17%"});
  --card-blur: 12px;
  --header-bg: rgb(${cr} ${cg} ${cb} / 55%);
  --chip-bg: rgb(${cr} ${cg} ${cb} / 45%);
  --accent: ${t.accent};
  --accent-2: ${t.accent2};
  --btn-grad: linear-gradient(135deg, ${t.accent}, ${t.accent2});
  --btn-text: ${btnText};
  --pill-bg: rgb(${cr} ${cg} ${cb} / 45%);
  --pill-text: ${t.text};
  --pill-active: ${t.accent};
  --font-display: ${pair.display};
  --font-body: ${pair.body};
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  --display-weight: ${pair.weight};
  --display-case: none;
  --display-spacing: 0;
  --radius-lg: ${t.radius}px;
  --radius-md: calc(${t.radius}px * .72 + 2px);
  --radius-sm: calc(${t.radius}px * .5 + 2px);
  --border-w: 1px;
  --gloss: ${t.gloss ? 1 : 0};
  --focus-ring-color: ${t.accent2};
  --focus-ring: 0 0 0 3px color-mix(in srgb, ${t.accent2} 55%, transparent);
  --terminal-bg: ${dark ? "rgb(0 0 0 / 45%)" : "#0a0f14"};
  --terminal-text: ${t.accent2};
  --flag-bg: color-mix(in srgb, ${t.accent2} 14%, transparent);
  --flag-border: 1px dashed ${t.accent};
  --flag-text: color-mix(in srgb, ${t.accent2} 55%, ${t.text});
  --fx: ${t.fx};
  --fx-color: ${fr},${fg},${fb};
}`;
  }

  /* ---------- storage + injection ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
  const store = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ } };

  function styleTag(id) {
    let s = document.getElementById(id);
    if (!s) { s = document.createElement("style"); s.id = id; document.head.appendChild(s); }
    return s;
  }
  function injectAll() {
    styleTag("mg-custom-themes").textContent = load().map(t => cssFor(t, t.id)).join("\n\n");
  }
  injectAll();

  /* ---------- dock orbs for saved themes ---------- */
  function addOrb(t) {
    const host = document.getElementById("dockOrbs") || $("#themeDock");
    if (!host || host.querySelector(`[data-theme="${t.id}"]`)) return;
    const orb = document.createElement("button");
    orb.className = "theme-orb"; orb.type = "button";
    orb.style.background = `linear-gradient(150deg, ${t.bg1}, ${t.accent})`;
    orb.dataset.theme = t.id;
    orb.dataset.label = `${t.name} (yours)`;
    orb.dataset.vibe = "painted in the Theme Studio 🖌️";
    orb.setAttribute("aria-label", `Switch theme to ${t.name}, your custom theme`);
    orb.setAttribute("aria-pressed", String(document.documentElement.getAttribute("data-theme") === t.id));
    host.appendChild(orb);
  }
  document.addEventListener("mg:content-ready", () => load().forEach(addOrb));

  /* ---------- live preview ---------- */
  let previewing = false, before = null;
  function applyPreview() {
    const t = readForm();
    styleTag("mg-custom-preview").textContent = cssFor(t, "custom-preview");
    if (!previewing) { before = document.documentElement.getAttribute("data-theme"); previewing = true; }
    document.documentElement.setAttribute("data-theme", "custom-preview");
    $("#stRevert").hidden = false;
    if (typeof syncFx === "function") syncFx();
  }
  function revertPreview() {
    if (!previewing) return;
    previewing = false;
    document.documentElement.setAttribute("data-theme", before || "aero");
    styleTag("mg-custom-preview").textContent = "";
    $("#stRevert").hidden = true;
    if (typeof syncFx === "function") syncFx();
  }
  /* live swatch strip at the top of the studio */
  function paintStrip() {
    const p = $("#stPreview");
    if (!p) return;
    const t = readForm();
    p.querySelector(".st-prev-sky").style.background = `linear-gradient(120deg, ${t.bg1}, ${t.bg2})`;
    p.querySelector(".st-prev-acc").style.background = t.accent;
    p.querySelector(".st-prev-acc2").style.background = t.accent2;
    const card = p.querySelector(".st-prev-card");
    card.style.background = t.card;
    card.style.color = t.text;
    card.style.borderRadius = (t.radius * 0.4 + 2) + "px";
  }
  dlg.addEventListener("input", paintStrip);
  paintStrip();

  dlg.addEventListener("input", () => { if (previewing) applyPreview(); });
  $("#stApply").addEventListener("click", applyPreview);
  $("#stRevert").addEventListener("click", revertPreview);

  /* ---------- save / delete ---------- */
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "theme";
  function renderSaved() {
    const row = $("#stSavedRow");
    const list = load();
    row.innerHTML = list.length ? "" : `<span class="muted small">No saved themes yet. Your creations will line up here and on the dock.</span>`;
    list.forEach(t => {
      const chip = document.createElement("span");
      chip.className = "st-saved";
      const sw = document.createElement("span");
      sw.className = "st-swatch";
      sw.style.background = `linear-gradient(150deg, ${t.bg1}, ${t.accent})`;
      const name = document.createElement("span"); name.textContent = t.name;
      const wear = document.createElement("button");
      wear.type = "button"; wear.textContent = "wear"; wear.title = `Switch the site to ${t.name}`;
      wear.addEventListener("click", () => { previewing = false; $("#stRevert").hidden = true; if (typeof setTheme === "function") setTheme(t.id); });
      const del = document.createElement("button");
      del.type = "button"; del.textContent = "✕"; del.title = `Delete ${t.name}`;
      del.addEventListener("click", () => {
        store(load().filter(x => x.id !== t.id));
        injectAll(); renderSaved();
        document.querySelector(`.theme-orb[data-theme="${t.id}"]`)?.remove();
        if (document.documentElement.getAttribute("data-theme") === t.id && typeof setTheme === "function") setTheme("aero");
      });
      chip.append(sw, name, wear, del);
      row.appendChild(chip);
    });
  }
  $("#stSave").addEventListener("click", () => {
    const t = readForm();
    const list = load();
    let id = "custom-" + slug(t.name), n = 2;
    while (list.some(x => x.id === id)) id = `custom-${slug(t.name)}-${n++}`;
    t.id = id;
    list.push(t); store(list);
    injectAll(); addOrb(t); renderSaved();
    previewing = false; $("#stRevert").hidden = true;
    styleTag("mg-custom-preview").textContent = "";
    if (typeof setTheme === "function") setTheme(id);
  });
  renderSaved();

  /* ---------- export ---------- */
  function exportText() {
    const t = readForm();
    const id = slug(t.name);
    return `/* "${t.name}", painted in the Theme Studio on ${new Date().toLocaleDateString()}.
   Paste into themes.css, then add the dock entry below to content.json → themes. */
${cssFor(t, id)}

/* content.json → themes entry:
{
  "id": "${id}",
  "label": "${t.name}",
  "swatch": "linear-gradient(150deg, ${t.bg1}, ${t.accent})",
  "vibe": "painted in the Theme Studio 🖌️"
}
*/`;
  }
  $("#stExport").addEventListener("click", () => {
    $("#stCode").value = exportText();
    $("#stCode").hidden = false;
    $("#stCodeActions").hidden = false;
  });
  $("#stCopy").addEventListener("click", async (e) => {
    const code = $("#stCode");
    code.value = exportText();
    try { await navigator.clipboard.writeText(code.value); e.target.textContent = "Copied ✓"; }
    catch (err) { code.focus(); code.select(); e.target.textContent = "Press Ctrl/Cmd+C"; }
    setTimeout(() => { e.target.textContent = "Copy CSS"; }, 1800);
  });
  $("#stDownload").addEventListener("click", () => {
    const t = readForm();
    const blob = new Blob([exportText()], { type: "text/css" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(t.name)}-theme.css`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });

  /* ---------- fine-tune picker: aim sliders at any color square ---------- */
  const COLOR_TARGETS = {
    stBg1: "Sky, top", stBg2: "Sky, bottom", stText: "Text",
    stAccent: "Accent", stAccent2: "Accent 2", stCard: "Card tint", stFxColor: "Particle color"
  };
  let aim = "stAccent";
  const hexToHsl = (hex) => {
    let [r, g, b] = hexRgb(hex).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60); if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    return [h, Math.round(s * 100), Math.round(l * 100)];
  };
  const hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    const to = v => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
  };
  function aimAt(id) {
    aim = id;
    const v = byId(id).value;
    const [h, s, l] = hexToHsl(v);
    $("#stH").value = h; $("#stS").value = s; $("#stL").value = l; $("#stHex").value = v;
    $("#stTargetDot").style.background = v;
    $("#stTargetName").textContent = "Fine-tune: " + COLOR_TARGETS[id];
    Object.keys(COLOR_TARGETS).forEach(i => byId(i)?.classList.toggle("st-aimed", i === id));
  }
  Object.keys(COLOR_TARGETS).forEach(id => {
    const el = byId(id);
    if (!el) return;
    el.addEventListener("click", () => aimAt(id));
    el.addEventListener("input", () => { if (aim === id) aimAt(id); });
  });
  function applyAim() {
    const hex = hslToHex(+$("#stH").value, +$("#stS").value, +$("#stL").value);
    $("#stHex").value = hex;
    $("#stTargetDot").style.background = hex;
    const el = byId(aim);
    el.value = hex;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  ["stH", "stS", "stL"].forEach(id => byId(id).addEventListener("input", applyAim));
  $("#stHex").addEventListener("change", () => {
    let v = $("#stHex").value.trim();
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      const el = byId(aim);
      el.value = v.toLowerCase();
      el.dispatchEvent(new Event("input", { bubbles: true }));
      aimAt(aim);
    }
  });
  if (window.EyeDropper) {
    const ed = $("#stEyedrop");
    ed.hidden = false;
    ed.addEventListener("click", async () => {
      try {
        const r = await new EyeDropper().open();
        const el = byId(aim);
        el.value = r.sRGBHex;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        aimAt(aim);
      } catch (e) { /* picker dismissed */ }
    });
  }
  aimAt("stAccent");

  /* ---------- open / close ---------- */
  $("#studioBtn")?.addEventListener("click", () => {
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute("open", "");
  });
  $("#studioClose").addEventListener("click", () => { dlg.close?.(); dlg.removeAttribute("open"); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) { dlg.close?.(); } });
  dlg.addEventListener("close", () => { revertPreview(); });
})();
