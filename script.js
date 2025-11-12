// ==============================
// Smooth Scrolling for Anchors
// ==============================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// ==============================
// Reveal Animation on Scroll
// ==============================
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.18 });
reveals.forEach(r => revealObserver.observe(r));

// ==============================
// Dynamic Accent Switching
// ==============================
const sections = Array.from(document.querySelectorAll('.section'));
const root = document.documentElement;
const accentObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const accent = entry.target.dataset.accent || 'sky';
    const mapping = { sky: '--sky', ocean: '--ocean', grass: '--grass', sun: '--sun' };
    const varName = mapping[accent] || '--sky';
    const val = getComputedStyle(root).getPropertyValue(varName).trim();
    if (val) root.style.setProperty('--global-accent', val);
  });
}, { threshold: 0.4 });
sections.forEach(s => accentObserver.observe(s));

// ==============================
// Gentle Scroll-Based Color Drift
// ==============================
let scrollY = 0;
let lastScrollY = 0;
const aura = document.querySelector('.aura');

function updateDrift() {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const sc = docH > 0 ? scrollY / docH : 0;

  const x1 = 20 + sc * 8;
  const y1 = 10 + sc * 6;
  const x2 = 80 - sc * 5;
  const y2 = 80 - sc * 5;
  const x3 = 40 + sc * 6;
  const y3 = 70 - sc * 4;
  const x4 = 60 - sc * 4;
  const y4 = 20 + sc * 6;

  root.style.setProperty('--bg-pos-x', x1 + '%');
  root.style.setProperty('--bg-pos-y', y1 + '%');
  root.style.setProperty('--bg-pos-x2', x2 + '%');
  root.style.setProperty('--bg-pos-y2', y2 + '%');
  root.style.setProperty('--bg-pos-x3', x3 + '%');
  root.style.setProperty('--bg-pos-y3', y3 + '%');
  root.style.setProperty('--bg-pos-x4', x4 + '%');
  root.style.setProperty('--bg-pos-y4', y4 + '%');

  // soft parallax shift for the aura glow
  if (aura) {
    const translateY = sc * 80; // stronger ocean cloud float
    aura.style.transform = `translateX(-50%) translateY(${translateY}px)`;
  }
  requestAnimationFrame(updateDrift);
}

function onScroll() {
  scrollY = window.scrollY || document.documentElement.scrollTop;
}
window.addEventListener('scroll', onScroll, { passive: true });
requestAnimationFrame(updateDrift);

// ==============================
// Pixel Art 16x16 Drawing Studio
// ==============================
const GRID = 16;
const pixelCanvas = document.getElementById('pixelCanvas');
const colorPicker = document.getElementById('colorPicker');
const eraserBtn = document.getElementById('eraser');
const clearBtn = document.getElementById('clearCanvas');
const undoBtn = document.getElementById('undo');
const saveBtn = document.getElementById('saveImage');

let currentColor = colorPicker?.value || '#000000';
let isEraser = false;
let isMouseDown = false;
let history = [];

// Create grid
function createGrid() {
  if (!pixelCanvas) return;
  pixelCanvas.innerHTML = '';
  for (let i = 0; i < GRID * GRID; i++) {
    const cell = document.createElement('div');
    cell.className = 'pixel';
    cell.dataset.index = i;
    cell.style.background = '#ffffff';
    pixelCanvas.appendChild(cell);
  }
}
createGrid();

// Save history snapshot
function pushHistory() {
  const snapshot = Array.from(document.querySelectorAll('.pixel')).map(p => p.style.background || '#ffffff');
  history.push(snapshot);
  if (history.length > 50) history.shift();
}

// Undo last
function undo() {
  if (!history.length) return;
  const arr = history.pop();
  const cells = document.querySelectorAll('.pixel');
  cells.forEach((c, i) => c.style.background = arr[i] || '#ffffff');
}

// Paint a single cell
function paintCell(el) {
  if (!el || !el.classList.contains('pixel')) return;
  el.style.background = isEraser ? '#ffffff' : currentColor;
}

// Mouse events
pixelCanvas?.addEventListener('pointerdown', e => {
  e.preventDefault();
  const target = e.target;
  if (!target.classList.contains('pixel')) return;
  pushHistory();
  isMouseDown = true;
  paintCell(target);
});

window.addEventListener('pointerup', () => isMouseDown = false);

pixelCanvas?.addEventListener('pointermove', e => {
  if (!isMouseDown) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && el.classList.contains('pixel')) paintCell(el);
});

pixelCanvas?.addEventListener('click', e => {
  const target = e.target;
  if (!target.classList.contains('pixel')) return;
  pushHistory();
  paintCell(target);
});

// Controls
colorPicker?.addEventListener('input', e => {
  currentColor = e.target.value;
  isEraser = false;
  eraserBtn?.classList.remove('active');
});

eraserBtn?.addEventListener('click', () => {
  isEraser = !isEraser;
  eraserBtn?.classList.toggle('active', isEraser);
});

clearBtn?.addEventListener('click', () => {
  pushHistory();
  document.querySelectorAll('.pixel').forEach(p => p.style.background = '#ffffff');
});

undoBtn?.addEventListener('click', undo);

// Export PNG
saveBtn?.addEventListener('click', () => {
  const off = document.createElement('canvas');
  off.width = GRID;
  off.height = GRID;
  const ctx = off.getContext('2d');
  const cells = document.querySelectorAll('.pixel');
  cells.forEach((c, i) => {
    const x = i % GRID;
    const y = Math.floor(i / GRID);
    ctx.fillStyle = window.getComputedStyle(c).backgroundColor || '#ffffff';
    ctx.fillRect(x, y, 1, 1);
  });

  const scale = 16;
  const out = document.createElement('canvas');
  out.width = GRID * scale;
  out.height = GRID * scale;
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
});

// Keyboard Shortcuts
window.addEventListener('keydown', e => {
  if (e.key === 'c') {
    pushHistory();
    document.querySelectorAll('.pixel').forEach(p => p.style.background = '#ffffff');
  }
  if (e.key === 'z') undo();
  if (e.key === 's') saveBtn?.click();
});
