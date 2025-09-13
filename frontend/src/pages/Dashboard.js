import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Camera, 
  MessageCircle, 
  CloudSun, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Users,
  Leaf,
  Brain,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    accuracyRate: 0,
    consultationsActive: 0,
    healthyScans: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API calls
    setRecentPredictions([
      {
        id: 1,
        crop: 'Tomato',
        disease: 'Late Blight',
        confidence: 94,
        status: 'high-risk',
        date: '2024-01-15',
        image: '/api/placeholder/80/80'
      },
      {
        id: 2,
        crop: 'Wheat',
        disease: 'Healthy',
        confidence: 98,
        status: 'healthy',
        date: '2024-01-14',
        image: '/api/placeholder/80/80'
      },
      {
        id: 3,
        crop: 'Rice',
        disease: 'Brown Spot',
        confidence: 87,
        status: 'medium-risk',
        date: '2024-01-13',
        image: '/api/placeholder/80/80'
      }
    ]);

    setWeatherData({
      temperature: 28,
      humidity: 65,
      condition: 'Partly Cloudy',
      risk: 'medium'
    });

    setConsultations([
      {
        id: 1,
        title: 'Tomato blight treatment',
        expert: 'Dr. Priya Sharma',
        status: 'active',
        lastMessage: '2 hours ago',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Wheat nutrient deficiency',
        expert: 'Dr. Rajesh Kumar',
        status: 'resolved',
        lastMessage: '1 day ago',
        priority: 'medium'
      }
    ]);

    setStats({
      totalPredictions: 47,
      accuracyRate: 94,
      consultationsActive: 3,
      healthyScans: 32
    });
  }, []);

  const chartData = [
    { name: 'Jan', predictions: 12, healthy: 8, diseased: 4 },
    { name: 'Feb', predictions: 15, healthy: 10, diseased: 5 },
    { name: 'Mar', predictions: 8, healthy: 6, diseased: 2 },
    { name: 'Apr', predictions: 12, healthy: 8, diseased: 4 },
  ];

  const getRiskColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'low-risk': return 'text-yellow-600 bg-yellow-100';
      case 'medium-risk': return 'text-orange-600 bg-orange-100';
      case 'high-risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'high-risk': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {user?.profile?.location?.district || 'Location not set'}, {user?.profile?.location?.state || ''}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link
                to="/predict"
                className="btn-primary flex items-center"
              >
                <Camera className="h-4 w-4 mr-2" />
                Scan Crop
              </Link>
              <Link
                to="/consultations/new"
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Consultation
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Scans</p>
                <p className="text-3xl font-bold text-white">{stats.totalPredictions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Accuracy Rate</p>
                <p className="text-3xl font-bold text-white">{stats.accuracyRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Active Consultations</p>
                <p className="text-3xl font-bold text-white">{stats.consultationsActive}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Healthy Scans</p>
                <p className="text-3xl font-bold text-white">{stats.healthyScans}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Predictions</h2>
                <Link
                  to="/predict"
                  className="text-green-400 hover:text-green-300 flex items-center text-sm font-medium"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="h-16 w-16 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                      <Leaf className="h-8 w-8 text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">{prediction.crop}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.status)}`}>
                          {prediction.disease}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-300">
                        <span>Confidence: {prediction.confidence}%</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(prediction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getStatusIcon(prediction.status)}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analytics Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Prediction Analytics</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="healthy" stackId="a" fill="#10b981" />
                    <Bar dataKey="diseased" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Weather Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Weather Alert</h3>
                <CloudSun className="h-5 w-5 text-blue-400" />
              </div>
              
              {weatherData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Temperature</span>
                    <span className="font-medium text-white">{weatherData.temperature}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Humidity</span>
                    <span className="font-medium text-white">{weatherData.humidity}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Condition</span>
                    <span className="font-medium text-white">{weatherData.condition}</span>
                  </div>
                  
                  <div className={`mt-4 p-3 rounded-lg ${
                    weatherData.risk === 'high' ? 'bg-red-900 border border-red-700' :
                    weatherData.risk === 'medium' ? 'bg-yellow-900 border border-yellow-700' :
                    'bg-green-900 border border-green-700'
                  }`}>
                    <div className="flex items-center">
                      <AlertTriangle className={`h-4 w-4 mr-2 ${
                        weatherData.risk === 'high' ? 'text-red-400' :
                        weatherData.risk === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        weatherData.risk === 'high' ? 'text-red-300' :
                        weatherData.risk === 'medium' ? 'text-yellow-300' :
                        'text-green-300'
                      }`}>
                        {weatherData.risk === 'high' ? 'High Risk' :
                         weatherData.risk === 'medium' ? 'Medium Risk' : 'Low Risk'} Conditions
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      weatherData.risk === 'high' ? 'text-red-400' :
                      weatherData.risk === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      Monitor crops for disease symptoms
                    </p>
                  </div>
                  
                  <Link
                    to="/weather"
                    className="block w-full text-center bg-blue-900 text-blue-300 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    View Detailed Forecast
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Active Consultations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 text-white p-6 rounded-xl shadow-sm border border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Consultations</h3>
                <MessageCircle className="h-5 w-5 text-purple-400" />
              </div>
              
              <div className="space-y-3">
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm mb-1">
                          {consultation.title}
                        </h4>
                        <p className="text-xs text-gray-300">
                          with {consultation.expert}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                            consultation.status === 'active' ? 'bg-green-400' : 'bg-gray-500'
                          }`}></span>
                          <span className="text-xs text-gray-300">
                            {consultation.lastMessage}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        consultation.priority === 'high' ? 'bg-red-900 text-red-300 border border-red-700' :
                        consultation.priority === 'medium' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                        'bg-green-900 text-green-300 border border-green-700'
                      }`}>
                        {consultation.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link
                to="/consultations"
                className="block w-full text-center bg-purple-900 text-purple-300 py-2 rounded-lg hover:bg-purple-800 transition-colors text-sm font-medium mt-4"
              >
                View All Consultations
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/predict"
                  className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Camera className="h-5 w-5 mr-3" />
                  <span className="font-medium">Scan New Crop</span>
                </Link>
                
                <Link
                  to="/consultations/new"
                  className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  <span className="font-medium">Ask Expert</span>
                </Link>
                
                <Link
                  to="/weather"
                  className="flex items-center p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <CloudSun className="h-5 w-5 mr-3" />
                  <span className="font-medium">Weather Forecast</span>
                </Link>
                
                <Link
                  to="/reports"
                  className="flex items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  <span className="font-medium">View Reports</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;