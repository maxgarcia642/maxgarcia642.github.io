/* script.js updated:
   - smooth scroll + nav highlight
   - reveal + accent management
   - gentle parallax (background positions + aura)
   - terminal fetch + fallback + copy (prepared for raw.githubusercontent.com)
   - posts carousel
   - pixel art 16x16 studio (color, eraser, undo, clear, save, localStorage)
*/

(() => {
  const root = document.documentElement;
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));

  /* smooth scroll anchors */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => target.querySelector('h1,h2,h3,button,input')?.focus?.(), 600);
    });
  });

  /* reveal and nav highlight */
  const sections = Array.from(document.querySelectorAll('section'));
  const navPills = Array.from(document.querySelectorAll('.nav-pill'));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        navPills.forEach(p => p.removeAttribute('aria-current'));
        const pill = document.querySelector(`.nav-pill[href="#${entry.target.id}"]`);
        if (pill) pill.setAttribute('aria-current', 'true');

        // accent management: use data-accent on section
        const accent = entry.target.dataset.accent || 'sky';
        const map = { sky: '--sky', ocean: '--ocean', grass: '--grass', sun: '--sun' };
        const varName = map[accent] || '--sky';
        const val = getComputedStyle(root).getPropertyValue(varName).trim();
        if (val) root.style.setProperty('--global-accent', val);
      }
    });
  }, { threshold: 0.22 });
  sections.forEach(s => revealObserver.observe(s));

  /* gentle parallax: update CSS background positions and aura */
  const aura = document.querySelector('.aura');
  function onScrollParallax(){
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const sc = docH > 0 ? window.scrollY / docH : 0;
    const x1 = 20 + sc * 6; const y1 = 10 + sc * 8;
    const x2 = 80 - sc * 6; const y2 = 20 - sc * 6;
    const x3 = 40 + sc * 4; const y3 = 85 - sc * 6;
    const x4 = 70 - sc * 3; const y4 = 70 - sc * 3;

    root.style.setProperty('--bg-pos-x', `${x1}%`);
    root.style.setProperty('--bg-pos-y', `${y1}%`);
    root.style.setProperty('--bg-pos-x2', `${x2}%`);
    root.style.setProperty('--bg-pos-y2', `${y2}%`);
    root.style.setProperty('--bg-pos-x3', `${x3}%`);
    root.style.setProperty('--bg-pos-y3', `${y3}%`);
    root.style.setProperty('--bg-pos-x4', `${x4}%`);
    root.style.setProperty('--bg-pos-y4', `${y4}%`);

    if (aura) {
      const translateY = sc * 40;
      aura.style.transform = `translateX(-50%) translateY(${translateY}px)`;
    }
  }
  window.addEventListener('scroll', onScrollParallax, { passive: true });
  onScrollParallax();

  /* simple pressed state */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (b) b.classList.add('pressed');
  });
  document.addEventListener('pointerup', (e) => $$('.btn.pressed').forEach(n => n.classList.remove('pressed')));

  /* TERMINALS: fetch raw code, fallback, minimal highlight, copy */
  const terminalCards = document.querySelectorAll('.terminal-card');
  const FALLBACK = {
    python: `# Example Python\n\ndef hello_world():\n    print("Hello, World!")\n\nhello_world()`,
    java: `// Example Java\n\npublic class HelloWorld {\n  public static void main(String[] args){\n    System.out.println("Hello, World!");\n  }\n}`,
    cpp: `// Example C++\n\n#include <iostream>\nint main(){\n  std::cout << "Hello, World!\\n";\n  return 0;\n}`,
    html: `<!-- Example HTML snippet -->\n<section>\n  <h1>Welcome</h1>\n</section>`
  };

  async function fetchWithTimeout(url, ms = 4500){
    try {
      const ctrl = new AbortController();
      const id = setTimeout(()=> ctrl.abort(), ms);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(id);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  }

  terminalCards.forEach(async card => {
    const codeEl = card.querySelector('code');
    const lang = codeEl?.dataset?.lang || 'text';
    const raw = card.dataset.raw || '';
    let content = null;
    if (raw) {
      // Prefer raw.githubusercontent.com links (no CORS on raw -> usually allowed). If embedding from repo page, use raw URL.
      content = await fetchWithTimeout(raw, 4500);
    }
    if (!content) content = FALLBACK[lang] || '// snippet unavailable';
    const esc = content.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

    // basic highlight
    if (lang === 'python') codeEl.innerHTML = esc.replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
    else if (lang === 'java' || lang === 'cpp') codeEl.innerHTML = esc.replace(/\b(public|static|void|class|new|return|if|else|for|while)\b/g, '<span class="kw">$1</span>');
    else codeEl.innerHTML = esc;

    const copyBtn = card.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(content); copyBtn.textContent = 'Copied!'; setTimeout(()=> copyBtn.textContent = 'Copy', 1400); }
      catch (err) { alert('Copy failed — clipboard may be restricted.'); }
    });
  });

  const tokStyle = document.createElement('style');
  tokStyle.textContent = `.kw{color:#ffd66b;font-weight:700}`;
  document.head.appendChild(tokStyle);

  /* posts carousel controls */
  (function(){
    const prev = document.querySelector('.carousel-btn.prev');
    const next = document.querySelector('.carousel-btn.next');
    const track = document.querySelector('.carousel-track');
    if (!track || !prev || !next) return;
    const items = Array.from(track.children);
    let index = 0;
    const gap = 16;
    function itemWidth(){ return items[0].getBoundingClientRect().width + gap; }
    function update(){ track.style.transform = `translateX(${-index * itemWidth()}px)`; }
    prev.addEventListener('click', ()=> { index = Math.max(0, index-1); update(); });
    next.addEventListener('click', ()=> { index = Math.min(items.length-1, index+1); update(); });
    window.addEventListener('resize', update);
  })();

  /* Pixel Art 16x16 Studio */
  class PixelStudio {
    constructor(){
      this.GRID = 16;
      this.canvasEl = document.getElementById('pixelCanvas');
      this.colorPicker = document.getElementById('color-picker');
      this.eraserBtn = document.getElementById('eraser-btn');
      this.undoBtn = document.getElementById('undo-btn');
      this.clearBtn = document.getElementById('clear-btn');
      this.saveBtn = document.getElementById('save-btn');

      this.currentColor = this.colorPicker?.value || '#000000';
      this.isEraser = false;
      this.isDown = false;
      this.history = [];

      this._makeGrid();
      this._bind();
      this._loadFromLocal();
    }

    _makeGrid(){
      this.canvasEl.innerHTML = '';
      for (let i=0;i<this.GRID*this.GRID;i++){
        const cell = document.createElement('div');
        cell.className = 'pixel';
        cell.dataset.index = i;
        cell.style.background = '#ffffff';
        this.canvasEl.appendChild(cell);
      }
    }

    _pushHistory(){
      const snapshot = Array.from(this.canvasEl.children).map(c => c.style.background || '#ffffff');
      this.history.push(snapshot);
      if (this.history.length > 60) this.history.shift();
      try { localStorage.setItem('pixelStudio_v1', JSON.stringify(snapshot)); } catch(e){}
    }

    _undo(){
      if (!this.history.length) return;
      const arr = this.history.pop();
      Array.from(this.canvasEl.children).forEach((c,i)=> c.style.background = arr[i] || '#ffffff');
      try { localStorage.setItem('pixelStudio_v1', JSON.stringify(arr)); } catch(e){}
    }

    _clear(){
      this._pushHistory();
      Array.from(this.canvasEl.children).forEach(c => c.style.background = '#ffffff');
      try { localStorage.removeItem('pixelStudio_v1'); } catch(e){}
    }

    _paint(target){
      if (!target || !target.classList.contains('pixel')) return;
      target.style.background = this.isEraser ? '#ffffff' : this.currentColor;
    }

    _bind(){
      if (this.colorPicker){
        this.colorPicker.addEventListener('input', (e)=> { this.currentColor = e.target.value; this.isEraser = false; this.eraserBtn?.classList.remove('active'); });
      }
      this.eraserBtn?.addEventListener('click', ()=> { this.isEraser = !this.isEraser; this.eraserBtn.classList.toggle('active', this.isEraser); });
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
      this.canvasEl.addEventListener('click', (e)=> {
        const t = e.target;
        if (!t.classList.contains('pixel')) return;
        this._pushHistory();
        this._paint(t);
      });

      // keyboard hotkeys
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
        if (e.key === 'c') { e.preventDefault(); this._clear(); }
        if (e.key === 's') { e.preventDefault(); this._savePNG(); }
      });
    }

    _savePNG(){
      const off = document.createElement('canvas');
      off.width = this.GRID; off.height = this.GRID;
      const ctx = off.getContext('2d');
      Array.from(this.canvasEl.children).forEach((c,i)=>{
        const x = i % this.GRID; const y = Math.floor(i / this.GRID);
        ctx.fillStyle = window.getComputedStyle(c).backgroundColor || '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
      const scale = 16;
      const out = document.createElement('canvas');
      out.width = this.GRID * scale; out.height = this.GRID * scale;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = false;
      octx.drawImage(off, 0, 0, out.width, out.height);
      out.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pixel-art.png';
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      }, 'image/png');
    }

    _loadFromLocal(){
      try {
        const raw = localStorage.getItem('pixelStudio_v1');
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length !== this.GRID*this.GRID) return;
        Array.from(this.canvasEl.children).forEach((c,i)=> c.style.background = arr[i] || '#ffffff');
      } catch(e){}
    }
  }

  /* initialize */
  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
    window.pixelStudio = new PixelStudio();
  });

})();
