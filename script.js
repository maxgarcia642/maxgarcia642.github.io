/* script.js — interaction layer
   - smooth scroll
   - reveal + nav active
   - accent management (sets --global-accent from data-accent)
   - gentle parallax (sets bg pos vars & moves aura)
   - terminal snippet loader with fallbacks + copy
   - posts carousel
   - pixel-art 16x16 studio
*/

(() => {
  const root = document.documentElement;

  /* ---------- Smooth scrolling for nav anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
      // set focus for accessibility
      setTimeout(()=> target.querySelector('h1,h2,h3,button,input')?.focus?.(), 600);
    });
  });

  /* ---------- Reveal (IntersectionObserver) + active nav ---------- */
  const sections = Array.from(document.querySelectorAll('section'));
  const navPills = Array.from(document.querySelectorAll('.nav-pill'));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        // highlight nav
        navPills.forEach(p => p.removeAttribute('aria-current'));
        const pill = document.querySelector(`.nav-pill[href="#${entry.target.id}"]`);
        if (pill) pill.setAttribute('aria-current','true');

        // accent management: read data-accent from section or use default
        const firstCard = entry.target.querySelector('.card');
        if (firstCard && firstCard.dataset.accent) {
          const accentMap = { sky: '--sky', ocean: '--ocean', grass: '--grass', sun: '--sun' };
          const varName = accentMap[firstCard.dataset.accent] || '--sky';
          const val = getComputedStyle(root).getPropertyValue(varName).trim();
          if (val) root.style.setProperty('--global-accent', val);
        }
      }
    });
  }, {threshold: 0.22});
  sections.forEach(s => revealObserver.observe(s));

  /* ---------- Parallax / gentle background drift ---------- */
  const aura = document.querySelector('.aura');
  function onScrollParallax() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const sc = docH > 0 ? window.scrollY / docH : 0;
    // compute offsets
    const x1 = 20 + sc * 6;
    const y1 = 10 + sc * 8;
    const x2 = 80 - sc * 6;
    const y2 = 20 - sc * 6;
    const x3 = 40 + sc * 4;
    const y3 = 85 - sc * 6;
    const x4 = 70 - sc * 3;
    const y4 = 70 - sc * 3;

    root.style.setProperty('--bg-pos-x', `${x1}%`);
    root.style.setProperty('--bg-pos-y', `${y1}%`);
    root.style.setProperty('--bg-pos-x2', `${x2}%`);
    root.style.setProperty('--bg-pos-y2', `${y2}%`);
    root.style.setProperty('--bg-pos-x3', `${x3}%`);
    root.style.setProperty('--bg-pos-y3', `${y3}%`);
    root.style.setProperty('--bg-pos-x4', `${x4}%`);
    root.style.setProperty('--bg-pos-y4', `${y4}%`);

    if (aura) {
      const translateY = sc * 40; // up to 40px
      aura.style.transform = `translateX(-50%) translateY(${translateY}px)`;
    }
  }
  window.addEventListener('scroll', onScrollParallax, {passive:true});
  onScrollParallax();

  /* ---------- Terminal snippet loader + copy ---------- */
  const terminalCards = document.querySelectorAll('.terminal-card');
  const FALLBACK = {
    python: `# Example Python\ndef hello_world():\n    print("Hello, World!")\n\nhello_world()`,
    java: `// Example Java\npublic class HelloWorld {\n  public static void main(String[] args){\n    System.out.println("Hello, World!");\n  }\n}`,
    cpp: `// Example C++\n#include <iostream>\nint main(){\n  std::cout << "Hello, World!\\n";\n  return 0;\n}`,
    html: `<!-- Example HTML snippet -->\n<section>\n  <h1>Welcome</h1>\n</section>`
  };

  async function fetchWithTimeout(url, ms=3500) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(()=>ctrl.abort(), ms);
      const res = await fetch(url, {signal: ctrl.signal});
      clearTimeout(id);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) { return null; }
  }

  terminalCards.forEach(async card => {
    const codeEl = card.querySelector('code');
    const lang = codeEl?.dataset?.lang || 'text';
    const raw = card.dataset.raw || '';
    let content = null;
    if (raw) content = await fetchWithTimeout(raw, 3500);
    if (!content) content = FALLBACK[lang] || '// snippet unavailable';
    // minimal escape + highlight (small)
    const esc = content.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    if (lang === 'python') {
      codeEl.innerHTML = esc.replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
    } else if (lang === 'java' || lang === 'cpp') {
      codeEl.innerHTML = esc.replace(/\b(public|static|void|class|new|return|if|else|for|while)\b/g, '<span class="kw">$1</span>');
    } else {
      codeEl.innerHTML = esc;
    }
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(content);
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy', 1400);
      } catch (err) {
        alert('Copy failed — clipboard restricted.');
      }
    });
  });

  // add tiny styles for code tokens
  const tokenStyle = document.createElement('style');
  tokenStyle.textContent = `.kw{color:#ffd66b;font-weight:700}`;
  document.head.appendChild(tokenStyle);

  /* ---------- Posts carousel (simple) ---------- */
  (function(){
    const prev = document.querySelector('.carousel-btn.prev');
    const next = document.querySelector('.carousel-btn.next');
    const track = document.querySelector('.carousel-track');
    if (!track || !prev || !next) return;
    const items = Array.from(track.children);
    let index = 0;
    const gap = 12;
    function itemWidth() { return items[0].getBoundingClientRect().width + gap; }
    function update() { track.style.transform = `translateX(${-index * itemWidth()}px)`; }
    prev.addEventListener('click', ()=>{ index = Math.max(0, index-1); update(); });
    next.addEventListener('click', ()=>{ index = Math.min(items.length-1, index+1); update(); });
    window.addEventListener('resize', update);
  })();

  /* ---------- Pixel Art 16x16 Studio ---------- */
  class PixelStudio {
    constructor(opts = {}) {
      this.GRID = 16;
      this.canvasEl = document.getElementById('pixelCanvas');
      this.colorPicker = document.getElementById('color-picker') || document.getElementById('color-picker');
      this.eraserBtn = document.getElementById('eraser-btn');
      this.undoBtn = document.getElementById('undo-btn');
      this.clearBtn = document.getElementById('clear-btn');
      this.saveBtn = document.getElementById('save-btn');

      this.currentColor = this.colorPicker?.value || '#000000';
      this.isEraser = false;
      this.isDown = false;
      this.history = [];
      this.maxHistory = 36;

      this._makeGrid();
      this._bindEvents();
      this._loadFromLocal();
      this._render(); // initial
    }

    _makeGrid() {
      // create 16x16 pixel divs inside canvasEl (grid-auto rows maintained by CSS)
      this.canvasEl.innerHTML = '';
      for (let i=0;i<this.GRID * this.GRID;i++){
        const cell = document.createElement('div');
        cell.className = 'pixel';
        cell.dataset.index = i;
        cell.style.background = '#ffffff';
        this.canvasEl.appendChild(cell);
      }
    }

    _pushHistory(){
      const snap = Array.from(this.canvasEl.children).map(c => c.style.background || '#ffffff');
      this.history.push(snap);
      if (this.history.length > this.maxHistory) this.history.shift();
      this._saveToLocal();
    }

    _undo(){
      if (!this.history.length) return;
      const arr = this.history.pop();
      Array.from(this.canvasEl.children).forEach((c, i) => c.style.background = arr[i] || '#ffffff');
      this._saveToLocal();
    }

    _clear(){
      this._pushHistory();
      Array.from(this.canvasEl.children).forEach(c => c.style.background = '#ffffff');
      this._saveToLocal();
    }

    _paint(target){
      if (!target || !target.classList.contains('pixel')) return;
      target.style.background = this.isEraser ? '#ffffff' : this.currentColor;
    }

    _bindEvents(){
      // color input
      if (this.colorPicker) {
        this.colorPicker.addEventListener('input', (e) => { this.currentColor = e.target.value; this.isEraser = false; this.eraserBtn?.classList.remove('active'); });
      }

      // eraser
      this.eraserBtn?.addEventListener('click', () => {
        this.isEraser = !this.isEraser;
        this.eraserBtn.classList.toggle('active', this.isEraser);
      });

      // undo/clear/save
      this.undoBtn?.addEventListener('click', ()=> this._undo());
      this.clearBtn?.addEventListener('click', ()=> this._clear());
      this.saveBtn?.addEventListener('click', ()=> this._savePNG());

      // pointer painting
      this.canvasEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const t = e.target;
        if (!t.classList.contains('pixel')) return;
        this._pushHistory();
        this.isDown = true;
        this._paint(t);
      });
      window.addEventListener('pointerup', ()=> this.isDown = false);

      this.canvasEl.addEventListener('pointermove', (e) => {
        if (!this.isDown) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.classList.contains('pixel')) this._paint(el);
      });

      // click paint (single)
      this.canvasEl.addEventListener('click', (e) => {
        const t = e.target;
        if (!t.classList.contains('pixel')) return;
        this._pushHistory();
        this._paint(t);
      });

      // keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
        if (e.key === 'c') { e.preventDefault(); this._clear(); }
        if (e.key === 's') { e.preventDefault(); this._savePNG(); }
      });
    }

    _saveToLocal(){
      try { localStorage.setItem('pixelStudioGrid_v1', JSON.stringify(Array.from(this.canvasEl.children).map(c => c.style.background))); }
      catch (e) {}
    }
    _loadFromLocal(){
      try {
        const raw = localStorage.getItem('pixelStudioGrid_v1');
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length !== this.GRID * this.GRID) return;
        Array.from(this.canvasEl.children).forEach((c, i) => c.style.background = arr[i] || '#ffffff');
      } catch (e) {}
    }

    _savePNG(){
      // draw small canvas of GRID x GRID and upscale to keep sharp edges
      const off = document.createElement('canvas');
      off.width = this.GRID;
      off.height = this.GRID;
      const ctx = off.getContext('2d');
      Array.from(this.canvasEl.children).forEach((c, i) => {
        const x = i % this.GRID;
        const y = Math.floor(i / this.GRID);
        ctx.fillStyle = window.getComputedStyle(c).backgroundColor || '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
      // upscale
      const scale = 16;
      const out = document.createElement('canvas');
      out.width = this.GRID * scale;
      out.height = this.GRID * scale;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = false;
      octx.drawImage(off, 0, 0, out.width, out.height);
      out.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel-art.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    }

    _render() {
      // not needed as we manipulate actual DOM cells directly
    }
  }

  // instantiate pixel studio after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // set year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    window.pixelStudio = new PixelStudio();
  });

})();
