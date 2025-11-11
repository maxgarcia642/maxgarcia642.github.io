// Smooth scrolling for navigation links: This adds a click event to all internal links starting with #.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevents default jump behavior.
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth' // Enables smooth scrolling to the section.
        });
    });
});
// Game logic for Pixel Art Drawing Game.
class PixelArt {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 16;
        this.pixelSize = this.canvas.width / this.gridSize;
        this.color = '#000000';
        this.grid = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill('#FFFFFF'));
        this.loadFromLocal();
        document.getElementById('color-picker').addEventListener('input', (e) => this.color = e.target.value);
        this.canvas.addEventListener('click', (e) => this.paint(e));
        this.render();
    }
    paint(event) {
        const rect = this.canvas.getBoundingRect();
        const x = Math.floor((event.clientX - rect.left) / this.pixelSize);
        const y = Math.floor((event.clientY - rect.top) / this.pixelSize);
        this.grid[y][x] = this.color;
        this.saveToLocal();
        this.render();
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.ctx.fillStyle = this.grid[y][x];
                this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
                this.ctx.strokeStyle = 'black';
                this.ctx.strokeRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
            }
        }
    }
    saveToLocal() {
        localStorage.setItem('pixelArt', JSON.stringify(this.grid));
    }
    loadFromLocal() {
        const saved = localStorage.getItem('pixelArt');
        if (saved) this.grid = JSON.parse(saved);
    }
}
// Initialize the game when the page loads: Waits for DOM to be ready.
document.addEventListener('DOMContentLoaded', () => {
    new PixelArt();
});
function clearCanvas() {
    pixelArt.grid = Array.from({length: 16}, () => Array(16).fill('#FFFFFF'));
    pixelArt.saveToLocal();
    pixelArt.render();
}
function saveDrawing() {
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = pixelArt.canvas.toDataURL('image/png');
    link.click();
}
