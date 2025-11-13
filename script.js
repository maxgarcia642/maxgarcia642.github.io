/* script.js - interactions for portfolio
   - reveal on scroll
   - terminal snippet fetch + fallback + copy
   - posts carousel (horizontal)
   - pixel art 16x16 editor (div grid): color, eraser, undo, clear, save
   - gentle background drift on scroll
*/
/* ---------- Utilities ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
/* ---------- Smooth scroll for nav links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
    // small focus for a11y
    setTimeout(() => { target.querySelector('h1,h2,h3,p')?.focus?.(); }, 400);
  });
});
/* ---------- Reveal sections ---------- */
const reveals = Array.from(document.querySelectorAll('.reveal'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, { threshold: 0.16 });
reveals.forEach(r => revealObserver.observe(r));
/* ---------- Terminals: fetch raw content or fallback ---------- */
const terminalCards = Array.from(document.querySelectorAll('.terminal-card'));
const FALLBACK = {
  python: `# Example Python (fallback)
def hello_world():
    print("Hello, World!")
hello_world()`,
  java: `// Example Java (fallback)
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}`,
  cpp: `// Example C++ (fallback)
#include <iostream>
int main(){
  std::cout << "Hello, world!" << std::endl;
  return 0;
}`,
  html: `<!-- Example HTML (fallback) -->
<section><h1>Welcome</h1><p>Example snippet.</p></section>`,
  js: `// Example JS (fallback)
console.log('Hello, world!');`,
  css: `/* Example CSS (fallback) */
body { font-family: sans-serif; }`
};
async function fetchWithTimeout(url, ms = 4000) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch (e) {
    return null;
  }
}
function tinyHighlight(code, lang) {
  if (!code) return '';
  const esc = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  if (lang === 'python') return esc.replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
  if (lang === 'java') return esc.replace(/\b(public|static|void|class|new|return|if|else|for|while|System\.out\.println)\b/g, '<span class="kw">$1</span>');
  if (lang === 'cpp') return esc.replace(/\b(int|return|#include|std::cout|using|namespace|class|for|while)\b/g, '<span class="kw">$1</span>');
  if (lang === 'html') return esc.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comm">$1</span>').replace(/(&lt;\/?[a-zA-Z0-9-:]+)(\s|&gt;)/g, '<span class="tag">$1</span>$2');
  if (lang === 'js') return esc.replace(/\b(function|return|var|let|const|if|else|for|while|console\.log)\b/g, '<span class="kw">$1</span>');
  if (lang === 'css') return esc.replace(/([.#]?[a-zA-Z0-9\-_]+)(\s*\{)/g, '<span class="tag">$1</span>$2');
  return esc;
}
terminalCards.forEach(async card => {
  const codeEl = card.querySelector('code');
  const lang = codeEl.getAttribute('data-lang') || 'text';
  const raw = card.dataset.raw || '';
  let content = null;
  if (raw) {
    content = await fetchWithTimeout(raw, 3500);
  }
  if (!content) {
    content = FALLBACK[lang] || FALLBACK['html'];
  }
  codeEl.innerHTML = tinyHighlight(content, lang);
  // Add copy button if not present
  let copyBtn = card.querySelector('.copy-btn');
  if (!copyBtn) {
    copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    card.querySelector('.term-header')?.appendChild(copyBtn);
  }
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1400);
    } catch (e) {
      alert('Copy failed — check clipboard permissions.');
    }
  });
});
/* ---------- Posts carousel (horizontal) ---------- */
(() => {
  const prev = $('.carousel-btn.prev'), next = $('.carousel-btn.next'), track = $('.carousel-track');
  if (!track) return;
  const items = Array.from(track.children);
  let idx = 0;
  const itemWidth = () => items[0].getBoundingClientRect().width + 16;
  function update() {
    track.style.transform = `translateX(${-idx * itemWidth()}px)`;
  }
  prev.addEventListener('click', () => { idx = Math.max(0, idx - 1); update(); });
  next.addEventListener('click', () => { idx = Math.min(items.length - 1, idx + 1); update(); });
  window.addEventListener('resize', update);
})();
/* ---------- Pixel Art 16x16 (div-grid) ---------- */
class PixelStudio {
  constructor() {
    this.GRID = 16;
    this.gridEl = document.getElementById('pixelCanvas');
    this.colorPicker = document.getElementById('colorPicker');
    this.eraserBtn = document.getElementById('eraser');
    this.clearBtn = document.getElementById('clearCanvas');
    this.undoBtn = document.getElementById('undo');
    this.saveBtn = document.getElementById('saveImage');
    this.currentColor = this.colorPicker?.value || '#000000';
    this.isEraser = false;
    this.isDown = false;
    this.history = [];
    this._createGrid();
    this._bind();
  }
  _createGrid() {
    this.gridEl.innerHTML = '';
    for (let i = 0; i < this.GRID * this.GRID; i++) {
      const cell = document.createElement('div');
      cell.className = 'pixel';
      cell.dataset.index = i;
      cell.style.background = '#ffffff';
      this.gridEl.appendChild(cell);
    }
  }
  _pushHistory() {
    const snap = Array.from(this.gridEl.children).map(c => c.style.background || '#ffffff');
    this.history.push(snap);
    if (this.history.length > 60) this.history.shift();
  }
  _undo() {
    if (!this.history.length) return;
    const arr = this.history.pop();
    Array.from(this.gridEl.children).forEach((c, i) => c.style.background = arr[i] || '#ffffff');
  }
  _bind() {
    const cells = this.gridEl;
    // pointer painting
    cells.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (!t.classList.contains('pixel')) return;
      this._pushHistory();
      this.isDown = true;
      this._paint(t);
    });
    window.addEventListener('pointerup', () => this.isDown = false);
    cells.addEventListener('pointermove', (e) => {
      if (!this.isDown) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.classList.contains('pixel')) this._paint(el);
    });
    // click
    cells.addEventListener('click', (e) => {
      const t = e.target;
      if (!t.classList.contains('pixel')) return;
      this._pushHistory();
      this._paint(t);
    });
    // controls
    this.colorPicker?.addEventListener('input', (e) => {
      this.currentColor = e.target.value;
      this.isEraser = false;
      this.eraserBtn.classList.remove('active');
    });
    this.eraserBtn?.addEventListener('click', () => {
      this.isEraser = !this.isEraser;
      this.eraserBtn.classList.toggle('active', this.isEraser);
    });
    this.clearBtn?.addEventListener('click', () => {
      this._pushHistory();
      Array.from(this.gridEl.children).forEach(c => c.style.background = '#ffffff');
    });
    this.undoBtn?.addEventListener('click', () => this._undo());
    this.saveBtn?.addEventListener('click', () => this._savePNG());
    // keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c') { this._pushHistory(); Array.from(this.gridEl.children).forEach(c => c.style.background = '#ffffff'); }
      if (e.key === 'z') this._undo();
      if (e.key === 's') this._savePNG();
    });
  }
  _paint(cell) {
    cell.style.background = this.isEraser ? '#ffffff' : this.currentColor;
  }
  _savePNG() {
    // make tiny canvas, paint each pixel, upscale
    const off = document.createElement('canvas');
    off.width = this.GRID; off.height = this.GRID;
    const ctx = off.getContext('2d');
    const cells = Array.from(this.gridEl.children);
    cells.forEach((c, i) => {
      const x = i % this.GRID;
      const y = Math.floor(i / this.GRID);
      ctx.fillStyle = window.getComputedStyle(c).backgroundColor || '#ffffff';
      ctx.fillRect(x, y, 1, 1);
    });
    const scale = 16;
    const out = document.createElement('canvas');
    out.width = this.GRID * scale; out.height = this.GRID * scale;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(off, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'pixel-art.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
}
/* ---------- Gentle scroll-based drift (subtle) ---------- */
function onScrollDrift() {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const sc = docH > 0 ? window.scrollY / docH : 0;
  const drift1 = 30 + sc * 6;
  const drift2 = 70 - sc * 6;
  const drift3 = 40 + sc * 4;
  document.body.style.backgroundPosition = `${drift1}% ${15 + sc * 6}%, ${drift2}% ${80 - sc * 6}%, ${drift3}% ${65 - sc * 4}%`;
}
window.addEventListener('scroll', onScrollDrift, { passive: true });
onScrollDrift();
/* ---------- Init on DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // reveal already visible
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.86) el.classList.add('in-view');
  });
  // start pixel studio
  window.pixelStudio = new PixelStudio();
});
