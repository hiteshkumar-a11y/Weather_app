/* ============================================================
   WEATHER.JS — Search, Geocoding & API Integration
   Milestone 2: Open-Meteo APIs (no key required)
   ============================================================ */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL  = 'https://api.open-meteo.com/v1/forecast';
const STORAGE_KEY   = 'weather-app-last-city';

/* ---------- WMO weather code → label + emoji ---------- */
const WMO_CODES = {
  0:  { label: 'Clear Sky',          emoji: '☀️'  },
  1:  { label: 'Mainly Clear',       emoji: '🌤️' },
  2:  { label: 'Partly Cloudy',      emoji: '⛅'  },
  3:  { label: 'Overcast',           emoji: '☁️'  },
  45: { label: 'Foggy',              emoji: '🌫️' },
  48: { label: 'Icy Fog',            emoji: '🌫️' },
  51: { label: 'Light Drizzle',      emoji: '🌦️' },
  53: { label: 'Drizzle',            emoji: '🌦️' },
  55: { label: 'Heavy Drizzle',      emoji: '🌧️' },
  61: { label: 'Light Rain',         emoji: '🌧️' },
  63: { label: 'Rain',               emoji: '🌧️' },
  65: { label: 'Heavy Rain',         emoji: '🌧️' },
  71: { label: 'Light Snow',         emoji: '🌨️' },
  73: { label: 'Snow',               emoji: '🌨️' },
  75: { label: 'Heavy Snow',         emoji: '❄️'  },
  77: { label: 'Snow Grains',        emoji: '❄️'  },
  80: { label: 'Light Showers',      emoji: '🌦️' },
  81: { label: 'Showers',            emoji: '🌧️' },
  82: { label: 'Heavy Showers',      emoji: '⛈️'  },
  85: { label: 'Snow Showers',       emoji: '🌨️' },
  86: { label: 'Heavy Snow Showers', emoji: '❄️'  },
  95: { label: 'Thunderstorm',       emoji: '⛈️'  },
  96: { label: 'Thunderstorm & Hail',emoji: '⛈️'  },
  99: { label: 'Severe Thunderstorm',emoji: '⛈️'  },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] ?? { label: 'Unknown', emoji: '🌡️' };
}

/* ---------- DOM refs ---------- */
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const errorBanner   = document.getElementById('errorBanner');
const errorMsg      = document.getElementById('errorMsg');
const loadingState  = document.getElementById('loadingState');
const emptyState    = document.getElementById('emptyState');
const weatherContent = document.getElementById('weatherContent');
const clearCityBtn  = document.getElementById('clearCityBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');

/* ---------- UI state helpers ---------- */
function showLoading() {
  loadingState.hidden  = false;
  errorBanner.hidden   = true;
  emptyState.hidden    = true;
  weatherContent.hidden = true;
}

function showError(msg) {
  loadingState.hidden  = true;
  errorBanner.hidden   = false;
  errorMsg.textContent = msg;
  // Keep previously loaded weather visible if available
  const hasData = !weatherContent.hidden || weatherContent.dataset.loaded === 'true';
  if (!hasData) {
    emptyState.hidden = true;
    weatherContent.hidden = true;
  }
}

function showEmpty() {
  loadingState.hidden   = true;
  errorBanner.hidden    = true;
  emptyState.hidden     = false;
  weatherContent.hidden = true;
}

function showWeather() {
  loadingState.hidden   = true;
  errorBanner.hidden    = true;
  emptyState.hidden     = true;
  weatherContent.hidden = false;
  weatherContent.dataset.loaded = 'true';
}

/* ---------- Render helpers ---------- */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getDayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

function getConditionSVG(code) {
  // Sunny / clear
  if ([0, 1].includes(code)) return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;
  // Cloudy / partly
  if ([2, 3, 45, 48].includes(code)) return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>`;
  // Rain / drizzle / showers
  if (code >= 51 && code <= 67) return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>
      <line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>
      <line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>`;
  // Snow
  if (code >= 71 && code <= 86) return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"/>
    </svg>`;
  // Thunder
  return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>
    </svg>`;
}

/* ---------- Render weather data into DOM ---------- */
function renderWeather(cityName, country, data) {
  const current = data.current;
  const daily   = data.daily;
  const hourly  = data.hourly;
  const info    = getWeatherInfo(current.weather_code);

  // Current weather card
  document.getElementById('cityName').textContent = `${cityName}, ${country}`;
  document.getElementById('weatherDateText').textContent = formatDate(current.time);
 const temp = Math.round(current.temperature_2m);

const tempEl = document.getElementById('tempVal');
tempEl.textContent = `${temp}°`;

tempEl.classList.remove(
  'temp-cold',
  'temp-mild',
  'temp-hot'
);

if (temp <= 10) {
  tempEl.classList.add('temp-cold');
} else if (temp >= 30) {
  tempEl.classList.add('temp-hot');
} else {
  tempEl.classList.add('temp-mild');
}
  document.getElementById('conditionText').textContent = info.label;
  document.getElementById('conditionIcon').innerHTML = getConditionSVG(current.weather_code);
  document.getElementById('humidityVal').textContent   = `${current.relative_humidity_2m}%`;
  document.getElementById('windVal').textContent       = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('pressureVal').textContent   = `${Math.round(current.surface_pressure)} hPa`;

  // 5-day forecast
  const forecastStrip = document.getElementById('forecastStrip');
  forecastStrip.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const wInfo = getWeatherInfo(daily.weather_code[i]);
    const isActive = i === 0 ? 'active' : '';
    forecastStrip.innerHTML += `
      <div class="forecast-day ${isActive}">
        <span class="day-lbl">${getDayLabel(daily.time[i], i)}</span>
       <span class="day-ico"
      title="${wInfo.label}">
      ${getConditionSVG(daily.weather_code[i])}
</span>
        <span class="day-hi">${Math.round(daily.temperature_2m_max[i])}°</span>
        <span class="day-lo">${Math.round(daily.temperature_2m_min[i])}°</span>
      </div>`;
  }

  // Hourly insights — pick 6 entries starting from current hour
  const now = new Date();
  const currentHour = now.getHours();
  const insightsList = document.getElementById('insightsList');
  insightsList.innerHTML = '';

  let count = 0;
  for (let i = 0; i < hourly.time.length && count < 6; i++) {
    const entryHour = new Date(hourly.time[i]).getHours();
    const entryDate = new Date(hourly.time[i]).toDateString();
    const todayStr  = now.toDateString();
    if (entryDate !== todayStr) continue;
    if (entryHour < currentHour) continue;

    const hInfo = getWeatherInfo(hourly.weather_code[i]);
    const timeLabel = `${String(entryHour).padStart(2, '0')}:00`;
    const temp = hourly.temperature_2m[i].toFixed(1);
    insightsList.innerHTML += `
      <div class="insight-row">
        <span class="insight-time">${timeLabel}</span>
        <span class="insight-ico-sm">${hInfo.emoji}</span>
        <span class="insight-lbl">${hInfo.label}</span>
        <span class="insight-temp">${temp}°C</span>
      </div>`;
    count++;
  }

  // Fallback if less than 6 hours left today
  if (count < 0) {
    insightsList.innerHTML = `<div class="insight-empty">No more hourly data for today.</div>`;
  }

  showWeather();
}

/* ---------- API calls ---------- */
async function geocodeCity(cityName) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed. Please try again.');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${cityName}" not found. Please check the spelling and try again.`);
  }
  return data.results[0]; // { name, country, latitude, longitude }
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current:   'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure',
    hourly:    'temperature_2m,weather_code',
    daily:     'weather_code,temperature_2m_max,temperature_2m_min',
    timezone:  'auto',
    forecast_days: 5,
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weather data. Please try again.');
  return res.json();
}

/* ---------- Main search handler ---------- */
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showError('Please enter a city name.');
    return;
  }

showLoading();

searchBtn.disabled = true;
searchInput.disabled = true;

  try {
    const location = await geocodeCity(query);
    const forecast = await fetchForecast(location.latitude, location.longitude);

    // Persist last city
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: location.name,
      country: location.country,
      lat: location.latitude,
      lon: location.longitude,
    }));

    renderWeather(location.name, location.country, forecast);
    console.log('[WeatherApp] Data loaded:', { location, forecast });

  } catch (err) {
    showError(err.message);
    console.error('[WeatherApp] Error:', err);
  } finally {
  searchBtn.disabled = false;
  searchInput.disabled = false;
}
}

/* ---------- Clear city ---------- */
function handleClear() {
  localStorage.removeItem(STORAGE_KEY);

  searchInput.value = '';
  clearSearchBtn.hidden = true;

  weatherContent.dataset.loaded = '';

  showEmpty();

  searchInput.focus();
}

/* ---------- Event listeners ---------- */
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
searchInput.addEventListener('input', () => {
  clearSearchBtn.hidden =
    searchInput.value.trim() === '';
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.hidden = true;
  searchInput.focus();
});

clearCityBtn.addEventListener('click', handleClear);

/* ---------- On load: restore last city ---------- */
(async function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const { name, country, lat, lon } = JSON.parse(saved);
      showLoading();
    //   searchInput.value = name;
    searchInput.value = '';
      const forecast = await fetchForecast(lat, lon);
      renderWeather(name, country, forecast);
    } catch (err) {
      showEmpty();
      console.warn('[WeatherApp] Could not restore last city:', err);
    }
  } else {
    showEmpty();
  }
})();