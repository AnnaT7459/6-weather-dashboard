// OpenWeatherMap API key
var apiKey = '790c21a3a3e4e9fbeed5495456bb6293';

// Base URL for the OpenWeatherMap API
var baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';

// Weather icon base URL
var iconBaseUrl = 'https://openweathermap.org/img/wn/';

// pulls searchButton, cityInput, and weatherResult IDs from the HTML
var searchButton = document.getElementById('searchButton');
var cityInput = document.getElementById('cityInput');
var weatherResult = document.getElementById('weatherResult');
var searchHistoryContainer = document.getElementById('searchHistoryContainer')

// Retrieve the search history from local storage when the page loads
var searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// Function to update and save the search history to local storage
function updateSearchHistory(city) {
    searchHistory.push(city);
    // Ensures the search history contains unique entries
    searchHistory = [...new Set(searchHistory)];

    //   limits the search hisotry to 10 cities recently searched
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(-10);
    }
    // stores data with a key for later retrieval (persists)
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

// Function to create and add a button for a searched city
function addCityButton(city) {
    var cityButton = document.createElement('button');
    cityButton.classList.add('city-button');
    cityButton.textContent = city;
    cityButton.addEventListener('click', function () {
        cityInput.value = city;
        getWeatherData();
    });

    // Adds buttons to the search history container
    searchHistoryContainer.appendChild(cityButton);
}

// Function to display the search history
function displaySearchHistory() {
    searchHistoryContainer.innerHTML = "";
    searchHistory.forEach(city => {
        addCityButton(city);
    });
}

// function to be called to display the search history when the page loads
displaySearchHistory();

// Event listener for the search button
searchButton.addEventListener('click', getWeatherData);

// this takes the date and sets it up to appear as MM/DD/YYYY string for better readability 
function formatDate(date) {
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    var year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// might be a way to do this just within the API url?
function convertMetersPerSecondToMilesPerHour(windSpeedMs) {
    return windSpeedMs * 2.23694;
}

// this finds the weather icon to go with the weather for that day, except it is appearing as night - will debug in the future
function getWeatherIconUrl(iconCode) {
    return `${iconBaseUrl}${iconCode}@2x.png`;
}

// this function will find the weather data from the searched city
function getWeatherData() {
    // this is based on the city the user searches
    var city = cityInput.value;
    var url = `${baseUrl}?q=${city}&appid=${apiKey}`;

    // this will get the information from the API in order to display it for the user
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Clear the weatherResult element before adding new data
            weatherResult.innerHTML = "";

            // Displays weather information
            weatherResult.innerHTML += `<h2>Weather data for ${city}</h2>`;
            weatherResult.innerHTML += `<p>City: ${data.city.name}</p>`;
            // Gets the current date
            var currentDate = new Date();

            // Filters the forecast data for daytime forecasts
            var daytimeForecasts = data.list.filter(forecast => {
                var forecastDate = new Date(forecast.dt_txt);
                var forecastHour = forecastDate.getHours();
                return forecastHour >= 6 && forecastHour <= 18;
            });
            
            // this checks if there is daytime weather forecasts available, extracts data for the current day from the first element of the array and assigns them to the specific variables - will be used to display in UI
            if (daytimeForecasts.length > 0) {
                var currentDayForecast = daytimeForecasts[0];
                var temperatureKelvin = currentDayForecast.main.temp;
                var humidity = currentDayForecast.main.humidity;
                var windSpeed = currentDayForecast.wind.speed;
                var iconCode = currentDayForecast.weather[0].icon;

                // Converts temperature from Kelvin to Fahrenheit - // might be a way to do this just within the API url?
                var temperatureFahrenheit = (temperatureKelvin - 273.15) * 9 / 5 + 32;
                var windSpeedMph = convertMetersPerSecondToMilesPerHour(windSpeed);
                var weatherIconUrl = getWeatherIconUrl(iconCode);
                // Gets reference to the container div
                var currentDayWeatherContainer = document.getElementById('currentDayWeatherContainer');

                // Created a new div element to display the current day's weather
                var currentDayWeatherDiv = document.createElement('div');
                currentDayWeatherDiv.className = 'current-day';

                // Set the content for the current day's weather div
                currentDayWeatherDiv.innerHTML = '<h2>Current Day\'s Weather</h2>';
                currentDayWeatherDiv.innerHTML += '<p>Date: ' + formatDate(currentDate) + '</p>';
                currentDayWeatherDiv.innerHTML += '<p>Temperature: ' + temperatureFahrenheit.toFixed(2) + '°F</p>';
                currentDayWeatherDiv.innerHTML += '<p>Humidity: ' + humidity + '%</p>';
                currentDayWeatherDiv.innerHTML += '<p>Wind Speed: ' + windSpeedMph.toFixed(2) + ' mph</p>';

                // Create an image element for the weather icon
                var weatherIcon = document.createElement('img');
                weatherIcon.className = 'current-day-icon';
                weatherIcon.src = weatherIconUrl;
                weatherIcon.alt = 'Weather Icon';

                // Appends the weather icon to the current day's weather div
                currentDayWeatherDiv.appendChild(weatherIcon);

                // Appends the current day's weather div to the container
                currentDayWeatherContainer.appendChild(currentDayWeatherDiv);
            }

            //calculates the average temperature, humidty, and windspeed
            function calculateDailyAverages(forecasts) {
                var sumTemp = 0;
                var sumHumidity = 0;
                var sumWindSpeed = 0;

                forecasts.forEach(forecast => {
                    sumTemp += forecast.main.temp;
                    sumHumidity += forecast.main.humidity;
                    sumWindSpeed += forecast.wind.speed;
                });

                var averageTemp = sumTemp / forecasts.length;
                var averageHumidity = sumHumidity / forecasts.length;
                var averageWindSpeed = sumWindSpeed / forecasts.length;

                return {
                    temperature: averageTemp,
                    humidity: averageHumidity,
                    windSpeed: averageWindSpeed,
                };
            }
            
            // calculates daily averages
            for (var key in dailyForecasts) {
                // All daytime forecasts for the day
                var forecasts = dailyForecasts[key];
                var date = new Date(key);
                var dailyAverage = calculateDailyAverages(forecasts);

                // Converts temperature from Kelvin to Fahrenheit
                var temperatureKelvin = dailyAverage.temperature;
                var temperatureFahrenheit = (temperatureKelvin - 273.15) * 9 / 5 + 32;

                var windSpeed = dailyAverage.windSpeed;
                var windSpeedMph = convertMetersPerSecondToMilesPerHour(windSpeed);

                var humidity = dailyAverage.humidity;
            }

            var dailyForecasts = {};

            daytimeForecasts.forEach(forecast => {
                var date = new Date(forecast.dt_txt);
                var dateKey = formatDate(date);

                // Groups daytime forecasts by date
                if (!dailyForecasts[dateKey]) {
                    dailyForecasts[dateKey] = [];
                }
                dailyForecasts[dateKey].push(forecast);
            });

            // Displays the 5-day forecast for daytime forecasts
            // Clear the fiveDayForecastContainer before adding new data
            document.getElementById('fiveDayForecastContainer').innerHTML = "";

            // Displays the 5-day forecast for daytime forecasts
            for (var key in dailyForecasts) {
                var dailyForecast = dailyForecasts[key][0];
                var date = new Date(key);
                var temperatureKelvin = dailyForecast.main.temp;
                var windSpeed = dailyForecast.wind.speed;
                var iconCode = dailyForecast.weather[0].icon;

                // Converts temperature from Kelvin to Fahrenheit
                var temperatureFahrenheit = (temperatureKelvin - 273.15) * 9 / 5 + 32;
                var windSpeedMph = convertMetersPerSecondToMilesPerHour(windSpeed);
                var weatherIconUrl = getWeatherIconUrl(iconCode);

                var humidity = dailyForecast.main.humidity;

                // Created a new div element for each day's forecast
                var dayForecastDiv = document.createElement('div');
                dayForecastDiv.className = 'day-forecast';

                // Sets the content for the day's forecast div
                dayForecastDiv.innerHTML = '<h2>' + formatDate(date) + '</h2>';
                dayForecastDiv.innerHTML += '<p>Temperature: ' + temperatureFahrenheit.toFixed(2) + '°F</p>';
                dayForecastDiv.innerHTML += '<p>Humidity: ' + humidity + '%</p>';
                dayForecastDiv.innerHTML += '<p>Wind Speed: ' + windSpeedMph.toFixed(2) + ' mph</p>';
                dayForecastDiv.innerHTML += `<img src="${weatherIconUrl}" alt="Weather Icon">`;

                // Appends the day's forecast div to the fiveDayForecastContainer
                document.getElementById('fiveDayForecastContainer').appendChild(dayForecastDiv);

                // Updates the search history with the searched city
                updateSearchHistory(city);

                // Calls the function to display the updated search history
                displaySearchHistory();
            }
        })
        .catch(error => {
            // Handles the error and display a message
            weatherResult.innerHTML = `<p>Failed to retrieve weather data. Error: ${error.message}</p>`;
        });
}



