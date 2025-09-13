import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Camera, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Brain,
  Loader,
  Download,
  Share2,
  BookOpen,
  Thermometer,
  Droplets,
  Wind,
  Eye
} from 'lucide-react';
import { diseaseAPI, weatherAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const DiseasePrediction = () => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropType, setCropType] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState({
    temperature: '',
    humidity: '',
    soilMoisture: '',
    lastIrrigation: ''
  });
  const [weatherData, setWeatherData] = useState(null);
  const [useLocation, setUseLocation] = useState(false);

  const cropOptions = [
    { value: 'rice', label: '🌾 Rice' },
    { value: 'wheat', label: '🌾 Wheat' },
    { value: 'corn', label: '🌽 Corn' },
    { value: 'tomato', label: '🍅 Tomato' },
    { value: 'potato', label: '🥔 Potato' },
    { value: 'cotton', label: '🌱 Cotton' },
    { value: 'sugarcane', label: '🎋 Sugarcane' },
    { value: 'soybean', label: '🫘 Soybean' },
    { value: 'other', label: '🌿 Other' }
  ];

  // Image upload handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  // Get current location and weather
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const weather = await weatherAPI.getCurrent({ latitude, longitude });
      
      setWeatherData(weather.data);
      setEnvironmentalData(prev => ({
        ...prev,
        temperature: weather.data.temperature?.toString() || '',
        humidity: weather.data.humidity?.toString() || ''
      }));
      
      toast.success('Location and weather data loaded');
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Could not get location data');
    } finally {
      setLoading(false);
    }
  };

// Submit prediction
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedImage) {
    toast.error('Please select an image');
    return;
  }

  if (!cropType) {
    toast.error('Please select a crop type');
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    // Add the image with its name to ensure Cloudinary receives it
    formData.append('image', selectedImage, selectedImage.name);
    formData.append('cropType', cropType);

    if (environmentalData.temperature || environmentalData.humidity || environmentalData.soilMoisture || environmentalData.lastIrrigation) {
      formData.append('environmentalData', JSON.stringify(environmentalData));
    }

    console.log('Sending FormData:', selectedImage); // debug

    const response = await diseaseAPI.predict(formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log('🔍 Full API Response:', response.data);
    console.log('🎯 Prediction Data:', response.data.data);
    console.log('🏷️ Disease Name:', response.data.data?.prediction?.diseaseName);
    console.log('📊 Confidence:', response.data.data?.prediction?.confidence);

    // FIXED: Access the nested data structure correctly
    const predictionData = {
      prediction: {
        diseaseName: response.data.data?.prediction?.diseaseName || 'Unknown',
        confidence: (response.data.data?.prediction?.confidence || 0) * 100, // Convert to percentage
        alternativePredictions: response.data.data?.prediction?.alternativePredictions || []
      },
      diseaseDetails: response.data.data?.diseaseDetails || null,
      recommendation: response.data.data?.recommendation || null,
      imageUrl: response.data.data?.imageUrl || null,
      predictionMethod: response.data.data?.predictionMethod || 'unknown'
    };

    console.log('📋 Processed prediction data:', predictionData);
    
    setPrediction(predictionData);
    toast.success('Analysis complete!');
  } catch (error) {
    console.error('Prediction error:', error.response?.data || error);
    toast.error(error.response?.data?.message || 'Prediction failed');
  } finally {
    setLoading(false);
  }
};


  // Reset form
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCropType('');
    setPrediction(null);
    setEnvironmentalData({
      temperature: '',
      humidity: '',
      soilMoisture: '',
      lastIrrigation: ''
    });
    setWeatherData(null);
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get disease status color
// Get disease status color
const getDiseaseStatusColor = (diseaseName) => {
  // Add null/undefined check
  if (!diseaseName || typeof diseaseName !== 'string') {
    return 'text-gray-600 bg-gray-100';
  }
  
  const lowerCaseName = diseaseName.toLowerCase();
  
  if (lowerCaseName.includes('healthy')) {
    return 'text-green-600 bg-green-100';
  }
  if (lowerCaseName.includes('unable') || lowerCaseName.includes('unknown')) {
    return 'text-gray-600 bg-gray-100';
  }
  return 'text-red-600 bg-red-100';
};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Disease Detection</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a photo of your crop and get instant AI-powered disease diagnosis with treatment recommendations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Crop Image</h2>
              
              {!imagePreview ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-full mb-4">
                      {isDragActive ? (
                        <Download className="h-8 w-8 text-blue-600" />
                      ) : (
                        <Camera className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isDragActive ? 'Drop image here' : 'Upload crop image'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag & drop or click to select an image of your crop
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>• PNG, JPG, JPEG up to 10MB</span>
                      <span>• Clear, well-lit photos work best</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Crop preview"
                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImage?.name}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Crop Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Crop Type *</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select crop type</option>
                    {cropOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Environmental Data */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Environmental Data (Optional)</h3>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={loading}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Wind className="h-4 w-4 mr-1" />
                      {loading ? 'Getting...' : 'Auto-fill from location'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Temperature (°C)</label>
                      <div className="relative">
                        <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={environmentalData.temperature}
                          onChange={(e) => setEnvironmentalData(prev => ({
                            ...prev,
                            temperature: e.target.value
                          }))}
                          className="form-input pl-10"
                          placeholder="25"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Humidity (%)</label>
                      <div className="relative">
                        <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={environmentalData.humidity}
                          onChange={(e) => setEnvironmentalData(prev => ({
                            ...prev,
                            humidity: e.target.value
                          }))}
                          className="form-input pl-10"
                          placeholder="65"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Soil Moisture (%)</label>
                      <input
                        type="number"
                        value={environmentalData.soilMoisture}
                        onChange={(e) => setEnvironmentalData(prev => ({
                          ...prev,
                          soilMoisture: e.target.value
                        }))}
                        className="form-input"
                        placeholder="45"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="form-label">Last Irrigation</label>
                      <input
                        type="date"
                        value={environmentalData.lastIrrigation}
                        onChange={(e) => setEnvironmentalData(prev => ({
                          ...prev,
                          lastIrrigation: e.target.value
                        }))}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading || !selectedImage || !cropType}
                    className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Analyze Crop
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Weather Card */}
            {weatherData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Weather</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature</span>
                    <span className="font-medium text-gray-900">{weatherData.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Humidity</span>
                    <span className="font-medium text-gray-900">{weatherData.humidity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition</span>
                    <span className="font-medium text-gray-900">{weatherData.weather?.description}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prediction Results */}
            {prediction && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Disease Detection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Disease Detection</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.prediction?.confidence || 0)}`}>
                      {Math.round(prediction.prediction?.confidence || 0)}% confidence
                    </span>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 ${getDiseaseStatusColor(prediction.prediction?.diseaseName)}`}>
                    <div className="flex items-center">
                      {prediction.prediction?.diseaseName?.toLowerCase().includes('healthy') ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="font-semibold">
                        {prediction.prediction?.diseaseName || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alternative Predictions */}
                {prediction.prediction?.alternativePredictions?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Alternative Possibilities</h4>
                    <div className="space-y-2">
                      {prediction.prediction.alternativePredictions.slice(0, 3).map((alt, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{alt.diseaseName}</span>
                          <span className="text-sm text-gray-500">{Math.round(alt.confidence)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disease Details */}
                {prediction.diseaseDetails && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Disease Information</h4>
                    <div className="space-y-3">
                      {prediction.diseaseDetails.description && (
                        <p className="text-sm text-gray-600">{prediction.diseaseDetails.description}</p>
                      )}
                      
                      {prediction.diseaseDetails.symptoms?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Symptoms:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {prediction.diseaseDetails.symptoms.map((symptom, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                {symptom.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment Recommendations */}
                {prediction.diseaseDetails?.treatment && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Treatment Options</h4>
                    
                    {prediction.diseaseDetails.treatment.organic?.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-green-700 mb-2">🌿 Organic Treatment</h5>
                        <div className="space-y-2">
                          {prediction.diseaseDetails.treatment.organic.slice(0, 2).map((treatment, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm font-medium text-gray-900">{treatment.method}</p>
                              {treatment.procedure && (
                                <p className="text-sm text-gray-600 mt-1">{treatment.procedure}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prediction.diseaseDetails.treatment.chemical?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-blue-700 mb-2">🧪 Chemical Treatment</h5>
                        <div className="space-y-2">
                          {prediction.diseaseDetails.treatment.chemical.slice(0, 2).map((treatment, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-gray-900">{treatment.pesticide}</p>
                              {treatment.dosage && (
                                <p className="text-sm text-gray-600 mt-1">Dosage: {treatment.dosage}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendation */}
                {prediction.recommendation && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{prediction.recommendation}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Better Results</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <Eye className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  Take clear, well-lit photos focusing on affected areas
                </li>
                <li className="flex items-start">
                  <Camera className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  Include multiple leaves or plant parts if possible
                </li>
                <li className="flex items-start">
                  <Upload className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  Higher resolution images (2MB+) work better
                </li>
                <li className="flex items-start">
                  <Thermometer className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  Environmental data improves accuracy
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default DiseasePrediction;