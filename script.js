/* script.js
   - Smooth scrolling
   - IntersectionObserver reveal + active nav highlighting
   - Terminal snippet fetching + fallback + copy-to-clipboard + minimal highlight
   - Posts carousel simple controls
   - Pixel art game (16x16) with touch/mouse, eraser, undo (single step), clear, save PNG, localStorage
   - Accent management: sets --global-accent according to visible section (Frutiger Aero feel)
*/

/* ---------- Utility helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- Smooth scroll for nav and active link highlighting ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
    // update focus for accessibility
    setTimeout(() => { target.querySelector('h1, h2, h3, p')?.focus?.(); }, 600);
  });
});

/* IntersectionObserver to reveal sections & highlight nav pills */
const sections = Array.from(document.querySelectorAll('section'));
const navPills = Array.from(document.querySelectorAll('.nav-pill'));
const root = document.documentElement;

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id = entry.target.id;
    const pill = document.querySelector(`.nav-pill[href="#${id}"]`);
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
      navPills.forEach(p => p.removeAttribute('aria-current'));
      if (pill) pill.setAttribute('aria-current','true');

      // Accent override: pick the first .card inside this section and read its data-accent
      const card = entry.target.querySelector('.card');
      if (card && card.dataset.accent) {
        const accentName = card.dataset.accent;
        // try to read CSS var for that accent
        const varName = {
          'teal': '--accent-teal',
          'purple': '--accent-purple',
          'coral': '--accent-coral',
          'mint': '--accent-mint',
          'blue': '--accent-aqua'
        }[accentName] || '--accent-aqua';
        const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '';
        if (val) {
          root.style.setProperty('--global-accent', val);
        }
      }
    }
  });
}, {root: null, threshold: 0.18});

sections.forEach(s => io.observe(s));

/* ---------- Terminal snippet loader with fallback and copy ---------- */
const terminalCards = document.querySelectorAll('.terminal-card');

// Example fallback snippets (used when fetch fails or CORS blocks)
const FALLBACK_SNIPPETS = {
  python: `# Paste your Python code here from your GitHub repository.
def hello_world():
    print("Hello, World!")

hello_world()`,
  java: `// Paste your Java code here from your GitHub repository.
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `// Paste your C++ code here from your GitHub repository.
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  html: `<!-- This is a snippet from index.html -->
<section id="introduction">
    <h1>Welcome to My Website</h1>
    <p>This is your introduction paragraph.</p>
</section>`
};

// Try to fetch raw code with timeout; if fails, return null
async function fetchWithTimeout(url, ms = 4000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    const res = await fetch(url, {signal: controller.signal});
    clearTimeout(id);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch (e) {
    return null;
  }
}

// Very small syntax "highlight" by wrapping keywords with spans. Non-exhaustive.
function smallHighlight(code, lang) {
  if (!code) return '';
  // Escape HTML
  const esc = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  // simple rules
  if (lang === 'python') {
    return esc
      .replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
  }
  if (lang === 'java') {
    return esc
      .replace(/\b(public|static|void|class|new|return|if|else|for|while|System\.out\.println)\b/g, '<span class="kw">$1</span>');
  }
  if (lang === 'cpp') {
    return esc
      .replace(/\b(int|return|#include|std::cout|using|namespace|class|for|while)\b/g, '<span class="kw">$1</span>');
  }
  if (lang === 'html') {
    return esc
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comm">$1</span>')
      .replace(/(&lt;\/?[a-zA-Z0-9-:]+)(\s|&gt;)/g, '<span class="tag">$1</span>$2');
  }
  return esc;
}

// Attach actions for each terminal card
terminalCards.forEach(async card => {
  const codeEl = card.querySelector('code');
  const lang = codeEl.getAttribute('data-lang') || 'text';
  const rawUrl = card.dataset.raw || '';

  // Try to fetch; if fail, use fallback:
  let content = null;
  if (rawUrl) {
    content = await fetchWithTimeout(rawUrl, 3500);
  }
  if (!content) {
    content = FALLBACK_SNIPPETS[lang] || '// snippet unavailable';
  }

  // Render with minimal highlighting
  codeEl.innerHTML = smallHighlight(content, lang);

  // Copy button
  const copyBtn = card.querySelector('.copy-btn');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1500);
    } catch (e) {
      copyBtn.textContent = 'Copy';
      alert('Copy failed — your browser may restrict clipboard access.');
    }
  });
});

/* ---------- Minimal syntax CSS injected for tokens used in smallHighlight ---------- */
const style = document.createElement('style');
style.textContent = `
  .kw{color:#ffd66b;font-weight:700}
  .tag{color:#7fdcff}
  .comm{color:#9aa3bf;font-style:italic}
`;
document.head.appendChild(style);

/* ---------- Posts carousel controls ---------- */
(() => {
  const prev = $('.carousel-btn.prev');
  const next = $('.carousel-btn.next');
  const track = $('.carousel-track');
  if (!prev || !next || !track) return;

  let index = 0;
  const items = Array.from(track.children);
  const itemWidth = () => items[0].getBoundingClientRect().width + 12; // includes gap
  function update() {
    const w = itemWidth();
    track.style.transform = `translateX(${-index * w}px)`;
  }
  prev.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    update();
  });
  next.addEventListener('click', () => {
    index = Math.min(items.length - 1, index + 1);
    update();
  });
  window.addEventListener('resize', update);
})();

/* ---------- Pixel art game ---------- */
class PixelArt {
  constructor(opts = {}) {
    this.canvas = $('#pixelCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 16;
    this.canvasSize = this.canvas.width; // square (e.g., 320)
    this.pixelSize = this.canvasSize / this.gridSize;
    this.colorPicker = $('#color-picker');
    this.eraserBtn = $('#eraser-btn');
    this.clearBtn = $('#clear-btn');
    this.saveBtn = $('#save-btn');
    this.undoBtn = $('#undo-btn');

    // state
    this.color = this.colorPicker.value || '#000000';
    this.isEraser = false;
    this.grid = this._emptyGrid();
    this.history = []; // store last state for undo (single-step)
    this.localKey = 'pixelArtGrid_v1';

    // init
    this._bindEvents();
    this._loadFromLocal();
    this._render();
  }

  _emptyGrid() {
    return Array.from({length: this.gridSize}, () => Array(this.gridSize).fill('#FFFFFF'));
  }

  _bindEvents() {
    this.colorPicker.addEventListener('input', (e) => {
      this.color = e.target.value;
      this.isEraser = false;
      this.eraserBtn.classList.remove('active');
    });

    this.eraserBtn.addEventListener('click', () => {
      this.isEraser = !this.isEraser;
      this.eraserBtn.classList.toggle('active', this.isEraser);
    });

    this.clearBtn.addEventListener('click', () => {
      this._pushHistory(); // allow undo after clear
      this.grid = this._emptyGrid();
      this._saveToLocal();
      this._render();
    });

    this.undoBtn.addEventListener('click', () => {
      if (!this.history.length) return;
      this.grid = this.history.pop();
      this._saveToLocal();
      this._render();
    });

    this.saveBtn.addEventListener('click', () => this._savePNG());

    // Pointer events for mouse and touch (pointer API)
    let isDown = false;
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      const x = Math.floor(((clientX - rect.left) / rect.width) * this.gridSize);
      const y = Math.floor(((clientY - rect.top) / rect.height) * this.gridSize);
      return {x: Math.max(0, Math.min(this.gridSize - 1, x)), y: Math.max(0, Math.min(this.gridSize - 1, y))};
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isDown = true;
      this._pushHistory();
      const {x,y} = getPos(e);
      this._paintAt(x,y);
    });
    window.addEventListener('pointerup', () => isDown = false);
    this.canvas.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const {x,y} = getPos(e);
      this._paintAt(x,y);
    });

    // keyboard: c = clear, z = undo, s = save
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c') this.clearBtn.click();
      if (e.key === 'z') this.undoBtn.click();
      if (e.key === 's') this.saveBtn.click();
    });
  }

  _pushHistory() {
    // store a deep copy of grid (single-step undo)
    this.history.push(this.grid.map(row => row.slice()));
    // limit history length to 6 (avoid unbounded growth)
    if (this.history.length > 6) this.history.shift();
  }

  _paintAt(x, y) {
    if (this.isEraser) this.grid[y][x] = '#FFFFFF';
    else this.grid[y][x] = this.color;
    this._saveToLocal();
    this._render();
  }

  _render() {
    // clear
    this.ctx.clearRect(0,0,this.canvasSize,this.canvasSize);
    // draw pixels
    for (let r=0;r<this.gridSize;r++){
      for (let c=0;c<this.gridSize;c++){
        this.ctx.fillStyle = this.grid[r][c];
        this.ctx.fillRect(c * this.pixelSize, r * this.pixelSize, this.pixelSize, this.pixelSize);
      }
    }
    // grid lines (subtle)
    this.ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    this.ctx.lineWidth = 1;
    for (let i=0;i<=this.gridSize;i++){
      // vertical
      this.ctx.beginPath();
      this.ctx.moveTo(i*this.pixelSize + 0.5, 0);
      this.ctx.lineTo(i*this.pixelSize + 0.5, this.canvasSize);
      this.ctx.stroke();
      // horizontal
      this.ctx.beginPath();
      this.ctx.moveTo(0, i*this.pixelSize + 0.5);
      this.ctx.lineTo(this.canvasSize, i*this.pixelSize + 0.5);
      this.ctx.stroke();
    }
  }

  _saveToLocal() {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(this.grid));
    } catch (e) {
      console.warn('localStorage unavailable', e);
    }
  }

  _loadFromLocal() {
    try {
      const saved = localStorage.getItem(this.localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === this.gridSize) {
          this.grid = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load pixel grid', e);
    }
  }

  _savePNG() {
    // create a temporary canvas for high-res export if desired. For now export the displayed but with crisp pixels
    const exportCanvas = document.createElement('canvas');
    const scale = 16; // each pixel becomes 16x16 in PNG
    exportCanvas.width = this.gridSize * scale;
    exportCanvas.height = this.gridSize * scale;
    const ectx = exportCanvas.getContext('2d');

    // paint
    for (let r=0;r<this.gridSize;r++){
      for (let c=0;c<this.gridSize;c++){
        ectx.fillStyle = this.grid[r][c];
        ectx.fillRect(c*scale, r*scale, scale, scale);
      }
    }
    exportCanvas.toBlob(blob => {
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
}

document.addEventListener('DOMContentLoaded', () => {
  // instantiate pixel art
  window.pixelArt = new PixelArt();

  // initial reveal for any elements already on screen
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) el.classList.add('in-view');
  });

  // Accessibility: enable arrow-key navigation for carousel
  const carousel = document.querySelector('.posts-carousel');
  if (carousel) {
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') $('.carousel-btn.prev').click();
      if (e.key === 'ArrowRight') $('.carousel-btn.next').click();
    });
  }

  // Optional accent cycling (commented by default). If you prefer continuous cycling, uncomment.
  /*
  (function cycleAccent(){
    const colors = ['#37C9FF','#00B7A5','#8A7AFE','#FF8A80','#7AF6D6'];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % colors.length;
      root.style.setProperty('--global-accent', colors[i]);
    }, 6000);
  })();
  */
});
