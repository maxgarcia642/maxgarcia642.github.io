// Smooth scrolling for navigation links: This adds a click event to all internal links starting with #.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevents default jump behavior.
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth' // Enables smooth scrolling to the section.
        });
    });
});

// Utilities Functions
async function fetchGeodata() {
    const city = document.getElementById('geo-city').value || 'New York';
    const start = document.getElementById('start-loc').value || '40.7128,-74.0060';
    const end = document.getElementById('end-loc').value || '40.730610,-73.935242';
    const mode = document.getElementById('trans-mode').value;
    const geoApiKey = 'YOUR_GEOAPIFY_KEY'; // Signup free at geoapify.com

    // Time
    const now = new Date().toLocaleString();
    document.getElementById('geo-time').innerText = `Current Time: ${now}`;

    // Weather
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error('City not found');
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max`);
        const weatherData = await weatherRes.json();
        document.getElementById('geo-weather').innerText = `Weather in ${city}: Current ${weatherData.current_weather.temperature}°C, Wind ${weatherData.current_weather.windspeed} km/h. Patterns: Avg Max Temp ${weatherData.daily.temperature_2m_max[0]}°C, Min ${weatherData.daily.temperature_2m_min[0]}°C.`;
    } catch (err) {
        document.getElementById('geo-weather').innerText = `Weather Error: ${err.message}`;
    }

    // Transportation
    try {
        if (mode === 'flight') {
            const airport = document.getElementById('start-loc').value || 'KJFK';
            const res = await fetch(`https://opensky-network.org/api/flights/arrival?airport=${airport}&begin=${Math.floor(Date.now()/1000 - 3600)}&end=${Math.floor(Date.now()/1000)}`);
            const data = await res.json();
            document.getElementById('geo-trans').innerText = data.length ? `Recent Flight: From ${data[0].estDepartureAirport} (Callsign: ${data[0].callsign})` : 'No recent flights';
        } else {
            const res = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${start}|${end}&mode=${mode}&traffic=approximated&apiKey=${geoApiKey}`);
            const data = await res.json();
            const dist = (data.features[0].properties.distance / 1000).toFixed(1);
            const time = (data.features[0].properties.time / 60).toFixed(1);
            document.getElementById('geo-trans').innerText = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Route: ${dist} km, ~${time} mins (with traffic).`;
        }
    } catch (err) {
        document.getElementById('geo-trans').innerText = `Trans Error: ${err.message}`;
    }
}

async function convertInvestment() {
    const fromType = document.getElementById('from-type').value;
    const fromAsset = document.getElementById('from-asset').value;
    const fromValue = parseFloat(document.getElementById('from-value').value) || 1;
    const toType = document.getElementById('to-type').value;
    const toAsset = document.getElementById('to-asset').value;
    let fromUsd = fromValue;
    let toUsdRate = 1;
    let fromDesc = '';
    let toDesc = '';

    try {
        // Fetch descriptions
        if (fromType === 'art') {
            const searchRes = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?q=${fromAsset}`);
            const searchData = await searchRes.json();
            if (searchData.objectIDs[0]) {
                const objRes = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${searchData.objectIDs[0]}`);
                const objData = await objRes.json();
                fromDesc = `${objData.title} by ${objData.artistDisplayName || 'Unknown'}: ${objData.objectDate || ''}, ${objData.medium || ''}.`;
            }
        } else if (fromType === 'realestate') {
            const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=Real estate in ${fromAsset}`);
            const wikiData = await wikiRes.json();
            const page = Object.values(wikiData.query.pages)[0];
            fromDesc = page.extract ? page.extract.slice(0, 200) + '...' : 'No description found.';
        } // Similar for toDesc...

        if (toType === 'art' || toType === 'realestate') {
            // Similar fetch for toDesc
            // Assume toUsdRate based on user input or average; here placeholder
            toUsdRate = 1; // User provides value for physical
        } else if (toType === 'stock') {
            const apiKey = 'YOUR_POLYGON_KEY'; // Free at polygon.io
            const res = await fetch(`https://api.polygon.io/v2/last/stocks/${toAsset}?apiKey=${apiKey}`);
            const data = await res.json();
            toUsdRate = data.results.P; // Price
        } else if (toType === 'crypto') {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${toAsset}&vs_currencies=usd`);
            const data = await res.json();
            toUsdRate = data[toAsset].usd;
        } else if (toType === 'currency') {
            const res = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${toAsset}`);
            const data = await res.json();
            toUsdRate = data.rates[toAsset];
        }

        const converted = (fromUsd / toUsdRate).toFixed(4);
        document.getElementById('investment-result').innerText = `${fromValue} of ${fromAsset} (${fromType}) ≈ ${converted} of ${toAsset} (${toType}).`;
        document.getElementById('from-desc').innerText = `From Desc: ${fromDesc}`;
        document.getElementById('to-desc').innerText = `To Desc: ${toDesc}`;
    } catch (err) {
        document.getElementById('investment-result').innerText = `Error: ${err.message}`;
    }
}

function analyzeEcofuel() {
    const useCase = document.getElementById('use-case').value.toLowerCase() || 'vehicles';
    const sources = [
        {source: 'Electric', eff: {vehicles: 90, heating: 95, power: 40}}, // % efficiency
        {source: 'Solar', eff: {vehicles: 20, heating: 50, power: 20}},
        {source: 'Biofuels', eff: {vehicles: 40, heating: 70, power: 30}},
        {source: 'Hydro', eff: {vehicles: 0, heating: 0, power: 90}},
        {source: 'Wind', eff: {vehicles: 0, heating: 0, power: 40}},
        {source: 'Gas', eff: {vehicles: 25, heating: 80, power: 40}},
        {source: 'Oil', eff: {vehicles: 20, heating: 75, power: 35}},
        {source: 'Nuclear', eff: {vehicles: 0, heating: 0, power: 33}}
    ];
    const list = document.getElementById('ecofuel-result');
    list.innerHTML = '';
    sources.sort((a, b) => (b.eff[useCase] || 0) - (a.eff[useCase] || 0));
    sources.forEach(s => {
        const li = document.createElement('li');
        li.innerText = `${s.source}: Efficiency ${s.eff[useCase] || 0}% for ${useCase}`;
        list.appendChild(li);
    });
}

// Pixel Art Game
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

// Init
let pixelArt;
document.addEventListener('DOMContentLoaded', () => {
    pixelArt = new PixelArt();
});
document.addEventListener('DOMContentLoaded', () => {
    new MinecraftClone();
});
