const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
exports.generateJWT = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'crop-disease-api',
    ...options
  };

  return jwt.sign(payload, process.env.JWT_SECRET, defaultOptions);
};

// Verify JWT token
exports.verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Generate refresh token
exports.generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate random token for email verification, password reset, etc.
exports.generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate API key
exports.generateApiKey = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  return `cdapi_${timestamp}_${random}`;
};

// Decode JWT token without verification (for debugging)
exports.decodeJWT = (token) => {
  return jwt.decode(token, { complete: true });
};

// Check if token is expired
exports.isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiry time
exports.getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Generate tokens for different purposes
exports.generateTokens = (userId, userRole) => {
  const accessToken = exports.generateJWT(
    { userId, role: userRole },
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = exports.generateJWT(
    { userId, type: 'refresh' },
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
    tokenType: 'Bearer'
  };
};