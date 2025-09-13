import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  AlertTriangle,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { weatherAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Weather = () => {
  const { user } = useAuth();
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('general');

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      
      // Get user location or use browser geolocation
      if (user?.profile?.location?.coordinates) {
        const { latitude, longitude } = user.profile.location.coordinates;
        await fetchWeatherData(latitude, longitude);
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Weather loading error:', error);
      toast.error('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherData(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your location');
        // Use default location (Delhi, India)
        fetchWeatherData(28.6139, 77.2090);
      }
    );
  };

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      const [currentResponse, forecastResponse, alertsResponse] = await Promise.all([
        weatherAPI.getCurrent({ latitude, longitude }),
        weatherAPI.getForecast({ latitude, longitude }),
        weatherAPI.getAlerts({ latitude, longitude, cropType: selectedCrop })
      ]);

      // Debug logging
      console.log('Current Response:', currentResponse);
      console.log('Forecast Response:', forecastResponse);
      console.log('Alerts Response:', alertsResponse);

      // Fixed: Access nested data structure correctly
      setCurrentWeather(currentResponse.data.data || currentResponse.data);
      setForecast(forecastResponse.data.data?.forecast?.slice(0, 24) || forecastResponse.data?.forecast?.slice(0, 24) || []);
      setAlerts(alertsResponse.data.data?.alerts || alertsResponse.data?.alerts || []);
      setLocation({ latitude, longitude });
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error('Failed to fetch weather data');
    }
  };

  const getWeatherIcon = (condition) => {
    const iconMap = {
      'clear': '☀️',
      'clouds': '☁️',
      'rain': '🌧️',
      'drizzle': '🌦️',
      'thunderstorm': '⛈️',
      'snow': '❄️',
      'mist': '🌫️',
      'fog': '🌫️'
    };
    
    const key = Object.keys(iconMap).find(k => 
      condition?.toLowerCase().includes(k)
    );
    return iconMap[key] || '🌤️';
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Invalid Date';
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Invalid Date';
    try {
      return new Date(timestamp).toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getTempTrend = (currentTemp, previousTemp) => {
    if (currentTemp > previousTemp) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (currentTemp < previousTemp) {
      return <TrendingDown className="h-4 w-4 text-blue-500" />;
    }
    return null;
  };

  // Prepare chart data with proper fallbacks
  const chartData = forecast.slice(0, 12).map((item, index) => ({
    time: formatTime(item.timestamp),
    temperature: Math.round(item.temperature?.current || item.temperature || 0),
    humidity: item.humidity || 0,
    precipitation: Math.round((item.precipitation?.probability || 0) * 100)
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Weather Dashboard</h1>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {currentWeather?.location?.name || 'Current Location'}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="form-select"
            >
              <option value="general">General</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="corn">Corn</option>
              <option value="tomato">Tomato</option>
              <option value="potato">Potato</option>
            </select>
            <button
              onClick={loadWeatherData}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Current Weather */}
        {currentWeather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 mb-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <div className="text-6xl mb-2">
                  {getWeatherIcon(currentWeather.weather?.main)}
                </div>
                <h2 className="text-4xl font-bold mb-2">
                  {Math.round(currentWeather.temperature || 0)}°C
                </h2>
                <p className="text-blue-100 text-lg capitalize">
                  {currentWeather.weather?.description || 'Clear sky'}
                </p>
                <p className="text-blue-200 text-sm mt-2">
                  Feels like {Math.round(currentWeather.temperature || 0)}°C
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Droplets className="h-6 w-6 mx-auto mb-1 text-blue-200" />
                  <p className="text-2xl font-bold">{currentWeather.humidity || 0}%</p>
                  <p className="text-blue-200 text-sm">Humidity</p>
                </div>
                <div className="text-center">
                  <Wind className="h-6 w-6 mx-auto mb-1 text-blue-200" />
                  <p className="text-2xl font-bold">{Math.round(currentWeather.windSpeed || 0)} km/h</p>
                  <p className="text-blue-200 text-sm">Wind Speed</p>
                </div>
                <div className="text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-1 text-blue-200" />
                  <p className="text-2xl font-bold">{currentWeather.pressure || 0} hPa</p>
                  <p className="text-blue-200 text-sm">Pressure</p>
                </div>
                <div className="text-center">
                  <Eye className="h-6 w-6 mx-auto mb-1 text-blue-200" />
                  <p className="text-2xl font-bold">{currentWeather.visibility || 0} km</p>
                  <p className="text-blue-200 text-sm">Visibility</p>
                </div>
              </div>

              <div className="text-center lg:text-right">
                <div className="flex items-center justify-center lg:justify-end mb-4">
                  <Sunrise className="h-5 w-5 mr-2 text-yellow-300" />
                  <span>{formatTime(currentWeather.sunrise)}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-end">
                  <Sunset className="h-5 w-5 mr-2 text-orange-300" />
                  <span>{formatTime(currentWeather.sunset)}</span>
                </div>
                <p className="text-blue-200 text-sm mt-4">
                  Last updated: {formatTime(currentWeather.timestamp)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Temperature Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Temperature Trend (12 hours)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}${name === 'temperature' ? '°C' : name === 'humidity' ? '%' : '%'}`, name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Humidity & Precipitation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Humidity & Precipitation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Bar dataKey="humidity" fill="#10b981" name="Humidity" />
                  <Bar dataKey="precipitation" fill="#3b82f6" name="Rain Chance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agricultural Alerts</h2>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{alert.title}</h4>
                      <p className="mb-2">{alert.message}</p>
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Recommendations:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {alert.recommendations.map((rec, recIndex) => (
                              <li key={recIndex}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 5-Day Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {forecast.slice(0, 5).map((day, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {index === 0 ? 'Today' : formatDate(day.timestamp)}
                </p>
                <div className="text-3xl mb-2">
                  {getWeatherIcon(day.weather?.main)}
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {Math.round(day.temperature?.max || day.temperature?.current || day.temperature || 0)}°
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {Math.round(day.temperature?.min || day.temperature?.current || day.temperature || 0)}°
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {day.weather?.description || 'Clear'}
                </p>
                <div className="flex items-center justify-center mt-2 text-xs text-blue-600">
                  <Droplets className="h-3 w-3 mr-1" />
                  {Math.round((day.precipitation?.probability || 0) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Weather Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-600">Feels like</span>
                </div>
                <span className="font-medium">
                  {Math.round(currentWeather?.temperature || 0)}°C
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-600">Humidity</span>
                </div>
                <span className="font-medium">{currentWeather?.humidity || 0}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wind className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Wind</span>
                </div>
                <span className="font-medium">
                  {Math.round(currentWeather?.windSpeed || 0)} km/h
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gauge className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-gray-600">Pressure</span>
                </div>
                <span className="font-medium">{currentWeather?.pressure || 0} hPa</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Visibility</span>
                </div>
                <span className="font-medium">{currentWeather?.visibility || 0} km</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CloudSun className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-gray-600">Cloud Cover</span>
                </div>
                <span className="font-medium">{currentWeather?.cloudiness || 0}%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Health Index</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Temperature Stress</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: (currentWeather?.temperature || 0) > 35 || (currentWeather?.temperature || 0) < 10 ? '80%' : '20%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(currentWeather?.temperature || 0) > 35 || (currentWeather?.temperature || 0) < 10 ? 'High' : 'Low'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fungal Risk</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-yellow-500 rounded-full"
                      style={{ width: (currentWeather?.humidity || 0) > 80 ? '90%' : '30%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(currentWeather?.humidity || 0) > 80 ? 'High' : 'Medium'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Drought Risk</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: (currentWeather?.humidity || 0) < 30 ? '70%' : '20%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(currentWeather?.humidity || 0) < 30 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Wind Damage Risk</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-red-500 rounded-full"
                      style={{ width: (currentWeather?.windSpeed || 0) > 25 ? '80%' : '15%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(currentWeather?.windSpeed || 0) > 25 ? 'High' : 'Low'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Today's Recommendation</h4>
              <p className="text-sm text-blue-800">
                {(currentWeather?.humidity || 0) > 80 
                  ? 'High humidity detected. Monitor crops for fungal infections and ensure good air circulation.'
                  : (currentWeather?.temperature || 0) > 35 
                  ? 'High temperatures today. Increase irrigation frequency and provide shade if possible.'
                  : 'Weather conditions are favorable for most crops. Continue regular monitoring and care.'
                }
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Insights</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Optimal Conditions</span>
                </div>
                <p className="text-xs text-green-700">
                  Temperature and humidity levels are within optimal range for most crops.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Monitoring Needed</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Keep an eye on humidity levels as they approach the threshold for fungal growth.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Weekly Outlook</span>
                </div>
                <p className="text-xs text-blue-700">
                  Expect moderate temperatures with possible rainfall midweek. Plan accordingly for field activities.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Best Times for:</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>🌱 Planting</span>
                    <span className="text-green-600">Early morning</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💧 Irrigation</span>
                    <span className="text-blue-600">Evening (5-7 PM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🌾 Harvesting</span>
                    <span className="text-orange-600">Mid-morning</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🧪 Spraying</span>
                    <span className="text-purple-600">Early morning</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Weather;