const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    filename: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const consultationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Consultation title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Consultation description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cropType: {
    type: String,
    required: [true, 'Crop type is required'],
    enum: ['rice', 'wheat', 'corn', 'tomato', 'potato', 'cotton', 'sugarcane', 'soybean', 'other']
  },
  category: {
    type: String,
    required: [true, 'Consultation category is required'],
    enum: ['disease-diagnosis', 'pest-control', 'nutrition', 'irrigation', 'harvesting', 'general', 'emergency']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  symptoms: [{
    description: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String,
    affectedArea: String
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  environmentalData: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    soilMoisture: Number,
    soilPH: Number,
    lastFertilization: Date,
    lastIrrigation: Date
  },
  aiPrediction: {
    diseaseName: String,
    confidence: Number,
    alternativePredictions: [{
      diseaseName: String,
      confidence: Number
    }],
    suggestedTreatments: [String],
    predictedAt: Date
  },
  messages: [messageSchema],
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'assigned', 'expert-joined', 'message-sent', 'status-changed', 'resolved', 'closed'],
      required: true
    },
    description: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    farmerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    expertRating: {
      type: Number,
      min: 1,
      max: 5
    },
    farmerFeedback: String,
    expertFeedback: String,
    ratedAt: Date
  },
  tags: [String],
  isUrgent: {
    type: Boolean,
    default: false
  },
  assignedAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  estimatedResolutionTime: Date,
  actualResolutionTime: Number, // in minutes
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
consultationSchema.index({ farmer: 1, status: 1 });
consultationSchema.index({ expert: 1, status: 1 });
consultationSchema.index({ status: 1, priority: 1, createdAt: -1 });
consultationSchema.index({ cropType: 1, category: 1 });
consultationSchema.index({ 'location.coordinates': '2dsphere' });
consultationSchema.index({ isUrgent: 1, status: 1 });

// Virtual for total messages count
consultationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for unread messages count
consultationSchema.virtual('unreadMessagesCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

// Virtual for resolution time in hours
consultationSchema.virtual('resolutionTimeHours').get(function() {
  if (this.actualResolutionTime) {
    return Math.round(this.actualResolutionTime / 60);
  }
  return null;
});

// Method to add message
consultationSchema.methods.addMessage = function(senderId, message, attachments = []) {
  this.messages.push({
    sender: senderId,
    message,
    attachments
  });
  
  // Add timeline entry
  this.timeline.push({
    action: 'message-sent',
    description: `Message sent: ${message.substring(0, 50)}...`,
    user: senderId
  });
  
  return this.save();
};

// Method to assign expert
consultationSchema.methods.assignExpert = function(expertId) {
  this.expert = expertId;
  this.status = 'assigned';
  this.assignedAt = new Date();
  
  // Add timeline entry
  this.timeline.push({
    action: 'assigned',
    description: 'Expert assigned to consultation',
    user: expertId
  });
  
  return this.save();
};

// Method to update status
consultationSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
    this.actualResolutionTime = Math.floor((this.resolvedAt - this.createdAt) / 60000); // in minutes
  } else if (newStatus === 'closed') {
    this.closedAt = new Date();
  }
  
  // Add timeline entry
  this.timeline.push({
    action: 'status-changed',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    user: userId
  });
  
  return this.save();
};

// Method to mark messages as read
consultationSchema.methods.markMessagesAsRead = function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString()) {
      message.isRead = true;
    }
  });
  
  return this.save();
};

// Static method to find open consultations for assignment
consultationSchema.statics.findOpenConsultations = function(expertSpecializations = [], location = null) {
  const query = {
    status: 'open',
    isActive: true
  };
  
  // Filter by expert specializations if provided
  if (expertSpecializations.length > 0) {
    const categoryMapping = {
      'plant-pathology': ['disease-diagnosis'],
      'entomology': ['pest-control'],
      'agronomy': ['nutrition', 'irrigation', 'general'],
      'soil-science': ['nutrition'],
      'horticulture': ['general']
    };
    
    const relevantCategories = expertSpecializations.flatMap(spec => 
      categoryMapping[spec] || ['general']
    );
    
    query.category = { $in: relevantCategories };
  }
  
  let findQuery = this.find(query)
    .populate('farmer', 'name profile.location')
    .sort({ priority: -1, createdAt: 1 });
  
  // Add location-based sorting if provided
  if (location && location.coordinates) {
    findQuery = this.find({
      ...query,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.coordinates.longitude, location.coordinates.latitude]
          }
        }
      }
    })
    .populate('farmer', 'name profile.location');
  }
  
  return findQuery;
};

// Static method to get consultation statistics
consultationSchema.statics.getStatistics = function(dateRange = null) {
  const matchCondition = { isActive: true };
  
  if (dateRange) {
    matchCondition.createdAt = {
      $gte: dateRange.startDate,
      $lte: dateRange.endDate
    };
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalConsultations: { $sum: 1 },
        statusDistribution: {
          $push: '$status'
        },
        priorityDistribution: {
          $push: '$priority'
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $ne: ['$actualResolutionTime', null] },
              '$actualResolutionTime',
              null
            ]
          }
        },
        cropTypeDistribution: {
          $push: '$cropType'
        }
      }
    }
  ]);
};

// Pre-save middleware
consultationSchema.pre('save', function(next) {
  // Set urgent flag based on priority
  if (this.priority === 'urgent' && !this.isUrgent) {
    this.isUrgent = true;
  }
  
  // Set estimated resolution time based on priority
  if (this.isNew && !this.estimatedResolutionTime) {
    const hours = {
      'urgent': 2,
      'high': 8,
      'medium': 24,
      'low': 48
    };
    
    this.estimatedResolutionTime = new Date(Date.now() + hours[this.priority] * 60 * 60 * 1000);
  }
  
  next();
});

module.exports = mongoose.model('Consultation', consultationSchema);