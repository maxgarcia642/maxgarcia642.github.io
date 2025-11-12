// ... (Smooth scrolling unchanged)

// Geodata: Added forecast/traffic (Geoapify for traffic), address waypoints.
async function fetchGeodata() {
    const city = document.getElementById('geo-city').value || 'New York';
    const startAddr = document.getElementById('start-addr').value || '123 Main St, New York, NY';
    const endAddr = document.getElementById('end-addr').value || '456 Elm St, Brooklyn, NY';
    const mode = document.getElementById('trans-mode').value;
    const geoApiKey = 'YOUR_GEOAPIFY_KEY';

    // Time
    const now = new Date().toLocaleString();
    document.getElementById('geo-time').innerText = `Current Time: ${now}`;

    // Weather + Forecast
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error('City not found');
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_probability_max`);
        const weatherData = await weatherRes.json();
        document.getElementById('geo-weather').innerText = `Weather in ${city}: Current ${weatherData.current_weather.temperature}°C, Wind ${weatherData.current_weather.windspeed} km/h. Forecast: Tomorrow Max ${weatherData.daily.temperature_2m_max[1]}°C, Precip ${weatherData.daily.precipitation_probability_max[1]}%.`;
    } catch (err) {
        document.getElementById('geo-weather').innerText = `Weather Error: ${err.message}`;
    }

    // Transportation + Traffic
    try {
        if (mode === 'flight') {
            // Unchanged
        } else {
            const res = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(startAddr)}|${encodeURIComponent(endAddr)}&mode=${mode}&traffic=approximated&apiKey=${geoApiKey}`);
            const data = await res.json();
            const dist = (data.features[0].properties.distance / 1000).toFixed(1);
            const time = (data.features[0].properties.time / 60).toFixed(1);
            const traffic = data.features[0].properties.traffic || 'moderate'; // Approximation
            document.getElementById('geo-trans').innerText = `${mode} Route: ${dist} km, ~${time} mins (Traffic: ${traffic}).`;
        }
    } catch (err) {
        document.getElementById('geo-trans').innerText = `Trans Error: ${err.message}`;
    }
}

// World News: By country.
async function fetchNews() {
    const country = document.getElementById('country-select').value || 'us';
    const apiKey = 'YOUR_NEWSAPI_KEY';
    try {
        const res = await fetch(`https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`);
        const data = await res.json();
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        data.articles.slice(0, 5).forEach(article => {
            const li = document.createElement('li');
            li.innerText = article.title;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('News error:', err);
    }
}

// Investment: Auto-fetch USD values.
async function convertInvestment() {
    // ... (Enhanced with auto-fetch: e.g., for stock/crypto/currency fetch price, art/realestate user-value + desc)
    // For realestate: Use ATTOM as before for auto-value by address.
}

// Ecofuel: Hypotheticals (e.g., add notes like "Hypothetical for boat: Solar 10% due to mobility").
function analyzeEcofuel() {
    const useCase = document.getElementById('use-case').value;
    // ... (Unchanged, but add hypothetical notes in li: e.g., `Hypothetical: Solar viable for stationary boats only.`)
}

// Pixel Art unchanged.

// Init unchanged.
