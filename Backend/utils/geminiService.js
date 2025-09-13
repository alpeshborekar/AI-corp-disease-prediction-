const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      console.warn('⚠️ Gemini API key not configured');
    }
  }

  // Convert image to base64
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      return {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  // Get MIME type from file extension
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  // Predict disease from image
  async predictDisease(imagePath, cropType, environmentalData = null) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Convert image to base64
      const imageData = await this.imageToBase64(imagePath);

      // Create comprehensive prompt for disease prediction
      const prompt = this.createDiseasePrompt(cropType, environmentalData);

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            imageData
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return this.parseGeminiResponse(response.data);

    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw new Error(`Disease prediction failed: ${error.message}`);
    }
  }

  // Create detailed prompt for disease prediction
  createDiseasePrompt(cropType, environmentalData) {
    let prompt = `You are an expert agricultural pathologist. Analyze this ${cropType} plant image for diseases.

Please provide your analysis in this exact JSON format:
{
  "diseaseName": "exact disease name or 'Healthy Plant' or 'Unable to Determine'",
  "confidence": 0.85,
  "severity": "low|medium|high|critical",
  "affectedParts": ["leaves", "stem", "roots", "fruits"],
  "symptoms": ["list of visible symptoms"],
  "possibleCauses": ["environmental factors", "pathogen type"],
  "recommendations": ["immediate actions to take"],
  "alternativePredictions": [
    {"diseaseName": "alternative diagnosis", "confidence": 0.65},
    {"diseaseName": "another possibility", "confidence": 0.45}
  ]
}

Consider these factors:
1. Crop type: ${cropType}
2. Visible symptoms (discoloration, spots, wilting, deformities)
3. Pattern of damage (localized, widespread, systematic)
4. Plant part affected (leaves, stem, roots, fruits)`;

    // Add environmental context if available
    if (environmentalData) {
      prompt += `
5. Environmental conditions:`;
      
      if (environmentalData.temperature) {
        prompt += `\n   - Temperature: ${environmentalData.temperature}°C`;
      }
      if (environmentalData.humidity) {
        prompt += `\n   - Humidity: ${environmentalData.humidity}%`;
      }
      if (environmentalData.soilMoisture) {
        prompt += `\n   - Soil moisture: ${environmentalData.soilMoisture}%`;
      }
      if (environmentalData.lastIrrigation) {
        prompt += `\n   - Last irrigation: ${environmentalData.lastIrrigation}`;
      }
    }

    prompt += `

Important: Provide confidence scores based on image clarity and symptom visibility. If the image is unclear or shows a healthy plant, indicate this honestly with appropriate confidence levels.`;

    return prompt;
  }

  // Parse Gemini response and structure the output
  parseGeminiResponse(responseData) {
    try {
      if (!responseData.candidates || responseData.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const content = responseData.candidates[0].content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const text = content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, create structured response from text
        return this.createFallbackResponse(text);
      }

      try {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        return {
          diseaseName: parsedResponse.diseaseName || 'Unable to Determine',
          confidence: Math.min(Math.max(parsedResponse.confidence || 0.5, 0), 1),
          severity: parsedResponse.severity || 'medium',
          affectedParts: parsedResponse.affectedParts || [],
          symptoms: parsedResponse.symptoms || [],
          possibleCauses: parsedResponse.possibleCauses || [],
          recommendations: parsedResponse.recommendations || [],
          alternativePredictions: parsedResponse.alternativePredictions || [],
          rawResponse: text
        };
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback');
        return this.createFallbackResponse(text);
      }

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  // Create fallback response when JSON parsing fails
  createFallbackResponse(text) {
    // Extract disease name (simple pattern matching)
    const diseaseMatch = text.match(/disease[:\s]*([^\n,.]+)/i);
    const confidenceMatch = text.match(/confidence[:\s]*(\d+(?:\.\d+)?)/i);
    
    return {
      diseaseName: diseaseMatch ? diseaseMatch[1].trim() : 'Analysis Available',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.6,
      severity: 'medium',
      affectedParts: [],
      symptoms: [],
      possibleCauses: [],
      recommendations: [],
      alternativePredictions: [],
      rawResponse: text,
      note: 'Detailed analysis available in raw response'
    };
  }

  // Text-only analysis for general crop advice
  async getCropAdvice(question, cropType, location = null) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `You are an agricultural expert. Provide practical advice for this question about ${cropType} farming.

Question: ${question}

${location ? `Location context: ${location}` : ''}

Please provide:
1. Direct answer to the question
2. Practical recommendations
3. Prevention tips if applicable
4. Best practices for ${cropType} cultivation

Keep the response informative but concise (max 300 words).`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512
        }
      };

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      return {
        advice: content || 'Unable to generate advice at this time.',
        cropType,
        question
      };

    } catch (error) {
      console.error('Gemini advice error:', error.message);
      throw new Error('Failed to get crop advice');
    }
  }

  // Check if service is available
  async isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = new GeminiService();