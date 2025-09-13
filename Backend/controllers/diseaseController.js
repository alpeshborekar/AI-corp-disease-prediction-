const axios = require('axios');
const Disease = require('../models/Disease');
const Consultation = require('../models/Consultation');
const { uploadToCloudinary } = require('../utils/cloudinaryUtils');
const { getWeatherData, validateCoordinates } = require('../utils/weatherService');



// AI Model Prediction
exports.predictDisease = async (req, res) => {
  try {
    // 1️⃣ Validate image
    const file = req.files?.image || req.file;
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Image file is required for prediction'
      });
    }

    // 2️⃣ Validate cropType
    const { cropType, location, environmentalData } = req.body;
    if (!cropType) {
      return res.status(400).json({
        status: 'error',
        message: 'Crop type is required for prediction'
      });
    }

    // 3️⃣ Upload image to Cloudinary
    let uploadResult;
    try {
      const filePath = file.tempFilePath || file.path;
      uploadResult = await uploadToCloudinary(filePath, 'predictions');
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ status: 'error', message: 'Failed to upload image' });
    }

    // 4️⃣ Prepare data for AI model
    const predictionData = {
      imageUrl: uploadResult.secure_url,
      cropType,
      environmentalData: environmentalData ? JSON.parse(environmentalData) : null
    };

    // 5️⃣ Get weather data if location provided
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

    // 6️⃣ Call AI model
    let aiPrediction;
    try {
      const response = await axios.post(
        `${process.env.AI_MODEL_BASE_URL}/predict`,
        predictionData,
        { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
      );
      aiPrediction = response.data;
    } catch (aiError) {
      console.error('AI model error:', aiError.message);
      // Fallback to rule-based prediction
      aiPrediction = await performRuleBasedPrediction(cropType, predictionData.weatherData);
    }

    // 7️⃣ Get disease details from DB
    let diseaseDetails = null;
    if (aiPrediction.diseaseName) {
      diseaseDetails = await Disease.findOne({
        name: { $regex: aiPrediction.diseaseName, $options: 'i' },
        cropType,
        isActive: true
      });
    }

    // 8️⃣ Create consultation entry if user is logged in
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

    // 9️⃣ Prepare response
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
          symptoms: diseaseDetails.symptoms.slice(0, 3),
          prevention: diseaseDetails.prevention.slice(0, 2),
          treatment: {
            organic: diseaseDetails.treatment.organic?.slice(0, 2) || [],
            chemical: diseaseDetails.treatment.chemical?.slice(0, 2) || []
          }
        } : null,
        consultationId,
        imageUrl: uploadResult.secure_url,
        timestamp: new Date()
      }
    };

    // Add recommendation based on confidence
    if (aiPrediction.confidence < 0.6) {
      response.data.recommendation = 'Low confidence prediction. Consider consulting an expert.';
    } else if (aiPrediction.confidence < 0.8) {
      response.data.recommendation = 'Moderate confidence prediction. Monitor and take preventive measures.';
    } else {
      response.data.recommendation = 'High confidence prediction. Follow recommended treatment guidelines.';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Disease prediction error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to predict disease. Please try again.'
    });
  }
};

// Fallback rule-based prediction
const performRuleBasedPrediction = async (cropType, weatherData) => {
  try {
    const conditions = {};
    if (weatherData) {
      conditions.temperature = weatherData.temperature;
      conditions.humidity = weatherData.humidity;
      conditions.season = weatherData.temperature > 30 ? 'summer' :
                          weatherData.temperature < 15 ? 'winter' : 'monsoon';
    }

    const possibleDiseases = await Disease.findByEnvironmentalConditions(conditions);
    const cropSpecificDiseases = possibleDiseases.filter(d => d.cropType === cropType || d.cropType === 'other');

    if (cropSpecificDiseases.length > 0) {
      return {
        diseaseName: cropSpecificDiseases[0].name,
        confidence: 0.5,
        alternativePredictions: cropSpecificDiseases.slice(1, 4).map(d => ({ diseaseName: d.name, confidence: 0.3 }))
      };
    }

    return { diseaseName: 'Unknown Disease', confidence: 0.2, alternativePredictions: [] };
  } catch (error) {
    console.error('Rule-based prediction error:', error);
    return { diseaseName: 'Prediction Failed', confidence: 0, alternativePredictions: [] };
  }
};
