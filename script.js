/* smooth scroll reveal */
const reveals = document.querySelectorAll(".reveal");
window.addEventListener("scroll", () => {
  for (let el of reveals) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) el.classList.add("visible");
  }
});

/* dynamic accent glow (based on data-accent) */
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll(".section");
  let accent = "--sky-blue";
  for (let s of sections) {
    const rect = s.getBoundingClientRect();
    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
      accent = s.dataset.accent;
      break;
    }
  }
  document.documentElement.style.setProperty("--global-accent", `var(--${accent})`);
});

/* --- PIXEL ART GAME --- */
const canvas = document.getElementById("pixelCanvas");
const colorPicker = document.getElementById("colorPicker");
const eraserBtn = document.getElementById("eraser");
const clearBtn = document.getElementById("clearCanvas");
const saveBtn = document.getElementById("saveImage");

let currentColor = colorPicker.value;
let erasing = false;

for (let i = 0; i < 256; i++) {
  const pixel = document.createElement("div");
  pixel.classList.add("pixel");
  canvas.appendChild(pixel);
}

colorPicker.addEventListener("input", e => {
  currentColor = e.target.value;
  erasing = false;
  eraserBtn.classList.remove("active");
});

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.classList.toggle("active", erasing);
});

clearBtn.addEventListener("click", () => {
  document.querySelectorAll(".pixel").forEach(p => (p.style.background = "white"));
});

canvas.addEventListener("mousedown", e => {
  if (e.target.classList.contains("pixel")) {
    drawPixel(e.target);
    canvas.addEventListener("mouseover", paintDrag);
  }
});
window.addEventListener("mouseup", () => {
  canvas.removeEventListener("mouseover", paintDrag);
});
function paintDrag(e) {
  if (e.target.classList.contains("pixel")) drawPixel(e.target);
}
function drawPixel(pixel) {
  pixel.style.background = erasing ? "white" : currentColor;
}

saveBtn.addEventListener("click", () => {
  const size = 16;
  const offCanvas = document.createElement("canvas");
  offCanvas.width = size;
  offCanvas.height = size;
  const ctx = offCanvas.getContext("2d");
  const pixels = document.querySelectorAll(".pixel");
  pixels.forEach((p, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    const color = window.getComputedStyle(p).backgroundColor;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = offCanvas.toDataURL();
  link.click();
});
