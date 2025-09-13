const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disease name is required'],
    trim: true,
    unique: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  cropType: {
    type: String,
    required: [true, 'Crop type is required'],
    enum: ['rice', 'wheat', 'corn', 'tomato', 'potato', 'cotton', 'sugarcane', 'soybean', 'other']
  },
  category: {
    type: String,
    required: [true, 'Disease category is required'],
    enum: ['fungal', 'bacterial', 'viral', 'pest', 'nutritional', 'environmental', 'other']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: [true, 'Disease description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  symptoms: [{
    description: {
      type: String,
      required: true
    },
    stage: {
      type: String,
      enum: ['early', 'intermediate', 'advanced'],
      default: 'early'
    },
    affectedParts: [{
      type: String,
      enum: ['leaves', 'stem', 'roots', 'fruits', 'flowers', 'entire-plant']
    }]
  }],
  causes: [{
    type: String,
    required: true
  }],
  favorableConditions: {
    temperature: {
      min: Number,
      max: Number,
      optimal: Number
    },
    humidity: {
      min: Number,
      max: Number,
      optimal: Number
    },
    rainfall: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    soilConditions: [{
      type: String,
      enum: ['acidic', 'neutral', 'alkaline', 'well-drained', 'waterlogged', 'nutrient-poor', 'nutrient-rich']
    }],
    season: [{
      type: String,
      enum: ['spring', 'summer', 'monsoon', 'winter', 'post-harvest']
    }]
  },
  prevention: [{
    method: {
      type: String,
      required: true
    },
    description: String,
    effectiveness: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    cost: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  treatment: {
    organic: [{
      method: String,
      materials: [String],
      procedure: String,
      duration: String,
      effectiveness: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    chemical: [{
      pesticide: String,
      activeIngredient: String,
      dosage: String,
      applicationMethod: String,
      frequency: String,
      safetyPeriod: String,
      effectiveness: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high'
      }
    }],
    biological: [{
      method: String,
      bioAgent: String,
      procedure: String,
      effectiveness: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  },
  images: [{
    url: String,
    publicId: String,
    stage: {
      type: String,
      enum: ['early', 'intermediate', 'advanced']
    },
    description: String
  }],
  geographicDistribution: [{
    country: String,
    states: [String],
    prevalence: {
      type: String,
      enum: ['rare', 'common', 'widespread'],
      default: 'common'
    }
  }],
  economicImpact: {
    yieldLoss: {
      type: Number,
      min: 0,
      max: 100
    },
    qualityImpact: {
      type: String,
      enum: ['none', 'minimal', 'moderate', 'severe']
    },
    marketValue: {
      type: String,
      enum: ['no-impact', 'low-impact', 'moderate-impact', 'high-impact']
    }
  },
  references: [{
    title: String,
    url: String,
    author: String,
    publication: String,
    year: Number
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
diseaseSchema.index({ cropType: 1, category: 1 });
diseaseSchema.index({ name: 'text', description: 'text', 'symptoms.description': 'text' });
diseaseSchema.index({ tags: 1 });
diseaseSchema.index({ 'favorableConditions.season': 1 });
diseaseSchema.index({ severity: 1, isActive: 1 });

// Virtual for total prevention methods count
diseaseSchema.virtual('preventionMethodsCount').get(function() {
  return this.prevention.length;
});

// Virtual for total treatment options count
diseaseSchema.virtual('treatmentOptionsCount').get(function() {
  return (this.treatment.organic?.length || 0) + 
         (this.treatment.chemical?.length || 0) + 
         (this.treatment.biological?.length || 0);
});

// Method to get disease summary
diseaseSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    cropType: this.cropType,
    category: this.category,
    severity: this.severity,
    description: this.description.substring(0, 200) + '...',
    symptomsCount: this.symptoms.length,
    preventionMethodsCount: this.preventionMethodsCount,
    treatmentOptionsCount: this.treatmentOptionsCount
  };
};

// Static method to find diseases by environmental conditions
diseaseSchema.statics.findByEnvironmentalConditions = function(conditions) {
  const query = { isActive: true };
  
  if (conditions.temperature) {
    query['$or'] = query['$or'] || [];
    query['$or'].push({
      'favorableConditions.temperature.min': { $lte: conditions.temperature },
      'favorableConditions.temperature.max': { $gte: conditions.temperature }
    });
  }
  
  if (conditions.humidity) {
    query['$or'] = query['$or'] || [];
    query['$or'].push({
      'favorableConditions.humidity.min': { $lte: conditions.humidity },
      'favorableConditions.humidity.max': { $gte: conditions.humidity }
    });
  }
  
  if (conditions.season) {
    query['favorableConditions.season'] = conditions.season;
  }
  
  return this.find(query).sort({ severity: -1 });
};

// Static method to get disease statistics
diseaseSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalDiseases: { $sum: 1 },
        diseasesByCrop: {
          $push: {
            crop: '$cropType',
            category: '$category'
          }
        }
      }
    },
    {
      $project: {
        totalDiseases: 1,
        cropDistribution: {
          $reduce: {
            input: '$diseasesByCrop',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[
                    { k: '$$this.crop', v: { $add: [{ $ifNull: [{ $getField: { input: '$$value', field: '$$this.crop' } }, 0] }, 1] } }
                  ]]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to update lastUpdated
diseaseSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('Disease', diseaseSchema);