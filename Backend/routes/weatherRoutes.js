const express = require('express');
const router = express.Router();

// Import weatherService with error handling
let weatherService = null;
try {
  weatherService = require('../utils/weatherService');
  console.log('✅ WeatherService imported successfully');
} catch (error) {
  console.error('❌ Failed to import weatherService:', error.message);
}

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Weather routes are working!',
    weatherServiceLoaded: !!weatherService
  });
});

// Get current weather data
router.get('/current', async (req, res) => {
  try {
    if (!weatherService) {
      return res.status(500).json({
        status: 'error',
        message: 'Weather service unavailable'
      });
    }

    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates format'
      });
    }
    
    if (!weatherService.validateCoordinates(lat, lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates provided'
      });
    }

    const weatherData = await weatherService.getWeatherData(lat, lon);
    
    res.status(200).json({
      status: 'success',
      data: weatherData
    });
  } catch (error) {
    console.error('Weather data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch weather data',
      details: error.message
    });
  }
});

// Get weather forecast
router.get('/forecast', async (req, res) => {
  try {
    if (!weatherService) {
      return res.status(500).json({
        status: 'error',
        message: 'Weather service unavailable'
      });
    }

    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates format'
      });
    }
    
    if (!weatherService.validateCoordinates(lat, lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates provided'
      });
    }

    const forecastData = await weatherService.getWeatherForecast(lat, lon);
    
    res.status(200).json({
      status: 'success',
      data: forecastData
    });
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch weather forecast',
      details: error.message
    });
  }
});

// Get agriculture alerts
router.get('/alerts', async (req, res) => {
  try {
    if (!weatherService) {
      return res.status(500).json({
        status: 'error',
        message: 'Weather service unavailable'
      });
    }

    const { latitude, longitude, cropType } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates format'
      });
    }
    
    if (!weatherService.validateCoordinates(lat, lon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates provided'
      });
    }

    const alerts = await weatherService.getAgricultureAlerts(lat, lon, cropType || 'general');
    
    res.status(200).json({
      status: 'success',
      data: alerts
    });
  } catch (error) {
    console.error('Agriculture alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch agriculture alerts',
      details: error.message
    });
  }
});

module.exports = router;