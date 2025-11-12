/* Small interaction layer:
   - smooth scroll nav
   - reveal sections (IntersectionObserver)
   - accent management (sets --global-accent based on data-accent)
   - gentle parallax/drift on scroll (updates CSS vars + aura transform)
   - terminal raw-github fetching (auto-converts blob -> raw)
   - copy-to-clipboard for terminals
   - project tabs + viewer
   - pixel art 16x16 studio with undo/clear/eraser/save
*/

(() => {
  const root = document.documentElement;

  /* --------------------------
     Smooth scroll for nav
     -------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const t = document.querySelector(href);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // accessible focus
      setTimeout(() => { t.setAttribute('tabindex','-1'); t.focus({preventScroll:true}); }, 500);
    });
  });

  /* --------------------------
     Reveal observer
     -------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.18 });
  revealEls.forEach(e => revealObserver.observe(e));

  /* --------------------------
     Accent management
     -------------------------- */
  const sections = document.querySelectorAll('section[data-accent]');
  const accentMap = { sky: '--sky', ocean: '--ocean', grass: '--grass', sun: '--sun' };
  const accentObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const accent = entry.target.dataset.accent || 'sky';
      const varName = accentMap[accent] || '--sky';
      const val = getComputedStyle(root).getPropertyValue(varName).trim();
      if (val) root.style.setProperty('--global-accent', val);
    });
  }, { threshold: 0.4 });
  sections.forEach(s => accentObserver.observe(s));

  /* --------------------------
     Parallax / gentle drift
     -------------------------- */
  const aura = document.querySelector('.aura');
  function onScrollParallax() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const sc = docH > 0 ? window.scrollY / docH : 0;
    const x1 = 20 + sc * 6, y1 = 10 + sc * 8;
    const x2 = 80 - sc * 6, y2 = 80 - sc * 6;
    const x3 = 40 + sc * 4, y3 = 70 - sc * 4;
    const x4 = 60 - sc * 3, y4 = 20 + sc * 5;
    root.style.setProperty('--bg-pos-x', x1 + '%');
    root.style.setProperty('--bg-pos-y', y1 + '%');
    root.style.setProperty('--bg-pos-x2', x2 + '%');
    root.style.setProperty('--bg-pos-y2', y2 + '%');
    root.style.setProperty('--bg-pos-x3', x3 + '%');
    root.style.setProperty('--bg-pos-y3', y3 + '%');
    root.style.setProperty('--bg-pos-x4', x4 + '%');
    root.style.setProperty('--bg-pos-y4', y4 + '%');
    if (aura) {
      const ty = Math.round(sc * 40);
      aura.style.transform = `translateX(-50%) translateY(${ty}px)`;
    }
  }
  window.addEventListener('scroll', onScrollParallax, { passive: true });
  onScrollParallax();

  /* --------------------------
     Terminal loader (fetch raw GitHub if provided)
     - If data-raw is a GitHub blob url, convert to raw
     - fallback to inline snippet
     -------------------------- */
  const terminalCards = Array.from(document.querySelectorAll('.terminal-card'));
  const FALLBACK = {
    python: `# Example Python fallback\nprint("Hello, world!")`,
    java: `// Example Java fallback\npublic class HelloWorld{ public static void main(String[] a){ System.out.println("Hello"); } }`,
    cpp: `// Example C++ fallback\n#include <iostream>\nint main(){ std::cout << "Hello"; return 0; }`,
    html: `<!-- Example HTML fallback -->\n<section><h1>Hello</h1></section>`
  };

  function blobToRaw(url) {
    try {
      if (!url.includes('github.com')) return url;
      // convert https://github.com/user/repo/blob/main/path -> https://raw.githubusercontent.com/user/repo/main/path
      return url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    } catch (e) { return url; }
  }

  async function fetchWithTimeout(u, ms = 5000) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      const res = await fetch(u, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) { return null; }
  }

  function smallHighlight(code, lang) {
    if (!code) return '';
    let esc = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    if (lang === 'python') {
      return esc.replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
    }
    if (lang === 'java') {
      return esc.replace(/\b(public|static|void|class|new|return|if|else|for|while)\b/g, '<span class="kw">$1</span>');
    }
    if (lang === 'cpp') {
      return esc.replace(/\b(int|return|#include|std::cout|using|namespace|class|for|while)\b/g, '<span class="kw">$1</span>');
    }
    if (lang === 'html') {
      return esc.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comm">$1</span>').replace(/(&lt;\/?[a-zA-Z0-9-:]+)(\s|&gt;)/g, '<span class="tag">$1</span>$2');
    }
    return esc;
  }

  terminalCards.forEach(async card => {
    const codeEl = card.querySelector('code');
    const lang = codeEl?.dataset?.lang || 'text';
    const rawUrl = card.dataset.raw?.trim();
    let content = null;
    if (rawUrl) {
      const target = blobToRaw(rawUrl);
      content = await fetchWithTimeout(target, 4000);
    }
    if (!content) content = FALLBACK[lang] || `// snippet not available`;
    codeEl.innerHTML = smallHighlight(content, lang);

    // copy button
    const copyBtn = card.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 1400);
        } catch (e) {
          alert('Copy failed — clipboard access restricted.');
        }
      });
    }
  });

  /* --------------------------
     Project tabs logic
     -------------------------- */
  const tabs = Array.from(document.querySelectorAll('.project-tabs .tab'));
  const viewer = document.getElementById('projectViewer');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      tabs.forEach(x => { x.setAttribute('aria-selected','false'); });
      t.setAttribute('aria-selected','true');
      const pdf = t.dataset.pdf || `assets/project${i+1}.pdf`;
      if (viewer) viewer.src = pdf;
    });
    // float on hover handled by CSS .floating
  });

  /* --------------------------
     Pixel Art Studio (16x16 div-grid)
     -------------------------- */
  const GRID = 16;
  const canvasWrap = document.getElementById('pixelCanvas');
  const colorPicker = document.getElementById('color-picker') || document.getElementById('color-picker')?.value;
  const eraserBtn = document.getElementById('eraser-btn');
  const clearBtn = document.getElementById('clear-btn');
  const undoBtn = document.getElementById('undo-btn');
  const saveBtn = document.getElementById('save-btn');

  let currentColor = (document.getElementById('color-picker') || {}).value || '#000000';
  let isEraser = false;
  let drawing = false;
  let history = [];

  function createGrid(){
    if (!canvasWrap) return;
    canvasWrap.innerHTML = '';
    for (let i = 0; i < GRID * GRID; i++){
      const cell = document.createElement('div');
      cell.className = 'pixel';
      cell.dataset.index = i;
      cell.style.background = '#ffffff';
      canvasWrap.appendChild(cell);
    }
  }
  createGrid();

  function pushHistory(){
    const snapshot = Array.from(document.querySelectorAll('.pixel')).map(p => p.style.background || '#ffffff');
    history.push(snapshot);
    if (history.length > 40) history.shift();
  }
  function undo(){
    if (!history.length) return;
    const arr = history.pop();
    const cells = document.querySelectorAll('.pixel');
    cells.forEach((c,i) => c.style.background = arr[i] || '#ffffff');
  }

  // events
  canvasWrap?.addEventListener('pointerdown', e => {
    if (!e.target.classList.contains('pixel')) return;
    e.preventDefault();
    drawing = true;
    pushHistory();
    paintCell(e.target);
  });
  window.addEventListener('pointerup', () => drawing = false);
  canvasWrap?.addEventListener('pointermove', e => {
    if (!drawing) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList.contains('pixel')) paintCell(el);
  });
  // click single
  canvasWrap?.addEventListener('click', e => {
    if (!e.target.classList.contains('pixel')) return;
    pushHistory();
    paintCell(e.target);
  });

  function paintCell(el){
    if (!el) return;
    el.style.background = isEraser ? '#ffffff' : currentColor;
    el.classList.add('active');
    setTimeout(()=> el.classList.remove('active'), 120);
  }

  // controls
  const cp = document.getElementById('color-picker');
  cp?.addEventListener('input', (e) => { currentColor = e.target.value; isEraser = false; eraserBtn?.classList.remove('active'); });
  eraserBtn?.addEventListener('click', () => { isEraser = !isEraser; eraserBtn.classList.toggle('active', isEraser); });
  clearBtn?.addEventListener('click', () => { pushHistory(); document.querySelectorAll('.pixel').forEach(p => p.style.background = '#ffffff'); });
  undoBtn?.addEventListener('click', undo);

  saveBtn?.addEventListener('click', () => {
    // draw to small canvas GRID x GRID then upscale
    const off = document.createElement('canvas');
    off.width = GRID; off.height = GRID;
    const ctx = off.getContext('2d');
    const cells = document.querySelectorAll('.pixel');
    cells.forEach((c,i) => {
      const x = i % GRID; const y = Math.floor(i / GRID);
      ctx.fillStyle = window.getComputedStyle(c).backgroundColor || '#ffffff';
      ctx.fillRect(x,y,1,1);
    });
    // upscale
    const scale = 16;
    const out = document.createElement('canvas');
    out.width = GRID * scale; out.height = GRID * scale;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(off, 0, 0, out.width, out.height);
    out.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'pixel-art.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  // keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'c') { pushHistory(); document.querySelectorAll('.pixel').forEach(p => p.style.background = '#ffffff'); }
    if (e.key === 'z') undo();
    if (e.key === 's') saveBtn?.click();
  });

  /* --------------------------
     Tiny helpers: small highlight CSS injection for terminals
     -------------------------- */
  const style = document.createElement('style');
  style.textContent = `.kw{color:#ffd66b;font-weight:700} .tag{color:#7fdcff} .comm{color:#9aa3bf;font-style:italic}`;
  document.head.appendChild(style);

  /* --------------------------
     Ensure any elements already in viewport are revealed
     -------------------------- */
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) el.classList.add('visible');
  });

})();
