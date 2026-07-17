/* script.js — behaviors for the shapeshifting portfolio.
   Vanilla JS, no build step. Everything heavy is lazy: PDF pages render on
   scroll, iframes inject on click, effects load per-theme, music never
   autoplays. Reduced motion and mobile are first-class citizens. */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 720px)").matches;

/* ============================== THEMES ================================= */
const FX_THEMES = new Set(["aero", "glass", "clay"]); // canvas-bubble themes

function setTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem("mg-theme", id); } catch (e) { /* fine */ }
  $$(".theme-orb").forEach(o => o.setAttribute("aria-pressed", String(o.dataset.theme === id)));
  syncFx();
}

document.addEventListener("click", (e) => {
  const orb = e.target.closest(".theme-orb");
  if (orb) setTheme(orb.dataset.theme);
});

/* Bubble canvas — Frutiger Aero's ambient layer. transform-cheap, capped,
   killed on mobile + reduced motion + non-aero-family themes. */

/* Decorative randomness (bubble positions only). crypto-backed purely to
   satisfy static analysis; nothing security-relevant depends on this. */
const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

let fxRaf = null;
let fxSizer = null;
function syncFx() {
  const canvas = $("#fx-canvas");
  if (!canvas) return;
  const theme = document.documentElement.getAttribute("data-theme") || "aero";
  const on = FX_THEMES.has(theme) && !prefersReduced && !isMobile;
  if (!on) {
    cancelAnimationFrame(fxRaf); fxRaf = null;
    if (fxSizer) { removeEventListener("resize", fxSizer); fxSizer = null; }
    canvas.style.display = "none";
    return;
  }
  canvas.style.display = "block";
  if (fxRaf) return; // already running
  const ctx = canvas.getContext("2d");
  const dpi = Math.min(devicePixelRatio || 1, 2);
  fxSizer = () => { canvas.width = innerWidth * dpi; canvas.height = innerHeight * dpi; };
  fxSizer(); addEventListener("resize", fxSizer, { passive: true });
  const bubbles = Array.from({ length: 22 }, () => ({
    x: rand(), y: rand() + 0.2,
    r: 6 + rand() * 26, v: 0.0004 + rand() * 0.0011,
    drift: (rand() - 0.5) * 0.0004, a: 0.08 + rand() * 0.16
  }));
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bubbles) {
      b.y -= b.v; b.x += b.drift;
      if (b.y < -0.06) { b.y = 1.06; b.x = rand(); }
      const x = b.x * canvas.width, y = b.y * canvas.height, r = b.r * dpi;
      const g = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 6, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${b.a + 0.25})`);
      g.addColorStop(1, `rgba(255,255,255,${b.a * 0.25})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    fxRaf = requestAnimationFrame(tick);
  })();
}

/* ============================== MUSIC ================================== */
/* Looping background track, ON by default. Browsers block true autoplay, so
   the loop starts on the visitor's first interaction (any click/keypress)
   unless they muted it on a previous visit. ♫ mutes/unmutes; 🎧 lets the
   visitor play their own local file instead (object URL — never uploaded). */
(function musicInit() {
  const btn = $("#musicBtn"), audio = $("#bgm");
  const uploadBtn = $("#musicUploadBtn"), fileInput = $("#musicFile");
  if (!btn || !audio) return;
  let muted = false;
  try { muted = localStorage.getItem("mg-music") === "off"; } catch (e) { /* default: on */ }

  const paint = () => {
    btn.setAttribute("aria-pressed", String(!muted));
    btn.textContent = muted ? "♪" : "♫";
    btn.title = muted ? "Music muted — click to unmute" : "Background music — click to mute";
  };
  const tryPlay = async () => {
    if (muted) return;
    try { await audio.play(); } catch (e) { /* needs a user gesture — armed below */ }
  };

  paint();
  tryPlay(); // some browsers allow it (revisits with engagement history)

  /* First gesture anywhere starts the loop (once) */
  const arm = () => { tryPlay(); removeEventListener("pointerdown", arm); removeEventListener("keydown", arm); };
  addEventListener("pointerdown", arm, { once: true });
  addEventListener("keydown", arm, { once: true });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    muted = !muted;
    try { localStorage.setItem("mg-music", muted ? "off" : "on"); } catch (err) {}
    if (muted) audio.pause(); else tryPlay();
    paint();
  });

  /* Custom track: swap the source for this visit only */
  uploadBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", () => {
    const f = fileInput.files[0];
    if (!f) return;
    audio.src = URL.createObjectURL(f);
    muted = false;
    try { localStorage.setItem("mg-music", "on"); } catch (err) {}
    paint();
    tryPlay();
    uploadBtn.title = `Playing your track: ${f.name} (stays in your browser)`;
  });
})();

/* ============================ REVEAL =================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in-view"); revealObserver.unobserve(en.target); } });
}, { threshold: 0.12 });
$$(".reveal").forEach(r => revealObserver.observe(r));

/* ========================= PDF.js LAZY VIEWER ========================== */
/* The fix for "file too large to embed": pages render one-by-one only when
   scrolled into view, inside .pdf-shell containers or the modal. */
function pdfReady() {
  return new Promise((resolve, reject) => {
    let tries = 0;
    (function poll() {
      tries += 1;
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else if (tries > 100) reject(new Error("PDF.js failed to load"));
      else setTimeout(poll, 60);
    })();
  });
}

async function renderPdfInto(shell, url) {
  shell.innerHTML = `<p class="pdf-status">Opening ${url.split("/").pop()}…</p>`;
  let lib;
  try { lib = await pdfReady(); }
  catch { shell.innerHTML = `<p class="pdf-status">Viewer library blocked — use the download link instead.</p>`; return; }
  let doc;
  try { doc = await lib.getDocument(url).promise; }
  catch (err) {
    shell.innerHTML = `<p class="pdf-status">Couldn't open this PDF (${err.message}). The download link still works.</p>`;
    return;
  }
  shell.innerHTML = "";
  const status = document.createElement("p");
  status.className = "pdf-status";
  status.textContent = `${doc.numPages} pages — rendering as you scroll.`;
  shell.appendChild(status);

  const pageObserver = new IntersectionObserver(async (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const holder = en.target;
      pageObserver.unobserve(holder);
      const pageNum = Number(holder.dataset.page);
      try {
        const page = await doc.getPage(pageNum);
        const scale = Math.min(1.4, (shell.clientWidth - 24) / page.getViewport({ scale: 1 }).width);
        const vp = page.getViewport({ scale: scale * Math.min(devicePixelRatio || 1, 2) });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Page ${pageNum} of ${doc.numPages}`);
        holder.replaceWith(canvas);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      } catch (e) { holder.textContent = `Page ${pageNum} failed to render.`; }
    }
  }, { root: shell, rootMargin: "300px" });

  for (let i = 1; i <= doc.numPages; i++) {
    const holder = document.createElement("div");
    holder.className = "pdf-status";
    holder.dataset.page = i;
    holder.textContent = `Page ${i}…`;
    holder.style.minHeight = "120px";
    shell.appendChild(holder);
    pageObserver.observe(holder);
  }
}

/* Resume: start only when the intro section is actually visible */
(function lazyResume() {
  const shell = $("#resumeShell");
  if (!shell) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      io.disconnect();
      renderPdfInto(shell, shell.dataset.pdf);
    }
  }, { rootMargin: "200px" });
  io.observe(shell);
})();

/* ============================== MODAL ================================== */
const modal = $("#modal"), modalContent = $("#modalContent");
function openModal(node) {
  modalContent.innerHTML = "";
  modalContent.appendChild(node);
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}
$("#modalClose")?.addEventListener("click", () => { modal.close?.(); modal.removeAttribute("open"); modalContent.innerHTML = ""; });
modal?.addEventListener("click", (e) => { if (e.target === modal) { modal.close?.(); modalContent.innerHTML = ""; } });

$("#resumeExpand")?.addEventListener("click", () => {
  const shell = document.createElement("div");
  shell.className = "pdf-shell"; shell.style.maxHeight = "78vh";
  openModal(shell);
  renderPdfInto(shell, $("#resumeShell").dataset.pdf);
});

/* Posts: on-site viewer + drive preview */
document.addEventListener("click", (e) => {
  const pdfBtn = e.target.closest(".view-pdf");
  if (pdfBtn) {
    const shell = document.createElement("div");
    shell.className = "pdf-shell"; shell.style.maxHeight = "78vh";
    const h = document.createElement("h3"); h.textContent = pdfBtn.dataset.title;
    const wrap = document.createElement("div"); wrap.append(h, shell);
    openModal(wrap);
    renderPdfInto(shell, pdfBtn.dataset.pdf);
  }
  const frameBtn = e.target.closest(".view-frame");
  if (frameBtn) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<h3></h3><iframe class="embed-live" style="aspect-ratio:4/5" loading="lazy" allow="fullscreen"></iframe>
      <p class="muted small">If this frame stays blank the host is refusing to be embedded — use the Share/Direct links on the card.</p>`;
    wrap.querySelector("h3").textContent = frameBtn.dataset.title;
    wrap.querySelector("iframe").src = frameBtn.dataset.frame;
    openModal(wrap);
  }
});

/* ================== PROTECTED DOCUMENT READER ==========================
   DOCX renders via vendored mammoth.js (BSD-2-Clause), XLSX via vendored
   SheetJS CE (Apache-2.0) — both lazy-injected on first use, never on page
   load. Reader is view-only: no download links, selection/copy/context-menu
   disabled. Honest limit (SECURITY.md): this is deterrence — a static host
   cannot make bytes unreadable to a determined client. */
const vendorScripts = {};
function loadVendor(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  if (!vendorScripts[src]) {
    vendorScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(window[globalName]);
      s.onerror = () => { delete vendorScripts[src]; reject(new Error(`${src} failed to load`)); };
      document.head.appendChild(s);
    });
  }
  return vendorScripts[src];
}

function protectReader(node) {
  ["copy", "cut", "contextmenu", "selectstart", "dragstart"].forEach(ev =>
    node.addEventListener(ev, (e) => e.preventDefault()));
}

async function renderDocInto(reader, path) {
  reader.textContent = "Opening document…";
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  const buf = await res.arrayBuffer();

  if (/\.docx$/i.test(path)) {
    const mammoth = await loadVendor("vendor/mammoth/mammoth.browser.min.js", "mammoth");
    const out = await mammoth.convertToHtml({ arrayBuffer: buf });
    reader.innerHTML = out.value; // mammoth output derives only from the docx we ship
  } else if (/\.xlsx$/i.test(path)) {
    const XLSX = await loadVendor("vendor/xlsx/xlsx.full.min.js", "XLSX");
    const wb = XLSX.read(buf, { type: "array" });
    reader.innerHTML = "";
    const tabs = document.createElement("div");
    tabs.className = "doc-tabs";
    const sheetHost = document.createElement("div");
    reader.append(tabs, sheetHost);
    const showSheet = (name) => {
      sheetHost.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[name], { header: "", footer: "" });
      tabs.querySelectorAll("button").forEach(b => b.classList.toggle("ghost", b.textContent !== name));
    };
    wb.SheetNames.forEach((name, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn ghost"; b.textContent = name;
      b.addEventListener("click", () => showSheet(name));
      tabs.appendChild(b);
      if (i === 0) showSheet(name);
    });
    if (wb.SheetNames.length < 2) tabs.remove();
  } else {
    throw new Error("Unsupported format");
  }
}

document.addEventListener("click", async (e) => {
  const viewBtn = e.target.closest(".doc-view");
  if (!viewBtn) return;
  const wrap = document.createElement("div");
  const h = document.createElement("h3");
  h.textContent = viewBtn.dataset.title;
  const reader = document.createElement("div");
  reader.className = "doc-reader";
  const note = document.createElement("p");
  note.className = "doc-reader-note";
  note.textContent = "View-only reader — this work is shared to be read here, not redistributed.";
  wrap.append(h, reader, note);
  protectReader(reader);
  openModal(wrap);
  try { await renderDocInto(reader, viewBtn.dataset.doc); }
  catch (err) { reader.textContent = `Couldn't open this document (${err.message}).`; }
});

/* ====================== ARCADE FACADES ================================= */
/* Click-to-activate everywhere (lite-youtube pattern): nothing heavy loads
   until asked. Cross-origin frame-blocking can't be reliably detected from
   JS, so the "Open in new tab" escape hatch stays visible permanently. */
document.addEventListener("click", (e) => {
  const f = e.target.closest(".facade[data-embed], .facade[data-open]");
  if (!f) return;
  const embed = f.dataset.embed;
  if (embed) {
    const frame = document.createElement("iframe");
    frame.className = "embed-live";
    frame.loading = "lazy";
    frame.allow = "fullscreen; autoplay; gamepad";
    frame.src = embed;
    frame.title = f.getAttribute("aria-label") || "Embedded project";
    f.replaceWith(frame);
  } else if (f.dataset.open) {
    window.open(f.dataset.open, "_blank", "noopener");
  }
});

/* ============ MARKET PULSE — live crypto + FX refresh + converter ======= */
/* Honest scope: chips marked live refresh from CoinGecko (crypto) and
   Frankfurter/ECB (FX) — both free, CORS-open, no keys. Commodity and index
   chips stay dated snapshot data. The converter reads whatever the chips
   currently hold (snapshot or refreshed) via window.MG.rates. */
window.MG = window.MG || {};
MG.rates = { usdPerUnit: {}, perUsd: {} }; // unit → USD price; USD → currency

function seedRates() {
  const items = MG.finance?.marketPulse?.items || [];
  for (const it of items) {
    if (Number.isFinite(it.usdPerUnit)) MG.rates.usdPerUnit[it.id] = it.usdPerUnit;
    if (Number.isFinite(it.perUsd)) MG.rates.perUsd[it.id] = it.perUsd;
  }
  MG.rates.perUsd.usd = 1;
}
document.addEventListener("mg:content-ready", seedRates);

$("#pulseRefresh")?.addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true; btn.textContent = "↻ Fetching…";
  const now = new Date().toLocaleTimeString();
  const markLive = (chip) => {
    const label = chip.querySelector(".p-label");
    label.textContent = label.textContent.replace(/ · live.*$/, "") + ` · live @ ${now}`;
  };
  let okAny = false;

  /* Crypto via CoinGecko */
  try {
    const chips = $$("[data-coingecko]");
    if (chips.length) {
      const ids = chips.map(c => c.dataset.coingecko).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      chips.forEach(c => {
        const price = data[c.dataset.coingecko]?.usd;
        if (Number.isFinite(price)) {
          c.querySelector(".p-value").textContent = `$${price.toLocaleString()}`;
          MG.rates.usdPerUnit[c.dataset.pulseId] = price;
          markLive(c);
          okAny = true;
        }
      });
    }
  } catch (err) { /* soft-fail; FX may still land */ }

  /* FX via Frankfurter (ECB reference rates) */
  try {
    const chips = $$("[data-fx]");
    if (chips.length) {
      const codes = chips.map(c => c.dataset.fx).join(",");
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${codes}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      chips.forEach(c => {
        const rate = data.rates?.[c.dataset.fx];
        if (Number.isFinite(rate)) {
          c.querySelector(".p-value").textContent = `${rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} / $`;
          MG.rates.perUsd[c.dataset.pulseId] = rate;
          markLive(c);
          okAny = true;
        }
      });
    }
  } catch (err) { /* soft-fail */ }

  btn.textContent = okAny ? "↻ Refresh live chips" : "↻ Refresh failed — rate limit? Try later";
  btn.disabled = false;
});

/* Converter — units come from the pulse chips; math routes through USD. */
(function converter() {
  const amount = $("#calcAmount"), from = $("#calcFrom"), to = $("#calcTo");
  const result = $("#calcResult"), swap = $("#calcSwap");
  if (!amount || !from || !to) return;

  /* unit id → { label, toUsd(x), fromUsd(x) } */
  function units() {
    const u = { usd: { label: "US Dollar (USD)", toUsd: x => x, fromUsd: x => x } };
    const items = MG.finance?.marketPulse?.items || [];
    for (const it of items) {
      if (MG.rates.perUsd[it.id] !== undefined && it.id !== "usd") {
        u[it.id] = {
          label: `${it.label} (${it.fxCode})`,
          toUsd: x => x / MG.rates.perUsd[it.id],
          fromUsd: x => x * MG.rates.perUsd[it.id]
        };
      } else if (MG.rates.usdPerUnit[it.id] !== undefined) {
        u[it.id] = {
          label: it.coingeckoId ? `${it.label} (crypto)` : `${it.label} (snapshot)`,
          toUsd: x => x * MG.rates.usdPerUnit[it.id],
          fromUsd: x => x / MG.rates.usdPerUnit[it.id]
        };
      }
    }
    return u;
  }

  function fill() {
    const u = units();
    const opts = Object.entries(u).map(([id, def]) => `<option value="${id}">${def.label}</option>`).join("");
    const f = from.value, t = to.value;
    from.innerHTML = opts; to.innerHTML = opts;
    from.value = u[f] ? f : "usd";
    to.value = u[t] ? t : (u.btc ? "btc" : Object.keys(u)[1] || "usd");
    compute();
  }

  function compute() {
    const u = units();
    const a = parseFloat(amount.value);
    const f = u[from.value], t = u[to.value];
    if (!f || !t || !Number.isFinite(a)) { result.textContent = "Enter an amount and pick units."; return; }
    const out = t.fromUsd(f.toUsd(a));
    const digits = out >= 100 ? 2 : out >= 1 ? 4 : 8;
    result.textContent = `${a.toLocaleString()} × ${f.label.replace(/ \(.*/, "")} = ${out.toLocaleString(undefined, { maximumFractionDigits: digits })} ${t.label.replace(/ \(.*/, "")}`;
  }

  amount.addEventListener("input", compute);
  from.addEventListener("change", compute);
  to.addEventListener("change", compute);
  swap?.addEventListener("click", () => { const f = from.value; from.value = to.value; to.value = f; compute(); });
  $("#pulseRefresh")?.addEventListener("click", () => setTimeout(fill, 1500)); // refill after live refresh lands
  document.addEventListener("mg:content-ready", () => { seedRates(); fill(); });
})();

/* TradingView loads only on request (heavy third-party frame) */
$("#tvLoad")?.addEventListener("click", (e) => {
  const slot = $("#tvSlot");
  slot.innerHTML = `<iframe class="embed-live" style="height:400px;aspect-ratio:auto" loading="lazy"
    src="https://s.tradingview.com/widgetembed/?symbol=NASDAQ%3AAAPL&interval=D&hidesidelegend=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=Etc%2FUTC&locale=en"
    title="TradingView Widget"></iframe>`;
  e.currentTarget.remove();
});

/* ==================== MINI TERMINALS (tiny by design) ================== */
/* Same-origin fetch: the deployed Pages site serves its own source, so this
   works even with the repo private (raw.githubusercontent needs auth there).
   admin.html ships no secrets — auth is a per-session PAT, never stored. */
const TERMINAL_FILES = ["index.html", "styles.css", "themes.css", "script.js", "content-loader.js", "admin.html"];
(async function terminals() {
  const row = $("#github-terminals");
  if (!row) return;
  const base = "./";
  for (const name of TERMINAL_FILES) {
    const card = document.createElement("button");
    card.className = "mini-terminal";
    card.type = "button";
    card.innerHTML = `<div class="t-name">${name}</div><pre>fetching…</pre>`;
    card.addEventListener("click", () => {
      const pre = document.createElement("pre");
      pre.style.cssText = "white-space:pre-wrap;word-break:break-word;font-family:var(--font-mono);font-size:.78rem;max-height:70vh;overflow:auto";
      pre.textContent = card.dataset.full || "Still fetching…";
      const h = document.createElement("h3"); h.textContent = name;
      const wrap = document.createElement("div"); wrap.append(h, pre);
      openModal(wrap);
    });
    row.appendChild(card);
    fetch(base + name).then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(text => {
        card.dataset.full = text;
        card.querySelector("pre").textContent = text.slice(0, 400);
      })
      .catch(() => { card.querySelector("pre").textContent = "// live fetch unavailable (offline or repo path changed)"; });
  }
})();

/* ======================= POSTS CAROUSEL BUTTONS ======================== */
(function carousel() {
  const track = $("#projectTrack");
  if (!track) return;
  const step = () => Math.min(340, track.clientWidth * 0.8);
  $(".posts-carousel .prev")?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: prefersReduced ? "auto" : "smooth" }));
  $(".posts-carousel .next")?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: prefersReduced ? "auto" : "smooth" }));
})();

/* ========================= PIXEL ART STUDIO ============================
   v2.1: palettes, resizable grid, mirror mode. Feature set inspired by the
   mimopixel editor surfaced in the Grok round-1 scout; implemented natively
   (zero deps) because that repo ships no LICENSE file — ideas only, no code. */
(function pixelStudio() {
  const grid = $("#pixelCanvas");
  if (!grid) return;

  /* Game Boy = canonical DMG greens; PICO-8 = Lexaloffle's published 16. */
  const PALETTES = {
    pico8: ["#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"],
    gameboy: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"],
    mono: ["#000000", "#404040", "#808080", "#C0C0C0", "#FFFFFF"]
  };

  let SIZE = 16, cells = [], history = [];
  let color = "#000000", erasing = false, painting = false, mirror = false;

  function buildGrid(size) {
    SIZE = size;
    grid.style.setProperty("--px-cols", String(size));
    grid.setAttribute("aria-label", `Pixel art canvas: ${size} by ${size} grid. Click or drag to paint.`);
    grid.innerHTML = "";
    cells = []; history = [];
    for (let i = 0; i < size * size; i++) {
      const px = document.createElement("div");
      px.className = "px";
      px.style.background = "#ffffff";
      grid.appendChild(px);
      cells.push(px);
    }
  }
  buildGrid(SIZE);

  const snapshot = () => { history.push(cells.map(c => c.style.background)); if (history.length > 60) history.shift(); };
  const setCell = (i, bg) => { if (i >= 0 && i < cells.length) cells[i].style.background = bg; };
  const paint = (px) => {
    if (!px?.classList.contains("px")) return;
    const i = cells.indexOf(px);
    if (i < 0) return;
    const bg = erasing ? "#ffffff" : color;
    setCell(i, bg);
    if (mirror) {
      const row = Math.floor(i / SIZE), col = i % SIZE;
      setCell(row * SIZE + (SIZE - 1 - col), bg);
    }
  };

  grid.addEventListener("pointerdown", (e) => { snapshot(); painting = true; paint(e.target); try { grid.setPointerCapture(e.pointerId); } catch (_) {} });
  grid.addEventListener("pointermove", (e) => { if (painting) paint(document.elementFromPoint(e.clientX, e.clientY)); });
  addEventListener("pointerup", () => { painting = false; });

  /* Palette swatches */
  const paletteRow = $("#paletteRow");
  function renderPalette(name) {
    if (!paletteRow) return;
    if (name === "free" || !PALETTES[name]) { paletteRow.hidden = true; paletteRow.innerHTML = ""; return; }
    paletteRow.hidden = false;
    paletteRow.innerHTML = "";
    PALETTES[name].forEach((hex, idx) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "swatch";
      b.style.background = hex;
      b.title = hex;
      b.setAttribute("aria-label", `Color ${hex}`);
      b.setAttribute("aria-pressed", String(idx === 0));
      b.addEventListener("click", () => {
        color = hex; erasing = false;
        const picker = $("#colorPicker"); if (picker) picker.value = hex;
        paletteRow.querySelectorAll(".swatch").forEach(s => s.setAttribute("aria-pressed", String(s === b)));
      });
      paletteRow.appendChild(b);
    });
    color = PALETTES[name][0]; erasing = false;
    const picker = $("#colorPicker"); if (picker) picker.value = PALETTES[name][0];
  }
  $("#paletteSelect")?.addEventListener("change", (e) => renderPalette(e.target.value));

  $("#gridSizeSelect")?.addEventListener("change", (e) => {
    const next = parseInt(e.target.value, 10);
    const dirty = cells.some(c => c.style.background !== "#ffffff" && c.style.background !== "rgb(255, 255, 255)");
    if (dirty && !confirm(`Switch to ${next}×${next}? The current canvas will be cleared.`)) {
      e.target.value = String(SIZE);
      return;
    }
    buildGrid(next);
  });

  const mirrorBtn = $("#mirrorToggle");
  const setMirror = (on) => {
    mirror = on;
    if (mirrorBtn) { mirrorBtn.setAttribute("aria-pressed", String(on)); mirrorBtn.textContent = `Mirror: ${on ? "on" : "off"}`; }
  };
  mirrorBtn?.addEventListener("click", () => setMirror(!mirror));

  $("#colorPicker")?.addEventListener("input", (e) => {
    color = e.target.value; erasing = false;
    paletteRow?.querySelectorAll(".swatch").forEach(s => s.setAttribute("aria-pressed", "false"));
  });
  $("#eraser")?.addEventListener("click", () => { erasing = !erasing; });
  $("#undo")?.addEventListener("click", () => {
    const prev = history.pop();
    if (prev && prev.length === cells.length) prev.forEach((bg, i) => cells[i].style.background = bg);
  });
  $("#clearCanvas")?.addEventListener("click", () => { snapshot(); cells.forEach(c => c.style.background = "#ffffff"); });
  $("#saveImage")?.addEventListener("click", () => {
    const scale = Math.max(8, Math.round(320 / SIZE));
    const c = document.createElement("canvas");
    c.width = c.height = SIZE * scale;
    const ctx = c.getContext("2d");
    cells.forEach((cell, i) => {
      ctx.fillStyle = cell.style.background || "#ffffff";
      ctx.fillRect((i % SIZE) * scale, Math.floor(i / SIZE) * scale, scale, scale);
    });
    const a = document.createElement("a");
    a.download = `pixel-art-studio-max-${SIZE}x${SIZE}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  });
  /* Plain-letter hotkeys only — modified combos (Ctrl+S etc.) stay with the
     browser. Map keeps the handler's branching flat. */
  const HOTKEYS = { c: "#clearCanvas", z: "#undo", m: "#mirrorToggle", s: "#saveImage" };
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches("input, textarea, select")) return;
    const sel = HOTKEYS[e.key.toLowerCase()];
    if (!sel) return;
    e.preventDefault();
    $(sel)?.click();
  });
})();

/* ============================ SITE SEARCH ==============================
   Fuse.js 7.5.0 (Apache-2.0, vendored at /vendor/fuse/) loads lazily on the
   first open via dynamic import; if it can't load, a built-in substring
   scorer keeps search working. Index is built once from window.MG data. */
(function siteSearch() {
  const dlg = $("#searchModal"), input = $("#searchInput"), results = $("#searchResults");
  const openBtn = $("#searchBtn"), note = $("#searchEngineNote");
  if (!dlg || !input || !results) return;

  let docs = null, fuse = null, engineTried = false;

  function buildDocs() {
    const MG = window.MG || {};
    const out = [
      { kind: "Section", title: "Introduction & Resume", text: "resume pdf bio maximiliano garcia", href: "#introduction" },
      { kind: "Section", title: "Programming Works", text: "source code mini terminals live repo", href: "#programming" },
      { kind: "Section", title: "Posts", text: "haas hall university of arkansas nwti reports", href: "#posts" },
      { kind: "Section", title: "The Financial Liberty Project", text: "alternative investments market pulse research", href: "#finance" },
      { kind: "Section", title: "Games & Projects Arcade", text: "pixel art studio games apps", href: "#arcade" },
      { kind: "Section", title: "Connect", text: "linktree links socials", href: "#connect" }
    ];
    (MG.content?.projects || []).forEach(p => out.push({
      kind: "Post", title: p.title || "", text: [p.subtitle, p.description].filter(Boolean).join(" "), href: "#posts"
    }));
    (MG.content?.arcade || []).forEach(g => out.push({
      kind: g.kind === "soon" ? "Coming soon" : "Arcade", title: g.title || "",
      text: [g.description, g.badge].filter(Boolean).join(" "),
      href: "#arcade", external: g.openUrl || null
    }));
    (MG.finance?.works || []).forEach(w => out.push({
      kind: w.status === "soon" ? "Coming soon" : "Financial Liberty", title: w.title || "",
      text: [w.blurb, ...(w.flags || [])].join(" "), href: "#finance", searchId: w.id
    }));
    (MG.finance?.researchDesk || []).forEach(g => (g.links || []).forEach(l => out.push({
      kind: "Research Desk", title: l.label || l.title || "", text: g.group || g.title || "", external: l.url || l.href
    })));
    document.querySelectorAll(".tree-link").forEach(a => out.push({
      kind: "Connect", title: (a.textContent || "").trim().replace(/\s+/g, " "), text: "connect link", external: a.href
    }));
    return out;
  }

  async function ensureEngine() {
    if (docs === null) docs = buildDocs();
    if (engineTried) return;
    engineTried = true;
    try {
      const mod = await import("./vendor/fuse/fuse.min.mjs");
      const Fuse = mod.default || mod.Fuse;
      fuse = new Fuse(docs, {
        keys: [{ name: "title", weight: 0.7 }, { name: "text", weight: 0.3 }],
        threshold: 0.38, ignoreLocation: true, minMatchCharLength: 2
      });
      if (note) note.textContent = "Fuzzy search · Fuse.js 7.5.0 (vendored, Apache-2.0)";
    } catch (_) {
      fuse = null;
      if (note) note.textContent = "Basic search (Fuse.js unavailable — substring fallback)";
    }
  }

  function fallbackSearch(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return docs
      .map(d => {
        const hay = `${d.title} ${d.text}`.toLowerCase();
        const hits = terms.filter(t => hay.includes(t)).length;
        return { item: d, score: terms.length ? 1 - hits / terms.length : 1, hits };
      })
      .filter(r => r.hits > 0)
      .sort((a, b) => a.score - b.score || a.item.title.localeCompare(b.item.title));
  }

  function run(q) {
    results.innerHTML = "";
    if (!q || q.trim().length < 2) {
      results.innerHTML = `<div class="search-empty">Type at least two characters — works, projects, links, sections.</div>`;
      return;
    }
    const found = (fuse ? fuse.search(q) : fallbackSearch(q)).slice(0, 12);
    if (!found.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = `Nothing matched “${q}”.`;
      results.appendChild(empty);
      return;
    }
    found.forEach(({ item }) => {
      const el = document.createElement(item.external ? "a" : "button");
      el.className = "search-result";
      if (item.external) { el.href = item.external; el.target = "_blank"; el.rel = "noopener"; }
      else el.type = "button";
      const kind = document.createElement("span");
      kind.className = "kind"; kind.textContent = item.kind;
      const title = document.createElement("strong");
      title.textContent = item.title;
      el.append(kind, title);
      if (item.text) {
        const snippet = document.createElement("span");
        snippet.className = "snippet"; snippet.textContent = item.text.slice(0, 110);
        el.appendChild(snippet);
      }
      el.addEventListener("click", () => {
        if (item.external) { closeSearch(); return; }
        closeSearch();
        let target = null;
        if (item.searchId) target = document.querySelector(`[data-search-id="${item.searchId}"]`);
        (target || document.querySelector(item.href))?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      });
      results.appendChild(el);
    });
  }

  function openSearch() {
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute("open", "");
    ensureEngine().then(() => run(input.value));
    setTimeout(() => input.focus(), 30);
  }
  function closeSearch() { dlg.close?.(); dlg.removeAttribute("open"); }

  openBtn?.addEventListener("click", openSearch);
  $("#searchClose")?.addEventListener("click", closeSearch);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeSearch(); });
  input.addEventListener("input", () => run(input.value));
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.target.matches("input, textarea, select")) { e.preventDefault(); openSearch(); }
    if (e.key === "Escape" && dlg.open) closeSearch();
  });
  /* Rebuild the index if content arrives after a search already happened.
     If the dialog is open mid-rebuild, re-run the query so fallbackSearch
     never sees docs === null. */
  document.addEventListener("mg:content-ready", () => {
    docs = null;
    fuse = null;
    engineTried = false;
    if (dlg.open) ensureEngine().then(() => run(input.value));
  });
})();

/* ============================ BOOT ===================================== */
document.addEventListener("mg:content-ready", () => {
  const current = document.documentElement.getAttribute("data-theme") || "aero";
  $$(".theme-orb").forEach(o => o.setAttribute("aria-pressed", String(o.dataset.theme === current)));
});
syncFx();
