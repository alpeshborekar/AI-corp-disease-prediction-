const axios = require('axios');

// Create axios instance with better configuration
const weatherAPI = axios.create({
  timeout: 15000, // Increased timeout
  headers: {
    'User-Agent': 'CropDiseaseApp/1.0'
  }
});

// Retry function for API calls
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      console.log(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Validate coordinates function
const validateCoordinates = (lat, lng) => {
  return typeof lat === 'number' && typeof lng === 'number' &&
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Get weather data from OpenWeather API
const getWeatherData = async (latitude, longitude) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await retryApiCall(async () => {
      return await weatherAPI.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            units: 'metric'
          }
        }
      );
    });

    const weatherData = response.data;

    return {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windSpeed: weatherData.wind.speed,
      windDirection: weatherData.wind.deg,
      visibility: weatherData.visibility / 1000, // Convert to km
      cloudiness: weatherData.clouds.all,
      weather: {
        main: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon
      },
      location: {
        name: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          latitude: weatherData.coord.lat,
          longitude: weatherData.coord.lon
        }
      },
      timestamp: new Date(weatherData.dt * 1000),
      sunrise: new Date(weatherData.sys.sunrise * 1000),
      sunset: new Date(weatherData.sys.sunset * 1000)
    };
  } catch (error) {
    console.error('Weather API error:', error.message);
    
    // Return mock data if API fails
    return {
      temperature: 25,
      humidity: 60,
      pressure: 1013,
      windSpeed: 10,
      windDirection: 0,
      visibility: 10,
      cloudiness: 50,
      weather: {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      },
      location: {
        name: 'Unknown',
        country: 'Unknown',
        coordinates: { latitude, longitude }
      },
      timestamp: new Date(),
      sunrise: new Date(),
      sunset: new Date(),
      error: 'Weather data unavailable - using fallback data'
    };
  }
};

// Get weather forecast (5-day forecast)
const getWeatherForecast = async (latitude, longitude) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await retryApiCall(async () => {
      return await weatherAPI.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: apiKey,
            units: 'metric'
          }
        }
      );
    });

    const forecastData = response.data;

    return {
      location: {
        name: forecastData.city.name,
        country: forecastData.city.country,
        coordinates: {
          latitude: forecastData.city.coord.lat,
          longitude: forecastData.city.coord.lon
        }
      },
      forecast: forecastData.list.map(item => ({
        timestamp: new Date(item.dt * 1000),
        temperature: {
          current: item.main.temp,
          min: item.main.temp_min,
          max: item.main.temp_max,
          feelsLike: item.main.feels_like
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        cloudiness: item.clouds.all,
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        },
        precipitation: {
          probability: item.pop * 100, // Convert to percentage
          rain: item.rain ? item.rain['3h'] || 0 : 0,
          snow: item.snow ? item.snow['3h'] || 0 : 0
        }
      }))
    };
  } catch (error) {
    console.error('Weather forecast API error:', error.message);
    
    // Return mock forecast data if API fails
    const mockForecast = [];
    for (let i = 0; i < 40; i++) { // 40 items for 5 days
      mockForecast.push({
        timestamp: new Date(Date.now() + (i * 3 * 60 * 60 * 1000)), // Every 3 hours
        temperature: {
          current: 25 + Math.random() * 10,
          min: 20 + Math.random() * 5,
          max: 30 + Math.random() * 5,
          feelsLike: 25 + Math.random() * 10
        },
        humidity: 60 + Math.random() * 30,
        pressure: 1013 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 10,
        windDirection: Math.random() * 360,
        cloudiness: Math.random() * 100,
        weather: {
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        },
        precipitation: {
          probability: Math.random() * 50,
          rain: 0,
          snow: 0
        }
      });
    }
    
    return {
      location: {
        name: 'Unknown',
        country: 'Unknown',
        coordinates: { latitude, longitude }
      },
      forecast: mockForecast,
      error: 'Forecast data unavailable - using fallback data'
    };
  }
};

// Analyze weather conditions for disease risk
const analyzeWeatherRisk = (weatherData) => {
  const risks = [];
  
  // High humidity risk (>80%)
  if (weatherData.humidity > 80) {
    risks.push({
      type: 'high-humidity',
      level: 'high',
      message: 'High humidity increases risk of fungal diseases',
      conditions: { humidity: weatherData.humidity }
    });
  }
  
  // Temperature stress
  if (weatherData.temperature > 35) {
    risks.push({
      type: 'heat-stress',
      level: 'medium',
      message: 'High temperature may cause heat stress and increase pest activity',
      conditions: { temperature: weatherData.temperature }
    });
  } else if (weatherData.temperature < 10) {
    risks.push({
      type: 'cold-stress',
      level: 'medium',
      message: 'Low temperature may cause cold stress and slow plant growth',
      conditions: { temperature: weatherData.temperature }
    });
  }
  
  // Wet conditions (recent rain + high humidity)
  if (weatherData.weather.main.includes('Rain') && weatherData.humidity > 70) {
    risks.push({
      type: 'wet-conditions',
      level: 'high',
      message: 'Wet conditions significantly increase risk of bacterial and fungal infections',
      conditions: { 
        weather: weatherData.weather.main,
        humidity: weatherData.humidity 
      }
    });
  }
  
  // Drought conditions (low humidity + no rain)
  if (weatherData.humidity < 30 && !weatherData.weather.main.includes('Rain')) {
    risks.push({
      type: 'drought-stress',
      level: 'medium',
      message: 'Dry conditions may cause drought stress and increase spider mite risk',
      conditions: { humidity: weatherData.humidity }
    });
  }
  
  // Optimal conditions
  if (risks.length === 0) {
    risks.push({
      type: 'optimal',
      level: 'low',
      message: 'Weather conditions appear favorable for plant health',
      conditions: weatherData
    });
  }
  
  return {
    overallRisk: risks.length > 2 ? 'high' : risks.length > 0 ? 'medium' : 'low',
    risks,
    recommendations: generateWeatherRecommendations(risks)
  };
};

// Generate recommendations based on weather risks
const generateWeatherRecommendations = (risks) => {
  const recommendations = [];
  
  risks.forEach(risk => {
    switch (risk.type) {
      case 'high-humidity':
        recommendations.push('Ensure good air circulation around plants');
        recommendations.push('Avoid overhead watering');
        recommendations.push('Apply preventive fungicide if necessary');
        break;
      case 'heat-stress':
        recommendations.push('Provide shade during hottest parts of the day');
        recommendations.push('Increase watering frequency');
        recommendations.push('Monitor for increased pest activity');
        break;
      case 'cold-stress':
        recommendations.push('Protect plants from frost');
        recommendations.push('Reduce watering frequency');
        recommendations.push('Consider using row covers');
        break;
      case 'wet-conditions':
        recommendations.push('Improve drainage around plants');
        recommendations.push('Remove infected plant material promptly');
        recommendations.push('Apply preventive copper-based fungicides');
        break;
      case 'drought-stress':
        recommendations.push('Increase irrigation frequency');
        recommendations.push('Apply mulch to conserve soil moisture');
        recommendations.push('Monitor for spider mites and aphids');
        break;
      default:
        recommendations.push('Continue regular monitoring and care');
    }
  });
  
  // Remove duplicates
  return [...new Set(recommendations)];
};

// Get agricultural alerts based on weather conditions
const getAgricultureAlerts = async (latitude, longitude, cropType) => {
  try {
    // Try to get both current weather and forecast, but handle failures gracefully
    let currentWeather, forecast;
    
    try {
      currentWeather = await getWeatherData(latitude, longitude);
    } catch (error) {
      console.log('Failed to get current weather, using fallback');
      currentWeather = {
        temperature: 25,
        humidity: 60,
        weather: { main: 'Clear' },
        location: { name: 'Unknown', coordinates: { latitude, longitude } }
      };
    }
    
    try {
      forecast = await getWeatherForecast(latitude, longitude);
    } catch (error) {
      console.log('Failed to get forecast, skipping forecast analysis');
      forecast = { forecast: [] };
    }
    
    const alerts = [];
    
    // Analyze current conditions
    const currentRisk = analyzeWeatherRisk(currentWeather);
    if (currentRisk.overallRisk !== 'low') {
      alerts.push({
        type: 'current-weather',
        severity: currentRisk.overallRisk,
        title: 'Current Weather Alert',
        message: `Current weather conditions pose ${currentRisk.overallRisk} risk to ${cropType} crops`,
        details: currentRisk.risks,
        recommendations: currentRisk.recommendations
      });
    }
    
    // Analyze upcoming conditions if forecast is available
    if (forecast.forecast && forecast.forecast.length > 0) {
      const upcomingDays = forecast.forecast.slice(0, 24); // Next 3 days (8 forecasts per day)
      let hasUpcomingRisk = false;
      
      for (const forecastItem of upcomingDays) {
        const riskAnalysis = analyzeWeatherRisk(forecastItem);
        if (riskAnalysis.overallRisk === 'high') {
          hasUpcomingRisk = true;
          break;
        }
      }
      
      if (hasUpcomingRisk) {
        alerts.push({
          type: 'forecast-warning',
          severity: 'medium',
          title: 'Weather Forecast Warning',
          message: `Upcoming weather conditions may increase disease risk for ${cropType}`,
          details: 'Monitor weather conditions and take preventive measures',
          recommendations: [
            'Check weather forecast daily',
            'Prepare preventive treatments',
            'Ensure drainage systems are clear'
          ]
        });
      }
    }
    
    return {
      location: currentWeather.location,
      alertCount: alerts.length,
      alerts,
      lastUpdated: new Date(),
      dataSource: currentWeather.error ? 'fallback' : 'live'
    };
  } catch (error) {
    console.error('Agriculture alerts error:', error.message);
    return {
      location: { name: 'Unknown', coordinates: { latitude, longitude } },
      alertCount: 0,
      alerts: [],
      error: 'Unable to fetch weather alerts',
      lastUpdated: new Date(),
      dataSource: 'fallback'
    };
  }
};

// Export all functions
module.exports = {
  getWeatherData,
  getWeatherForecast,
  getAgricultureAlerts,
  analyzeWeatherRisk,
  validateCoordinates
};