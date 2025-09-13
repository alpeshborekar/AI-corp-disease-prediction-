const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const { generateToken, verifyToken } = require('../utils/jwtUtils');
const { validateRegistration, validateLogin } = require('../utils/validation');

// Generate JWT Token
const generateJWT = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Optimized Register User
exports.register = async (req, res) => {
  console.log('\n🚀 =======================================');
  console.log('📝 REGISTRATION REQUEST DEBUG STARTED');
  console.log('🚀 =======================================');

  console.log('📊 Request method:', req.method);
  console.log('📊 Request URL:', req.originalUrl);
  console.log('📊 Request body received:', JSON.stringify(req.body, null, 2));

  try {
    // Quick validation checks first
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body is empty'
      });
    }

    const { error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { name, email, password, role, profile } = req.body;

    // Check if user exists first (faster than creating user object)
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Generate tokens before saving user
    const verificationToken = generateToken();
    
    // Create user with verification token
    const user = new User({
      name,
      email,
      password,
      role: role || 'farmer',
      profile,
      verificationToken
    });

    // Save user and generate JWT in parallel (but wait for user save)
    await user.save();
    const token = generateJWT(user._id);

    // Send email asynchronously (don't wait for it)
    const emailPromise = sendEmail({
      email: user.email,
      subject: 'Account Verification - Crop Disease Management',
      template: 'verification',
      data: {
        name: user.name,
        verificationToken,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
      }
    }).then(() => {
      console.log('📧 Email sent successfully to:', user.email);
    }).catch(emailError => {
      console.error('📧 Email sending failed:', emailError.message);
      // You might want to queue this for retry later
    });

    // Don't wait for email - respond immediately
    console.log('✅ Registration successful for:', email);
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

    // Email will continue processing in background
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.'
    });
  }
};

// Optimized Login User
exports.login = async (req, res) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login asynchronously (don't wait for it)
    user.updateLastLogin().catch(err => 
      console.error('Failed to update last login:', err)
    );

    const token = generateJWT(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.'
    });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    await User.findByIdAndUpdate(user._id, {
      $set: { isVerified: true },
      $unset: { verificationToken: 1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Email verification failed'
    });
  }
};

// Get Current User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Create public profile manually if getPublicProfile is not available on lean objects
    const publicProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: publicProfile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile'
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'profile'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        status: 'success',
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    const resetToken = generateToken();
    user.verificationToken = resetToken;
    await user.save();

    // Send email asynchronously
    sendEmail({
      email: user.email,
      subject: 'Password Reset - Crop Disease Management',
      template: 'passwordReset',
      data: {
        name: user.name,
        resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
      }
    }).catch(emailError => {
      console.error('Password reset email failed:', emailError);
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request'
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'New password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
};