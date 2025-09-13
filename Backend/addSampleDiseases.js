// Run this script to add sample disease data to your MongoDB
// Save as: addSampleDiseases.js and run with: node addSampleDiseases.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Disease Schema (adjust based on your actual schema)
const diseaseSchema = new mongoose.Schema({
  name: String,
  cropType: String,
  description: String,
  severity: String,
  symptoms: [{ description: String }],
  prevention: [String],
  treatment: {
    organic: [{ method: String, procedure: String }],
    chemical: [{ pesticide: String, dosage: String }]
  },
  isActive: { type: Boolean, default: true },
  environmentalConditions: {
    temperature: { min: Number, max: Number },
    humidity: { min: Number, max: Number },
    season: String
  }
});

const Disease = mongoose.model('Disease', diseaseSchema);

const sampleDiseases = [
  {
    name: "Rice Blast",
    cropType: "rice",
    description: "A fungal disease that affects rice plants, causing lesions on leaves and stems",
    severity: "high",
    symptoms: [
      { description: "Diamond-shaped lesions with gray centers" },
      { description: "Brown borders around lesions" },
      { description: "Leaf yellowing and wilting" }
    ],
    prevention: [
      "Use resistant rice varieties",
      "Maintain proper field drainage",
      "Avoid excessive nitrogen fertilization"
    ],
    treatment: {
      organic: [
        { method: "Neem oil spray", procedure: "Apply 2-3ml per liter of water weekly" },
        { method: "Trichoderma application", procedure: "Mix with soil before planting" }
      ],
      chemical: [
        { pesticide: "Propiconazole", dosage: "0.1% solution spray" },
        { pesticide: "Tricyclazole", dosage: "0.6g per liter of water" }
      ]
    },
    isActive: true,
    environmentalConditions: {
      temperature: { min: 25, max: 30 },
      humidity: { min: 80, max: 95 },
      season: "monsoon"
    }
  },
  {
    name: "Brown Spot",
    cropType: "rice",
    description: "Fungal disease causing brown spots on rice leaves and grains",
    severity: "medium",
    symptoms: [
      { description: "Small brown circular spots on leaves" },
      { description: "Spots may have yellow halos" },
      { description: "Premature leaf death" }
    ],
    prevention: [
      "Use certified disease-free seeds",
      "Maintain balanced fertilization",
      "Ensure proper plant spacing"
    ],
    treatment: {
      organic: [
        { method: "Copper sulfate spray", procedure: "0.2% solution application" },
        { method: "Bordeaux mixture", procedure: "1% solution spray" }
      ],
      chemical: [
        { pesticide: "Mancozeb", dosage: "2g per liter of water" },
        { pesticide: "Carbendazim", dosage: "1g per liter of water" }
      ]
    },
    isActive: true,
    environmentalConditions: {
      temperature: { min: 28, max: 32 },
      humidity: { min: 85, max: 95 },
      season: "monsoon"
    }
  },
  {
    name: "Healthy Rice",
    cropType: "rice",
    description: "Healthy rice plant with no visible disease symptoms",
    severity: "none",
    symptoms: [
      { description: "Green healthy leaves" },
      { description: "No spots or lesions" },
      { description: "Normal growth pattern" }
    ],
    prevention: [
      "Continue good agricultural practices",
      "Monitor regularly for early signs",
      "Maintain field hygiene"
    ],
    treatment: {
      organic: [],
      chemical: []
    },
    isActive: true,
    environmentalConditions: {
      temperature: { min: 20, max: 35 },
      humidity: { min: 60, max: 90 },
      season: "any"
    }
  },
  {
    name: "Late Blight",
    cropType: "tomato",
    description: "Serious fungal disease affecting tomato plants",
    severity: "high",
    symptoms: [
      { description: "Dark water-soaked spots on leaves" },
      { description: "White fuzzy growth on leaf undersides" },
      { description: "Brown fruit rot" }
    ],
    prevention: [
      "Use resistant varieties",
      "Improve air circulation",
      "Avoid overhead watering"
    ],
    treatment: {
      organic: [
        { method: "Baking soda spray", procedure: "1 tsp per liter of water" },
        { method: "Copper fungicide", procedure: "Follow label instructions" }
      ],
      chemical: [
        { pesticide: "Chlorothalonil", dosage: "2ml per liter" },
        { pesticide: "Metalaxyl", dosage: "1g per liter" }
      ]
    },
    isActive: true,
    environmentalConditions: {
      temperature: { min: 15, max: 25 },
      humidity: { min: 85, max: 95 },
      season: "monsoon"
    }
  }
];

async function addSampleDiseases() {
  try {
    // Clear existing diseases (optional)
    await Disease.deleteMany({});
    console.log('Cleared existing diseases');

    // Add sample diseases
    const result = await Disease.insertMany(sampleDiseases);
    console.log(`Added ${result.length} sample diseases to database`);
    
    console.log('Sample diseases added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample diseases:', error);
    process.exit(1);
  }
}

addSampleDiseases();