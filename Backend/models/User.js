const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['farmer', 'expert', 'admin'],
    default: 'farmer'
  },
  profile: {
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
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
    farmDetails: {
      farmSize: {
        type: Number,
        min: [0, 'Farm size cannot be negative']
      },
      cropTypes: [{
        type: String,
        enum: ['rice', 'wheat', 'corn', 'tomato', 'potato', 'cotton', 'sugarcane', 'soybean', 'other']
      }],
      farmingExperience: {
        type: Number,
        min: [0, 'Experience cannot be negative']
      }
    },
    expertise: {
      specialization: [{
        type: String,
        enum: ['plant-pathology', 'entomology', 'agronomy', 'soil-science', 'horticulture', 'other']
      }],
      qualifications: String,
      experience: Number,
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalConsultations: {
        type: Number,
        default: 0
      }
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'gu', 'mr', 'bn', 'pa'],
      default: 'en'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for location-based queries
userSchema.index({ 'profile.location.coordinates': '2dsphere' });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  return user;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Find experts by specialization and location
userSchema.statics.findExpertsBySpecialization = function(specialization, location, limit = 10) {
  const query = {
    role: 'expert',
    isActive: true,
    isVerified: true
  };

  if (specialization) {
    query['profile.expertise.specialization'] = specialization;
  }

  let findQuery = this.find(query)
    .select('name email profile.expertise profile.location')
    .sort({ 'profile.expertise.rating': -1 })
    .limit(limit);

  if (location && location.coordinates) {
    findQuery = this.find({
      ...query,
      'profile.location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.coordinates.longitude, location.coordinates.latitude]
          },
          $maxDistance: 50000 // 50km radius
        }
      }
    })
    .select('name email profile.expertise profile.location')
    .limit(limit);
  }

  return findQuery;
};

// Virtual for full name with location
userSchema.virtual('displayName').get(function() {
  const location = this.profile?.location;
  if (location?.village && location?.district) {
    return `${this.name} (${location.village}, ${location.district})`;
  }
  return this.name;
});

module.exports = mongoose.model('User', userSchema);