const WMO_CODES = {
    0:  { desc: "Clear sky",            icon: "☀️" },
    1:  { desc: "Mainly clear",         icon: "🌤️" },
    2:  { desc: "Partly cloudy",        icon: "⛅" },
    3:  { desc: "Overcast",             icon: "☁️" },
    45: { desc: "Foggy",                icon: "🌫️" },
    48: { desc: "Icy fog",              icon: "🌫️" },
    51: { desc: "Light drizzle",        icon: "🌦️" },
    53: { desc: "Moderate drizzle",     icon: "🌦️" },
    55: { desc: "Dense drizzle",        icon: "🌦️" },
    61: { desc: "Light rain",           icon: "🌧️" },
    63: { desc: "Moderate rain",        icon: "🌧️" },
    65: { desc: "Heavy rain",           icon: "🌧️" },
    71: { desc: "Light snow",           icon: "🌨️" },
    73: { desc: "Moderate snow",        icon: "🌨️" },
    75: { desc: "Heavy snow",           icon: "❄️" },
    80: { desc: "Light showers",        icon: "🌦️" },
    81: { desc: "Moderate showers",     icon: "🌦️" },
    82: { desc: "Heavy showers",        icon: "⛈️" },
    95: { desc: "Thunderstorm",         icon: "⛈️" },
    96: { desc: "Thunderstorm w/ hail", icon: "⛈️" },
    99: { desc: "Thunderstorm w/ hail", icon: "⛈️" },
};

function getWeatherInfo(code) {
    if (WMO_CODES[code]) return WMO_CODES[code];
    if (code >= 51 && code <= 57) return { desc: "Drizzle", icon: "🌦️" };
    if (code >= 61 && code <= 67) return { desc: "Rain",    icon: "🌧️" };
    if (code >= 71 && code <= 77) return { desc: "Snow",    icon: "🌨️" };
    if (code >= 80 && code <= 82) return { desc: "Showers", icon: "🌦️" };
    return { desc: "No data", icon: "🌡️" };
}

function celsiusToFahrenheit(c) {
    return Math.round((c * 9 / 5) + 32);
}

let currentData = null;
let isFahrenheit = false;

const cityInput   = document.getElementById("city-input");
const searchBtn   = document.getElementById("search-btn");
const errorMsg    = document.getElementById("error-msg");
const weatherCard = document.getElementById("weather-card");
const loadingEl   = document.getElementById("loading");
const cityNameEl  = document.getElementById("city-name");
const countryEl   = document.getElementById("country-name");
const iconEl      = document.getElementById("weather-icon");
const tempEl      = document.getElementById("temperature");
const descEl      = document.getElementById("weather-desc");
const feelsEl     = document.getElementById("feels-like");
const humidityEl  = document.getElementById("humidity");
const windEl      = document.getElementById("wind-speed");
const unitToggle  = document.getElementById("unit-toggle");

async function fetchWeather(city) {
    const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    if (!geoRes.ok) throw new Error("Could not connect to the server.");

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try another name.");
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code`
    );
    if (!weatherRes.ok) throw new Error("Failed to fetch weather data.");

    const weatherData = await weatherRes.json();
    const c = weatherData.current;

    return {
        city:        name,
        country:     country,
        tempC:       Math.round(c.temperature_2m),
        feelsLikeC:  Math.round(c.apparent_temperature),
        humidity:    c.relative_humidity_2m,
        windKmh:     Math.round(c.wind_speed_10m),
        weatherCode: c.weather_code,
    };
}

function displayWeather(data) {
    const info  = getWeatherInfo(data.weatherCode);
    const temp  = isFahrenheit ? celsiusToFahrenheit(data.tempC)      : data.tempC;
    const feels = isFahrenheit ? celsiusToFahrenheit(data.feelsLikeC) : data.feelsLikeC;
    const unit  = isFahrenheit ? "°F" : "°C";

    cityNameEl.textContent = data.city;
    countryEl.textContent  = data.country;
    iconEl.textContent     = info.icon;
    tempEl.textContent     = `${temp}°`;
    descEl.textContent     = info.desc;
    feelsEl.textContent    = `${feels}${unit}`;
    humidityEl.textContent = `${data.humidity}%`;
    windEl.textContent     = `${data.windKmh} km/h`;
    unitToggle.textContent = isFahrenheit ? "°C" : "°F";
}

async function search() {
    const city = cityInput.value.trim();
    if (!city) return;

    errorMsg.classList.add("hidden");
    weatherCard.classList.add("hidden");
    loadingEl.classList.remove("hidden");
    searchBtn.disabled = true;

    try {
        currentData = await fetchWeather(city);
        displayWeather(currentData);
        weatherCard.classList.remove("hidden");
    } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.classList.remove("hidden");
    } finally {
        loadingEl.classList.add("hidden");
        searchBtn.disabled = false;
    }
}

searchBtn.addEventListener("click", search);
cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") search();
});

unitToggle.addEventListener("click", () => {
    if (!currentData) return;
    isFahrenheit = !isFahrenheit;
    displayWeather(currentData);
});
