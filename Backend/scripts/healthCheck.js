#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

console.log('🏥 Health Check - Crop Disease Management System\n');

const checks = [];

// Database Connection Check
const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database: Connected successfully');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ Database: Connection failed -', error.message);
    return false;
  }
};

// OpenWeather API Check
const checkWeatherAPI = async () => {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      console.log('⚠️ Weather API: API key not configured');
      return false;
    }
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    if (response.status === 200) {
      console.log('✅ Weather API: Working correctly');
      return true;
    } else {
      console.log('❌ Weather API: Unexpected response');
      return false;
    }
  } catch (error) {
    console.log('❌ Weather API: Request failed -', error.response?.data?.message || error.message);
    return false;
  }
};

// Cloudinary Check
const checkCloudinary = () => {
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    console.log('✅ Cloudinary: All credentials configured');
    return true;
  } else {
    console.log('⚠️ Cloudinary: Missing credentials:', missing.join(', '));
    return false;
  }
};

// Email Configuration Check
const checkEmailConfig = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('✅ Email: Configuration found');
    return true;
  } else {
    console.log('⚠️ Email: Not configured (optional)');
    return false;
  }
};

// Twilio Configuration Check
const checkTwilioConfig = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    if (process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.log('✅ Twilio: Configuration looks correct');
      return true;
    } else {
      console.log('❌ Twilio: ACCOUNT_SID should start with "AC"');
      return false;
    }
  } else {
    console.log('⚠️ Twilio: Not configured (optional)');
    return false;
  }
};

// JWT Configuration Check
const checkJWTConfig = () => {
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length >= 32) {
      console.log('✅ JWT: Secret key configured');
      return true;
    } else {
      console.log('⚠️ JWT: Secret key should be at least 32 characters');
      return false;
    }
  } else {
    console.log('❌ JWT: Secret key not configured');
    return false;
  }
};

// AI Model Service Check
const checkAIModel = async () => {
  try {
    if (!process.env.AI_MODEL_BASE_URL) {
      console.log('⚠️ AI Model: Service URL not configured');
      return false;
    }
    
    const response = await axios.get(`${process.env.AI_MODEL_BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ AI Model: Service is running');
    return true;
  } catch (error) {
    console.log('⚠️ AI Model: Service not available -', error.message);
    return false;
  }
};

// Run all checks
const runHealthCheck = async () => {
  console.log('Running health checks...\n');
  
  const results = {
    database: await checkDatabase(),
    weather: await checkWeatherAPI(),
    cloudinary: checkCloudinary(),
    email: checkEmailConfig(),
    twilio: checkTwilioConfig(),
    jwt: checkJWTConfig(),
    aiModel: await checkAIModel()
  };
  
  console.log('\n📊 Health Check Summary:');
  console.log('========================');
  
  const critical = ['database', 'jwt', 'cloudinary'];
  const optional = ['weather', 'email', 'twilio', 'aiModel'];
  
  let criticalPass = 0;
  let optionalPass = 0;
  
  console.log('\n🔴 Critical Services:');
  critical.forEach(service => {
    const status = results[service] ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${service}: ${status}`);
    if (results[service]) criticalPass++;
  });
  
  console.log('\n🟡 Optional Services:');
  optional.forEach(service => {
    const status = results[service] ? '✅ PASS' : '⚠️ NOT CONFIGURED';
    console.log(`  ${service}: ${status}`);
    if (results[service]) optionalPass++;
  });
  
  console.log('\n📈 Overall Status:');
  console.log(`Critical: ${criticalPass}/${critical.length} services working`);
  console.log(`Optional: ${optionalPass}/${optional.length} services working`);
  
  if (criticalPass === critical.length) {
    console.log('\n🎉 System is ready to run!');
    console.log('Run: npm run dev');
  } else {
    console.log('\n⚠️ Fix critical services before starting the application');
    console.log('Check your .env file configuration');
  }
  
  process.exit(criticalPass === critical.length ? 0 : 1);
};

runHealthCheck().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});