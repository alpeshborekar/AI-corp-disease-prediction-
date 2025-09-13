const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
exports.uploadToCloudinary = async (filePath, folder = 'general') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `crop-disease/${folder}`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    // Delete local file on error too
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Delete image from Cloudinary
exports.deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Upload multiple images
exports.uploadMultipleToCloudinary = async (filePaths, folder = 'general') => {
  try {
    const uploadPromises = filePaths.map(filePath => 
      exports.uploadToCloudinary(filePath, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

// Get optimized image URL
exports.getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    format: 'auto',
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

// Generate image thumbnail
exports.generateThumbnail = (publicId, width = 300, height = 300) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill' },
      { quality: 'auto:good' },
      { format: 'auto' }
    ]
  });
};