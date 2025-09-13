const express = require('express');
const axios = require('axios');
const Disease = require('../models/Disease');
const Consultation = require('../models/Consultation');
const { uploadToCloudinary } = require('../utils/cloudinaryUtils');
const { getWeatherData, validateCoordinates } = require('../utils/weatherService');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ----------------- ENHANCED RULE-BASED PREDICTION -----------------
const performAdvancedRuleBasedPrediction = async (cropType, weatherData, imageAnalysis = null) => {
  try {
    console.log(`🔍 Analyzing ${cropType} with weather:`, weatherData);
    
    // Get diseases from database
    let diseases = await Disease.find({ 
      cropType: cropType?.toLowerCase(),
      isActive: { $ne: false }
    });

    // Fallback disease data if database is empty
    if (diseases.length === 0) {
      diseases = getFallbackDiseases(cropType);
    }

    console.log(`📊 Found ${diseases.length} diseases for ${cropType}`);

    // Score each disease based on conditions
    const scoredDiseases = diseases.map(disease => {
      let score = 0;
      let factors = [];

      // Base confidence for the disease
      const baseConfidence = getBaseConfidence(disease.name, cropType);
      score += baseConfidence;
      factors.push(`Base: ${(baseConfidence * 100).toFixed(0)}%`);

      // Weather-based scoring
      if (weatherData) {
        const weatherScore = getWeatherScore(disease, weatherData);
        score += weatherScore;
        if (weatherScore > 0) {
          factors.push(`Weather: +${(weatherScore * 100).toFixed(0)}%`);
        }
      }

      // Seasonal factors
      const seasonalScore = getSeasonalScore(disease, weatherData);
      score += seasonalScore;
      if (seasonalScore > 0) {
        factors.push(`Season: +${(seasonalScore * 100).toFixed(0)}%`);
      }

      // Calculate final confidence (max 95%)
      const confidence = Math.min(score, 0.95);

      return {
        name: disease.name,
        confidence: Math.max(confidence, 0.1), // Minimum 10%
        symptoms: disease.symptoms || [],
        treatments: disease.treatments || disease.treatment || [],
        severity: disease.severity || 'medium',
        causes: disease.causes || [],
        prevention: disease.prevention || [],
        factors: factors,
        commonNames: disease.commonNames || []
      };
    });

    // Sort by confidence
    scoredDiseases.sort((a, b) => b.confidence - a.confidence);

    // Ensure we have at least one prediction
    if (scoredDiseases.length === 0) {
      return getFallbackPrediction(cropType);
    }

    const topPrediction = scoredDiseases[0];
    const alternatives = scoredDiseases.slice(1, 4).map(d => ({
      diseaseName: d.name,
      confidence: d.confidence
    }));

    console.log(`✅ Top prediction: ${topPrediction.name} (${(topPrediction.confidence * 100).toFixed(1)}%)`);

    return {
      diseaseName: topPrediction.name,
      confidence: topPrediction.confidence,
      alternativePredictions: alternatives,
      method: 'enhanced_rule_based',
      details: {
        cropType: cropType,
        weatherConsidered: !!weatherData,
        totalDiseases: diseases.length,
        factors: topPrediction.factors
      }
    };

  } catch (error) {
    console.error('Enhanced prediction error:', error);
    return getFallbackPrediction(cropType);
  }
};

// Get weather-based confidence boost
const getWeatherScore = (disease, weather) => {
  let score = 0;
  
  if (!weather) return 0;
  
  const causes = disease.causes || [];
  const causesText = causes.join(' ').toLowerCase();
  
  // High humidity favors fungal diseases
  if (weather.humidity > 70) {
    if (causesText.includes('fungal') || causesText.includes('humid') || 
        causesText.includes('moisture') || disease.name.toLowerCase().includes('blight')) {
      score += 0.15;
    }
  }
  
  // Temperature ranges for different diseases
  if (weather.temperature > 25 && weather.temperature < 35) {
    if (causesText.includes('warm') || disease.name.toLowerCase().includes('blast')) {
      score += 0.1;
    }
  }
  
  // Cool wet conditions
  if (weather.temperature < 20 && weather.humidity > 80) {
    if (disease.name.toLowerCase().includes('late blight') || causesText.includes('cool')) {
      score += 0.2;
    }
  }
  
  return score;
};

// Seasonal scoring
const getSeasonalScore = (disease, weather) => {
  if (!weather || !weather.temperature) return 0;
  
  let score = 0;
  const temp = weather.temperature;
  const diseaseName = disease.name.toLowerCase();
  
  // Summer diseases (temp > 30)
  if (temp > 30) {
    if (diseaseName.includes('bacterial') || diseaseName.includes('wilt')) {
      score += 0.1;
    }
  }
  
  // Monsoon diseases (temp 20-30, high humidity)
  if (temp > 20 && temp < 30 && weather.humidity > 60) {
    if (diseaseName.includes('blight') || diseaseName.includes('spot') || diseaseName.includes('blast')) {
      score += 0.1;
    }
  }
  
  return score;
};

// Base confidence for common diseases
const getBaseConfidence = (diseaseName, cropType) => {
  const confidenceMap = {
    tomato: {
      'Early Blight': 0.6,
      'Late Blight': 0.55,
      'Bacterial Speck': 0.45,
      'Anthracnose': 0.5,
      'Septoria Leaf Spot': 0.45,
      'Bacterial Wilt': 0.4
    },
    rice: {
      'Rice Blast': 0.65,
      'Brown Spot': 0.55,
      'Bacterial Blight': 0.6,
      'Sheath Blight': 0.5,
      'Tungro Virus': 0.4
    }
  };
  
  return confidenceMap[cropType?.toLowerCase()]?.[diseaseName] || 0.35;
};

// Fallback diseases when database is empty
const getFallbackDiseases = (cropType) => {
  const fallbackData = {
    tomato: [
      {
        name: 'Early Blight',
        symptoms: ['dark spots', 'concentric rings', 'yellow halos', 'fruit lesions'],
        causes: ['fungal infection', 'alternaria solani', 'warm humid conditions'],
        treatments: ['fungicide spray', 'copper treatments', 'remove affected parts'],
        severity: 'medium'
      },
      {
        name: 'Late Blight',
        symptoms: ['water-soaked lesions', 'white fuzzy growth', 'brown patches'],
        causes: ['phytophthora infestans', 'cool wet weather', 'high humidity'],
        treatments: ['copper fungicides', 'remove infected plants', 'improve drainage'],
        severity: 'high'
      },
      {
        name: 'Bacterial Speck',
        symptoms: ['small dark spots', 'yellow halos', 'pinpoint lesions'],
        causes: ['pseudomonas syringae', 'cool wet conditions', 'wind-driven rain'],
        treatments: ['copper bactericides', 'remove infected plants'],
        severity: 'low'
      }
    ],
    rice: [
      {
        name: 'Rice Blast',
        symptoms: ['diamond-shaped lesions', 'gray centers', 'dark borders'],
        causes: ['fungal infection', 'high humidity', 'warm temperature'],
        treatments: ['fungicide spray', 'resistant varieties', 'crop rotation'],
        severity: 'high'
      },
      {
        name: 'Brown Spot',
        symptoms: ['brown oval spots', 'yellow halos', 'seedling blight'],
        causes: ['fungal infection', 'nutrient deficiency', 'drought stress'],
        treatments: ['seed treatment', 'foliar fungicides', 'balanced nutrition'],
        severity: 'medium'
      }
    ]
  };
  
  return fallbackData[cropType?.toLowerCase()] || [
    {
      name: 'General Plant Disease',
      symptoms: ['discoloration', 'spots', 'wilting'],
      causes: ['various pathogens', 'environmental stress'],
      treatments: ['general fungicide', 'improve plant care'],
      severity: 'medium'
    }
  ];
};

// Fallback prediction when everything fails
const getFallbackPrediction = (cropType) => {
  const fallbackPredictions = {
    tomato: { name: 'Early Blight', confidence: 0.4 },
    rice: { name: 'Rice Blast', confidence: 0.4 },
    default: { name: 'General Plant Disease', confidence: 0.3 }
  };
  
  const prediction = fallbackPredictions[cropType?.toLowerCase()] || fallbackPredictions.default;
  
  return {
    diseaseName: prediction.name,
    confidence: prediction.confidence,
    alternativePredictions: [],
    method: 'fallback'
  };
};

// ----------------- PREDICT DISEASE (UPDATED) -----------------
const predictDisease = async (req, res) => {
  try {
    const file = req.files?.image || req.file;
    if (!file) return res.status(400).json({ status: 'error', message: 'Image file is required for prediction' });

    const { cropType, location, environmentalData } = req.body;
    if (!cropType) return res.status(400).json({ status: 'error', message: 'Crop type is required for prediction' });

    let uploadResult;
    try {
      const filePath = file.tempFilePath || file.path;
      uploadResult = await uploadToCloudinary(filePath, 'predictions');
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ status: 'error', message: 'Failed to upload image' });
    }

    const predictionData = {
      imageUrl: uploadResult.secure_url,
      cropType,
      environmentalData: environmentalData ? JSON.parse(environmentalData) : null
    };

    // Get weather data if location provided
    if (location) {
      try {
        const locationData = JSON.parse(location);
        const { latitude, longitude } = locationData.coordinates || {};
        if (validateCoordinates(latitude, longitude)) {
          const weatherData = await getWeatherData(latitude, longitude);
          predictionData.weatherData = weatherData;
        }
      } catch (weatherError) {
        console.error('Weather data error:', weatherError);
      }
    }

    // Try AI model first, fallback to enhanced rule-based
    let aiPrediction;
    const aiModelUrl = process.env.AI_MODEL_BASE_URL;
    
    if (aiModelUrl && aiModelUrl !== 'undefined' && aiModelUrl.trim() !== '') {
      try {
        console.log('🤖 Trying AI model at:', aiModelUrl);
        const response = await axios.post(
          `${aiModelUrl}/predict`,
          predictionData,
          { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
        );
        aiPrediction = response.data;
        console.log('✅ AI model prediction successful');
      } catch (aiError) {
        console.error('❌ AI model failed:', aiError.message);
        aiPrediction = await performAdvancedRuleBasedPrediction(cropType, predictionData.weatherData);
      }
    } else {
      console.log('🔧 Using enhanced rule-based prediction (no AI model configured)');
      aiPrediction = await performAdvancedRuleBasedPrediction(cropType, predictionData.weatherData);
    }

    // Get disease details from database
    let diseaseDetails = null;
    if (aiPrediction.diseaseName) {
      diseaseDetails = await Disease.findOne({
        name: { $regex: aiPrediction.diseaseName, $options: 'i' },
        cropType,
        isActive: { $ne: false }
      });
    }

    // Create consultation if user is authenticated
    let consultationId = null;
    if (req.user) {
      try {
        const consultation = new Consultation({
          title: `Disease Prediction - ${cropType}`,
          description: `AI prediction request for ${cropType} disease`,
          farmer: req.user.userId,
          cropType,
          category: 'disease-diagnosis',
          priority: aiPrediction.confidence < 0.7 ? 'high' : 'medium',
          images: [{ url: uploadResult.secure_url, publicId: uploadResult.public_id, description: 'Crop image' }],
          aiPrediction: {
            diseaseName: aiPrediction.diseaseName,
            confidence: aiPrediction.confidence,
            alternativePredictions: aiPrediction.alternativePredictions || [],
            predictedAt: new Date()
          },
          location: location ? JSON.parse(location) : undefined,
          environmentalData: predictionData.environmentalData
        });
        await consultation.save();
        consultationId = consultation._id;
      } catch (consultationError) {
        console.error('Consultation creation error:', consultationError);
      }
    }

    // Build response
    const response = {
      status: 'success',
      data: {
        prediction: {
          diseaseName: aiPrediction.diseaseName,
          confidence: aiPrediction.confidence,
          alternativePredictions: aiPrediction.alternativePredictions || []
        },
        diseaseDetails: diseaseDetails ? {
          id: diseaseDetails._id,
          name: diseaseDetails.name,
          description: diseaseDetails.description,
          severity: diseaseDetails.severity,
          symptoms: diseaseDetails.symptoms?.slice(0, 3) || [],
          prevention: diseaseDetails.prevention?.slice(0, 2) || [],
          treatment: {
            organic: diseaseDetails.treatment?.organic?.slice(0, 2) || diseaseDetails.treatments?.slice(0, 2) || [],
            chemical: diseaseDetails.treatment?.chemical?.slice(0, 2) || []
          }
        } : null,
        consultationId,
        imageUrl: uploadResult.secure_url,
        timestamp: new Date(),
        predictionMethod: aiPrediction.method || 'rule_based'
      }
    };

    // Add confidence-based recommendations
    if (aiPrediction.confidence < 0.4) {
      response.data.recommendation = 'Very low confidence prediction. Strongly recommend consulting an agricultural expert.';
    } else if (aiPrediction.confidence < 0.6) {
      response.data.recommendation = 'Low confidence prediction. Consider consulting an expert for confirmation.';
    } else if (aiPrediction.confidence < 0.8) {
      response.data.recommendation = 'Moderate confidence prediction. Monitor closely and take preventive measures.';
    } else {
      response.data.recommendation = 'High confidence prediction. Follow recommended treatment guidelines.';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Disease prediction error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to predict disease. Please try again.' });
  }
};

// ----------------- ORIGINAL RULE-BASED PREDICTION (LEGACY) -----------------
const performRuleBasedPrediction = async (cropType, weatherData) => {
  try {
    const conditions = {};
    if (weatherData) {
      conditions.temperature = weatherData.temperature;
      conditions.humidity = weatherData.humidity;
      conditions.season = weatherData.temperature > 30 ? 'summer' :
                          weatherData.temperature < 15 ? 'winter' : 'monsoon';
    }

    const possibleDiseases = await Disease.find({ cropType: cropType?.toLowerCase() });
    
    if (possibleDiseases.length > 0) {
      return {
        diseaseName: possibleDiseases[0].name,
        confidence: 0.5,
        alternativePredictions: possibleDiseases.slice(1, 4).map(d => ({ diseaseName: d.name, confidence: 0.3 }))
      };
    }

    return { diseaseName: 'Unknown Disease', confidence: 0.2, alternativePredictions: [] };
  } catch (error) {
    console.error('Rule-based prediction error:', error);
    return { diseaseName: 'Prediction Failed', confidence: 0, alternativePredictions: [] };
  }
};

// ----------------- OTHER ROUTE HANDLERS (UNCHANGED) -----------------
const getAllDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find({ isActive: { $ne: false } });
    res.status(200).json({ status: 'success', data: diseases });
  } catch (error) {
    console.error('Get all diseases error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch diseases' });
  }
};

const getDiseaseById = async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ status: 'error', message: 'Disease not found' });
    }
    res.status(200).json({ status: 'success', data: disease });
  } catch (error) {
    console.error('Get disease by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch disease' });
  }
};

const createDisease = async (req, res) => {
  res.status(501).json({ status: 'error', message: 'Create disease not implemented' });
};

const updateDisease = async (req, res) => {
  res.status(501).json({ status: 'error', message: 'Update disease not implemented' });
};

const deleteDisease = async (req, res) => {
  res.status(501).json({ status: 'error', message: 'Delete disease not implemented' });
};

const getDiseaseStatistics = async (req, res) => {
  res.status(501).json({ status: 'error', message: 'Disease statistics not implemented' });
};

const getEnvironmentalRisk = async (req, res) => {
  res.status(501).json({ status: 'error', message: 'Environmental risk not implemented' });
};

const searchDiseases = async (req, res) => {
  try {
    const { query } = req.query;
    const diseases = await Disease.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      isActive: { $ne: false }
    });
    res.status(200).json({ status: 'success', data: diseases });
  } catch (error) {
    console.error('Search diseases error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to search diseases' });
  }
};

// ----------------- DEFINE ROUTES -----------------
router.post('/predict', predictDisease);
router.get('/', getAllDiseases);
router.get('/search', searchDiseases);
router.get('/statistics', protect, getDiseaseStatistics);
router.get('/environmental-risk', getEnvironmentalRisk);
router.get('/:id', getDiseaseById);
router.post('/', protect, createDisease);
router.put('/:id', protect, updateDisease);
router.delete('/:id', protect, deleteDisease);




// ----------------- EXPORT ROUTER -----------------
module.exports = router;