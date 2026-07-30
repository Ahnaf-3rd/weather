
        const API_KEY = '9d23b5ed352f445982b161355262907';
        const BASE_URL = 'https://api.weatherapi.com/v1';
        let currentUnit = 'metric';
        let currentCity = 'Dhaka';
        let isCelsius = true;
        const $ = (sel) => document.querySelector(sel);
        const $$ = (sel) => document.querySelectorAll(sel);

        const searchForm = $('#searchForm');
        const searchInput = $('#searchInput');
        const statusMsg = $('#statusMessage');
        const weatherCard = $('#weatherCard');

        const weatherIcon = $('#weatherIcon');
        const weatherTemp = $('#weatherTemp');
        const weatherCondition = $('#weatherCondition');
        const weatherCity = $('#weatherCity');
        const weatherCountry = $('#weatherCountry');
        const weatherUpdated = $('#weatherUpdated');

        const statHumidity = $('#statHumidity');
        const statWind = $('#statWind');
        const statWindDir = $('#statWindDir');
        const statUv = $('#statUv');
        const statUvLabel = $('#statUvLabel');
        const uvStat = $('#uvStat');
        const statFeelsLike = $('#statFeelsLike');

        const extraPressure = $('#extraPressure');
        const extraVisibility = $('#extraVisibility');
        const extraClouds = $('#extraClouds');
        const extraSunrise = $('#extraSunrise');
        const extraSunset = $('#extraSunset');

        const forecastGrid = $('#forecastGrid');
        const unitToggle = $('#unitToggle');

        function showStatus(msg, isError = false) {
            statusMsg.innerHTML = msg;
            statusMsg.className = 'status-message' + (isError ? ' error' : '');
            weatherCard.classList.add('hidden');
        }

        function showWeather() {
            weatherCard.classList.remove('hidden');
            statusMsg.innerHTML = '';
            statusMsg.className = 'status-message';
        }

        function getUnitSymbol() {
            return isCelsius ? '°C' : '°F';
        }

        function getWindUnit() {
            return isCelsius ? 'km/h' : 'mph';
        }

        function formatTime(isoString) {
            if (!isoString) return '--';
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function formatDate(isoString) {
            if (!isoString) return '--';
            const d = new Date(isoString);
            return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        }

        function getDayName(isoString) {
            if (!isoString) return '--';
            const d = new Date(isoString);
            return d.toLocaleDateString([], { weekday: 'short' });
        }

        function getUVLabel(uv) {
            if (uv <= 2) return 'Low';
            if (uv <= 5) return 'Moderate';
            if (uv <= 7) return 'High';
            if (uv <= 10) return 'Very High';
            return 'Extreme';
        }

        function getUVClass(uv) {
            if (uv <= 2) return 'uv-low';
            if (uv <= 5) return 'uv-moderate';
            if (uv <= 7) return 'uv-high';
            if (uv <= 10) return 'uv-very-high';
            return 'uv-extreme';
        }

        function getWeatherIconUrl(code) {
            return `https:${code}`;
        }

        async function fetchWeather(city, unit) {
            const url = `${BASE_URL}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=5&aqi=no&alerts=no&units=${unit}`;

            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error?.message || `HTTP ${response.status}`;
                throw new Error(msg);
            }
            return await response.json();
        }

        function formatTimeFromString(timeStr) {
            if (!timeStr) return '--';
            const parts = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
            if (!parts) return timeStr;
            let hours = parseInt(parts[1], 10);
            const minutes = parts[2];
            const ampm = parts[3].toUpperCase();
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            return `${String(hours).padStart(2, '0')}:${minutes}`;
        }

        function renderWeather(data) {
            const current = data.current;
            const location = data.location;
            const forecast = data.forecast;
            const temp = isCelsius ? current.temp_c : current.temp_f;
            weatherTemp.innerHTML = `${Math.round(temp)}<span class="deg-symbol">°${isCelsius ? 'C' : 'F'}</span>`;
            weatherCondition.textContent = current.condition.text;
            weatherCity.textContent = location.name;
            weatherCountry.textContent = location.country;
            weatherUpdated.textContent = `Updated: ${formatTime(current.last_updated)}`;
            weatherIcon.src = getWeatherIconUrl(current.condition.icon);
            weatherIcon.alt = current.condition.text;
            statHumidity.textContent = `${current.humidity}%`;

            const windSpeed = isCelsius ? current.wind_kph : current.wind_mph;
            const windUnit = isCelsius ? 'km/h' : 'mph';
            statWind.textContent = `${Math.round(windSpeed)} ${windUnit}`;
            statWindDir.textContent = current.wind_dir || '--';

            const uv = current.uv;
            statUv.textContent = uv.toFixed(1);
            const uvLabel = getUVLabel(uv);
            statUvLabel.textContent = uvLabel;
            uvStat.className = `stat-item ${getUVClass(uv)}`;

            const feelsLike = isCelsius ? current.feelslike_c : current.feelslike_f;
            statFeelsLike.textContent = `${Math.round(feelsLike)}°${isCelsius ? 'C' : 'F'}`;

            extraPressure.textContent = `${current.pressure_mb} hPa`;
            const vis = isCelsius ? current.vis_km : (current.vis_miles || current.vis_km * 0.621371);
            extraVisibility.textContent = isCelsius ? `${current.vis_km} km` : `${Math.round(vis)} mi`;
            extraClouds.textContent = `${current.cloud}%`;
            extraSunrise.textContent = formatTimeFromString(forecast.forecastday[0].astro.sunrise);
            extraSunset.textContent = formatTimeFromString(forecast.forecastday[0].astro.sunset);

            renderForecast(forecast.forecastday);

            updateBackground(current.condition.text, current.is_day);

            showWeather();
        }

        function renderForecast(forecastDays) {
            forecastGrid.innerHTML = '';
            const days = forecastDays.slice(0, 5);
            days.forEach((day, index) => {
                const date = day.date;
                const dayName = index === 0 ? 'Today' : getDayName(date);
                const maxTemp = isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f;
                const minTemp = isCelsius ? day.day.mintemp_c : day.day.mintemp_f;
                const icon = day.day.condition.icon;
                const condition = day.day.condition.text;

                const div = document.createElement('div');
                div.className = 'forecast-day';
                div.innerHTML = `
              <div class="day-name">${dayName}</div>
              <div class="day-icon"><img src="${getWeatherIconUrl(icon)}" alt="${condition}" /></div>
              <div class="day-temp">${Math.round(maxTemp)}°<span class="day-temp-low">${Math.round(minTemp)}°</span></div>
              <div class="day-condition">${condition}</div>
            `;
                forecastGrid.appendChild(div);
            });
        }

        function updateBackground(condition, isDay) {
            const body = document.body;
            const lower = condition.toLowerCase();
            let bg = '';

            if (lower.includes('sunny') || lower.includes('clear')) {
                bg = isDay ?
                    'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #0ea5e9 100%)' :
                    'linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)';
            } else if (lower.includes('cloud') || lower.includes('overcast')) {
                bg = isDay ?
                    'linear-gradient(145deg, #1e293b 0%, #334155 40%, #475569 100%)' :
                    'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #1e1b4b 100%)';
            } else if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
                bg = isDay ?
                    'linear-gradient(145deg, #1e293b 0%, #334155 40%, #0f766e 100%)' :
                    'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #0f766e 100%)';
            } else if (lower.includes('thunder') || lower.includes('storm')) {
                bg = 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 40%, #4c1d95 100%)';
            } else if (lower.includes('snow') || lower.includes('sleet')) {
                bg = isDay ?
                    'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 40%, #94a3b8 100%)' :
                    'linear-gradient(145deg, #1e293b 0%, #334155 40%, #475569 100%)';
            } else if (lower.includes('mist') || lower.includes('fog') || lower.includes('haze')) {
                bg = isDay ?
                    'linear-gradient(145deg, #334155 0%, #475569 40%, #64748b 100%)' :
                    'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #334155 100%)';
            } else {
                bg = isDay ?
                    'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #0ea5e9 100%)' :
                    'linear-gradient(145deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)';
            }

            body.style.background = bg;
        }

        async function loadWeather(city, unit) {
            if (!city || city.trim() === '') {
                showStatus('Please enter a city name.', true);
                return;
            }

            const trimmed = city.trim();
            showStatus('<i class="fas fa-spinner"></i> Loading weather…');

            try {
                const data = await fetchWeather(trimmed, unit);
                currentCity = trimmed;
                renderWeather(data);
            } catch (err) {
                console.error('Weather fetch error:', err);
                showStatus(`❌ Could not find weather for "${trimmed}". ${err.message}`, true);
                weatherCard.classList.add('hidden');
            }
        }

        function setUnit(unit) {
            if (unit === currentUnit) return;
            currentUnit = unit;
            isCelsius = unit === 'metric';

            $$('#unitToggle button').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.unit === unit);
            });

            if (currentCity) {
                loadWeather(currentCity, currentUnit);
            }
        }

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const city = searchInput.value.trim();
            if (city) {
                loadWeather(city, currentUnit);
            } else {
                showStatus('Please enter a city name.', true);
            }
        });

        unitToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const unit = btn.dataset.unit;
            if (unit) setUnit(unit);
        });

        (function init() {
            const defaultCity = 'Dhaka';
            currentCity = defaultCity;
            searchInput.value = defaultCity;
            loadWeather(defaultCity, currentUnit);
        })();

        setTimeout(() => {
            if (API_KEY === '9d23b5ed352f445982b161355262907') {

                const msg = statusMsg.textContent;
                if (msg.includes('401') || msg.includes('key') || msg.includes('invalid')) {
                    statusMsg.innerHTML = `
                ⚠️ <strong>API key missing or invalid.</strong><br>
                Please replace <code>YOUR_WEATHERAPI_KEY</code> in the JavaScript with your free key from 
                <a href="https://www.weatherapi.com/signup.aspx" target="_blank" style="color:#38bdf8;">WeatherAPI.com</a>.
              `;
                    statusMsg.className = 'status-message error';
                }
            }
        }, 2000);