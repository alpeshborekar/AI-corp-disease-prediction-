#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌾 Crop Disease Management System - Setup Script\n');

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️ .env file already exists. Remove it first if you want to recreate it.\n');
  rl.close();
  process.exit(0);
}

// Copy .env.example to .env
try {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from .env.example\n');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  rl.close();
  process.exit(1);
}

console.log('📝 Please configure the following required environment variables:\n');

const requiredVars = [
  {
    key: 'MONGODB_URI',
    description: 'MongoDB connection string',
    example: 'mongodb://localhost:27017/crop-disease-db',
    required: true
  },
  {
    key: 'JWT_SECRET',
    description: 'JWT secret key (should be a long random string)',
    example: 'your-super-secret-jwt-key-here',
    required: true,
    generate: true
  },
  {
    key: 'CLOUDINARY_CLOUD_NAME',
    description: 'Cloudinary cloud name (for image uploads)',
    example: 'your-cloud-name',
    required: true
  },
  {
    key: 'CLOUDINARY_API_KEY',
    description: 'Cloudinary API key',
    example: 'your-api-key',
    required: true
  },
  {
    key: 'CLOUDINARY_API_SECRET',
    description: 'Cloudinary API secret',
    example: 'your-api-secret',
    required: true
  },
  {
    key: 'OPENWEATHER_API_KEY',
    description: 'OpenWeather API key (for weather data)',
    example: 'your-openweather-api-key',
    required: true
  }
];

let envContent = fs.readFileSync(envPath, 'utf8');

const updateEnvVar = (key, value) => {
  const regex = new RegExp(`${key}=.*`, 'g');
  envContent = envContent.replace(regex, `${key}=${value}`);
};

const askForVar = (index = 0) => {
  if (index >= requiredVars.length) {
    // Save the updated .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Setup complete!\n');
    console.log('🚀 Next steps:');
    console.log('1. Review and update the .env file with your actual credentials');
    console.log('2. Make sure MongoDB is running');
    console.log('3. Run: npm install');
    console.log('4. Run: npm run dev\n');
    console.log('📚 Optional services to configure later:');
    console.log('- Email notifications (EMAIL_USER, EMAIL_PASS)');
    console.log('- SMS notifications (TWILIO_* variables)');
    console.log('- AI model service (AI_MODEL_BASE_URL)\n');
    
    rl.close();
    return;
  }

  const varConfig = requiredVars[index];
  
  let prompt = `${varConfig.key}: ${varConfig.description}`;
  if (varConfig.example) {
    prompt += `\nExample: ${varConfig.example}`;
  }
  
  if (varConfig.generate && varConfig.key === 'JWT_SECRET') {
    const randomSecret = require('crypto').randomBytes(64).toString('hex');
    console.log(`\n🔑 Generated JWT secret: ${randomSecret.substring(0, 20)}...`);
    updateEnvVar(varConfig.key, randomSecret);
    askForVar(index + 1);
    return;
  }
  
  rl.question(`\n${prompt}\nEnter value (or press Enter to skip): `, (answer) => {
    if (answer.trim()) {
      updateEnvVar(varConfig.key, answer.trim());
      console.log(`✅ Set ${varConfig.key}`);
    } else if (varConfig.required) {
      console.log(`⚠️ ${varConfig.key} is required. Please set it in .env file manually.`);
    }
    
    askForVar(index + 1);
  });
};

askForVar();