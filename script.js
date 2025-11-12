/* script.js
   - Smooth scrolling
   - IntersectionObserver reveal + active nav highlighting
   - Terminal snippet fetching + fallback + copy-to-clipboard + minimal highlight
   - Posts carousel simple controls
   - Pixel art game (16x16) with touch/mouse, eraser, undo (single step), clear, save PNG, localStorage
   - Accent management + subtle aura parallax (improves "flow" as you scroll)
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

/* ---------- IntersectionObserver to reveal sections & highlight nav pills ---------- */
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

function smallHighlight(code, lang) {
  if (!code) return '';
  const esc = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  if (lang === 'python') {
    return esc.replace(/\b(def|return|if|else|elif|for|while|import|from|class|print)\b/g, '<span class="kw">$1</span>');
  }
  if (lang === 'java') {
    return esc.replace(/\b(public|static|void|class|new|return|if|else|for|while|System\.out\.println)\b/g, '<span class="kw">$1</span>');
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
  const lang = codeEl.getAttribute('data-lang') || 'text';
  const rawUrl = card.dataset.raw || '';

  let content = null;
  if (rawUrl) {
    content = await fetchWithTimeout(rawUrl, 3500);
  }
  if (!content) {
    content = FALLBACK_SNIPPETS[lang] || '// snippet unavailable';
  }

  codeEl.innerHTML = smallHighlight(content, lang);

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

const style = document.createElement('style');
style.textContent = `
  .kw{color:#ffd66b;font-weight:700}
  .tag{color:#7fdcff}
  .comm{color:#9aa3bf;font-style:italic}
`;
document.head.appendChild(style);

/* ---------- Posts carousel ---------- */
(() => {
  const prev = $('.carousel-btn.prev');
  const next = $('.carousel-btn.next');
  const track = $('.carousel-track');
  if (!prev || !next || !track) return;

  let index = 0;
  const items = Array.from(track.children);
  const itemWidth = () => items[0].getBoundingClientRect().width + 12;
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

/* ---------- Pixel art game (unchanged) ---------- */
/* ... (same pixelArt class code as before) ... */

/* For brevity: instantiate pixel art and other DOM-ready behaviors (same as earlier) */
class PixelArt { /* same implementation as previous file */ }
/* You should paste your original PixelArt class implementation here exactly as before. */
/* If you want, I can paste the entire script including PixelArt verbatim; I omitted it here to keep focus on the aura patch. */

/* ---------- DOMContentLoaded: instantiate & aura parallax ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // instantiate pixel art (if PixelArt class included above)
  try { window.pixelArt = new PixelArt(); } catch(e){ /* PixelArt must be present */ }

  // initial reveal for any elements already on screen
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) el.classList.add('in-view');
  });

  // carousel keyboard nav
  const carousel = document.querySelector('.posts-carousel');
  if (carousel) {
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') $('.carousel-btn.prev').click();
      if (e.key === 'ArrowRight') $('.carousel-btn.next').click();
    });
  }

  // ---------- Aura parallax (efficient, rAF-based) ----------
  const aura = document.querySelector('.aura');
  if (aura) {
    let lastScroll = window.scrollY;
    let ticking = false;
    function onScroll() {
      lastScroll = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // mild offset so aura moves slower than content (parallax)
          const offset = Math.round(lastScroll * 0.06); // tweak factor for speed
          aura.style.transform = `translateX(-50%) translateY(${-offset}px)`;
          // slightly lower opacity as user scrolls down, for depth
          const newOpacity = Math.max(0.28, 0.65 - (lastScroll / 2000));
          aura.style.opacity = newOpacity.toFixed(2);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    // initialize
    onScroll();
  }

  // Optional accent cycling (commented)
  /*
  (function cycleAccent(){
    const colors = ['#1098ba','#000bbe','#308a11','#e9ebe3'];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % colors.length;
      root.style.setProperty('--global-accent', colors[i]);
    }, 6000);
  })();
  */
});
