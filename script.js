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
async function fetchGeodata() {
    const city = document.getElementById('geo-city').value || 'New York';
    const startAddr = document.getElementById('start-addr').value || '123 Main St, New York, NY';
    const endAddr = document.getElementById('end-addr').value || '456 Elm St, Brooklyn, NY';
    const mode = document.getElementById('trans-mode').value;
    const geoApiKey = 'YOUR_GEOAPIFY_KEY';

    const now = new Date().toLocaleString();
    document.getElementById('geo-time').innerText = `Current Time: ${now}`;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`);
        const weatherData = await weatherRes.json();
        document.getElementById('geo-weather').innerText = `Current: ${weatherData.current_weather.temperature}°C. Forecast: Tomorrow Max ${weatherData.daily.temperature_2m_max[1]}°C, Precip ${weatherData.daily.precipitation_probability_max[1]}%.`;
    } catch (err) {
        document.getElementById('geo-weather').innerText = `Error: ${err.message}`;
    }

    try {
        if (mode === 'flight') {
            const airport = startAddr.split(',')[0].trim().toUpperCase() || 'KJFK';
            const res = await fetch(`https://opensky-network.org/api/flights/arrival?airport=${airport}&begin=${Math.floor(Date.now()/1000 - 3600)}&end=${Math.floor(Date.now()/1000)}`);
            const data = await res.json();
            if (!data.length) throw new Error('No recent flights');
            document.getElementById('geo-trans').innerText = `Recent arrival: From ${data[0].estDepartureAirport} (Callsign: ${data[0].callsign || 'N/A'})`;
        } else {
            const res = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(startAddr)}|${encodeURIComponent(endAddr)}&mode=${mode}&traffic=approximated&apiKey=${geoApiKey}`);
            const data = await res.json();
            if (!data.features || data.features.length === 0) throw new Error('No route found');
            const dist = (data.features[0].properties.distance / 1000).toFixed(1);
            const time = (data.features[0].properties.time / 60).toFixed(1);
            const traffic = data.features[0].properties.traffic || 'moderate';
            document.getElementById('geo-trans').innerText = `${mode} Route: ${dist} km, ~${time} mins (Traffic: ${traffic})`;
        }
    } catch (err) {
        document.getElementById('geo-trans').innerText = `Error: ${err.message} (Check addresses/mode)`;
    }
}

async function fetchNews() {
    const country = document.getElementById('country-select').value || 'us';
    const apiKey = 'YOUR_NEWSAPI_KEY';
    try {
        const res = await fetch(`https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`);
        const data = await res.json();
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        if (!data.articles || data.articles.length === 0) {
            list.innerHTML = '<li>No headlines found – check key or try another country.</li>';
            return;
        }
        data.articles.slice(0, 5).forEach(article => {
            const li = document.createElement('li');
            li.innerText = article.title;
            list.appendChild(li);
        });
    } catch (err) {
        document.getElementById('news-list').innerHTML = '<li>Error: ${err.message} (Check API key)</li>';
    }
}

async function convertInvestment() {
    const fromType = document.getElementById('from-type').value;
    const fromAsset = document.getElementById('from-asset').value;
    const fromAmount = parseFloat(document.getElementById('from-amount').value) || 1;
    const toType = document.getElementById('to-type').value;
    const toAsset = document.getElementById('to-asset').value;

    let fromUsd = fromAmount;
    let toUsdRate = 1;
    let fromDesc = '';
    let toDesc = '';

    try {
        if (fromType === 'stock') {
            const apiKey = 'YOUR_POLYGON_KEY';
            const res = await fetch(`https://api.polygon.io/v2/last/stocks/${fromAsset}?apiKey=${apiKey}`);
            const data = await res.json();
            fromUsd = data.results.P * fromAmount;
            fromDesc = `${fromAsset} stock at $${data.results.P}`;
        } else if (fromType === 'crypto') {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromAsset.toLowerCase()}&vs_currencies=usd`);
            const data = await res.json();
            fromUsd = data[fromAsset.toLowerCase()].usd * fromAmount;
            fromDesc = `${fromAsset} crypto at $${data[fromAsset.toLowerCase()].usd}`;
        } else if (fromType === 'currency') {
            const res = await fetch(`https://api.exchangerate.host/convert?from=${fromAsset}&to=USD&amount=${fromAmount}`);
            const data = await res.json();
            fromUsd = data.result;
            fromDesc = `${fromAmount} ${fromAsset} currency to USD`;
        }

        if (toType === 'stock') {
            const apiKey = 'YOUR_POLYGON_KEY';
            const res = await fetch(`https://api.polygon.io/v2/last/stocks/${toAsset}?apiKey=${apiKey}`);
            const data = await res.json();
            toUsdRate = data.results.P;
            toDesc = `${toAsset} stock at $${data.results.P}`;
        } else if (toType === 'crypto') {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${toAsset.toLowerCase()}&vs_currencies=usd`);
            const data = await res.json();
            toUsdRate = data[toAsset.toLowerCase()].usd;
            toDesc = `${toAsset} crypto at $${data[toAsset.toLowerCase()].usd}`;
        } else if (toType === 'currency') {
            const res = await fetch(`https://api.exchangerate.host/convert?from=USD&to=${toAsset}&amount=1`);
            const data = await res.json();
            toUsdRate = 1 / data.result;
            toDesc = `${toAsset} currency from USD`;
        }

        const converted = (fromUsd / toUsdRate).toFixed(4);
        document.getElementById('investment-result').innerText = `${fromAmount} ${fromAsset} (${fromType}) ≈ ${converted} ${toAsset} (${toType}).`;
        document.getElementById('from-desc').innerText = `From: ${fromDesc}`;
        document.getElementById('to-desc').innerText = `To: ${toDesc}`;
    } catch (err) {
        document.getElementById('investment-result').innerText = `Error: ${err.message}`;
    }
}

function analyzeEcofuel() {
    const useCase = document.getElementById('use-case').value;
    const sources = [
        {source: 'Electric', eff: 90},
        {source: 'Solar', eff: 20},
        {source: 'Biofuels', eff: 40},
        {source: 'Hydro', eff: 90},
        {source: 'Wind', eff: 40},
        {source: 'Gas', eff: 25},
        {source: 'Oil', eff: 20},
        {source: 'Nuclear', eff: 33}
    ];
    sources.sort((a, b) => b.eff - a.eff);
    const list = document.getElementById('ecofuel-result');
    list.innerHTML = '';
    sources.forEach(source => {
        const li = document.createElement('li');
        li.innerText = `${source.source}: ${source.eff}% efficiency for ${useCase}`;
        list.appendChild(li);
    });
}

// Game logic for Pixel Art Drawing Game
class PixelArt {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 16;
        this.pixelSize = this.canvas.width / this.gridSize;
        this.color = document.getElementById('color-picker').value;
        this.grid = Array.from({length: this.gridSize}, () => Array(this.gridSize).fill('#FFFFFF'));
        this.loadFromLocal();
        document.getElementById('color-picker').addEventListener('input', (e) => this.color = e.target.value);
        this.canvas.addEventListener('click', (e) => this.paint(e));
        this.render();
    }
    paint(event) {
        const rect = this.canvas.getBoundingClientRect();
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
let pixelArt;
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

document.addEventListener('DOMContentLoaded', () => {
    pixelArt = new PixelArt();
});
