// Smooth scrolling for navigation links: This adds a click event to all internal links starting with #.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevents default jump behavior.
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth' // Enables smooth scrolling to the section.
        });
    });
});

// Utilities Functions: Fetch data for weather, flights, news.
async function fetchWeather() {
    const city = document.getElementById('city-input').value || 'New York';
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error('City not found');
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        document.getElementById('weather-result').innerText = `Current in ${city}: ${weatherData.current_weather.temperature}°C, ${weatherData.current_weather.weathercode} (Wind: ${weatherData.current_weather.windspeed} km/h)`;
    } catch (err) {
        document.getElementById('weather-result').innerText = `Error: ${err.message}`;
    }
}

async function fetchFlights() {
    const airport = document.getElementById('airport-input').value || 'KJFK';
    try {
        const res = await fetch(`https://opensky-network.org/api/flights/arrival?airport=${airport}&begin=${Math.floor(Date.now()/1000 - 3600)}&end=${Math.floor(Date.now()/1000)}`);
        const data = await res.json();
        if (!data.length) throw new Error('No recent flights');
        document.getElementById('flights-result').innerText = `Recent arrival: Flight ${data[0].estDepartureAirport} to ${airport} (Callsign: ${data[0].callsign || 'N/A'})`;
    } catch (err) {
        document.getElementById('flights-result').innerText = `Error: ${err.message} (Limited free API)`;
    }
}

async function fetchNews() {
    try {
        const res = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=your-free-newsapi-key'); // Get free key at newsapi.org
        const data = await res.json();
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        data.articles.slice(0, 5).forEach(article => {
            const li = document.createElement('li');
            li.innerText = article.title;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('News fetch error:', err);
    }
}

// Load news on page load
document.addEventListener('DOMContentLoaded', fetchNews);

// Game logic remains unchanged...
// Block class: Defines a single block with position, size, and color.
class Block {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 40; // Block width in pixels.
        this.height = 40; // Block height in pixels.
        this.color = color; // Color of the block.
    }
    // Draw method: Renders the block on the canvas with fill and border.
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    // Checks if a mouse click is within this block's bounds.
    isClicked(mouseX, mouseY) {
        return (
            mouseX >= this.x &&
            mouseX <= this.x + this.width &&
            mouseY >= this.y &&
            mouseY <= this.y + this.height
        );
    }
}
// Main game class: Manages the canvas, blocks, and interactions.
class MinecraftClone {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); // Gets the canvas element.
        this.ctx = this.canvas.getContext('2d'); // 2D drawing context.
        this.blocks = []; // Array to hold all blocks.
        this.blockColors = ['#8B4513', '#228B22', '#90EE90', '#FFFFFF']; // Colors: brown (dirt), dark green (grass), light green, white.
        this.currentColorIndex = 0; // Tracks current block color for placement.
        this.setupEventListeners(); // Sets up click events.
        this.generateInitialTerrain(); // Creates starting blocks.
    }
    // Generates initial ground and random blocks.
    generateInitialTerrain() {
        // Create ground layer: Adds grass blocks at the bottom.
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.blocks.push(new Block(x, this.canvas.height - 40, '#228B22'));
        }
        // Add some random blocks above ground.
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * (this.canvas.width / 40)) * 40; // Snaps to grid.
            const y = Math.floor(Math.random() * (this.canvas.height / 40 - 2)) * 40;
            this.blocks.push(new Block(x, y, this.blockColors[Math.floor(Math.random() * this.blockColors.length)]));
        }
        this.render(); // Draws everything.
    }
    // Sets up click listener on canvas.
    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect(); // Gets canvas position on page.
            const mouseX = event.clientX - rect.left; // Calculates mouse X relative to canvas.
            const mouseY = event.clientY - rect.top; // Calculates mouse Y.
            // Find if a block was clicked to remove it.
            const clickedBlockIndex = this.blocks.findIndex(block => block.isClicked(mouseX, mouseY));
           
            if (clickedBlockIndex !== -1) {
                this.blocks.splice(clickedBlockIndex, 1); // Removes the block.
            } else {
                // Place a new block at the clicked grid position.
                const newBlock = new Block(
                    Math.floor(mouseX / 40) * 40,
                    Math.floor(mouseY / 40) * 40,
                    this.blockColors[this.currentColorIndex]
                );
                this.blocks.push(newBlock);
            }
            // Cycle to the next color for the next placement.
            this.currentColorIndex = (this.currentColorIndex + 1) % this.blockColors.length;
           
            this.render(); // Redraws the canvas.
        });
    }
    // Render method: Clears and redraws all blocks.
    render() {
        // Clear canvas to prevent overlapping draws.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw each block.
        this.blocks.forEach(block => block.draw(this.ctx));
    }
}
// Initialize the game when the page loads: Waits for DOM to be ready.
document.addEventListener('DOMContentLoaded', () => {
    new MinecraftClone();
});
