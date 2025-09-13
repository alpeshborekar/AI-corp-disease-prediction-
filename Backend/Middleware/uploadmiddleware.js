const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and videos are allowed.'));
  }
};

// Multer configuration object
const multerConfig = {
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
};

// Create multer instance
const upload = multer(multerConfig);

// Export configured multer instance
exports.uploadFiles = upload;

// Single file upload middleware
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 10MB.'
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Too many files uploaded.'
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Upload error: ${error.message}`
        });
      } else if (error) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      // Add tempFilePath for uploaded file (for cloudinary)
      if (req.file) {
        req.file.tempFilePath = req.file.path;
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 10MB per file.'
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Upload error: ${error.message}`
        });
      } else if (error) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      // Add tempFilePath for uploaded files (for cloudinary)
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          file.tempFilePath = file.path;
        });
      }
      
      next();
    });
  };
};

// Fields upload middleware for different field names
exports.uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 10MB per file.'
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Too many files uploaded.'
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Upload error: ${error.message}`
        });
      } else if (error) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      // Add tempFilePath for uploaded files (for cloudinary)
      if (req.files) {
        Object.keys(req.files).forEach(fieldName => {
          req.files[fieldName].forEach(file => {
            file.tempFilePath = file.path;
          });
        });
      }
      
      next();
    });
  };
};

// NEW: Flexible upload middleware that handles both JSON and multipart requests
exports.flexibleUpload = (fields = []) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type') || '';
    
    console.log('=== FLEXIBLE UPLOAD MIDDLEWARE ===');
    console.log('Content-Type:', contentType);
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    // If it's multipart/form-data, use multer
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing as multipart/form-data');
      
      const fieldsUpload = upload.fields(fields);
      
      fieldsUpload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
          console.error('Multer error:', error);
          if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 'error',
              message: 'File too large. Maximum size is 10MB per file.'
            });
          }
          if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              status: 'error',
              message: 'Too many files uploaded.'
            });
          }
          return res.status(400).json({
            status: 'error',
            message: `Upload error: ${error.message}`
          });
        } else if (error) {
          console.error('Upload error:', error);
          return res.status(400).json({
            status: 'error',
            message: error.message
          });
        }
        
        console.log('Files uploaded:', req.files ? Object.keys(req.files) : 'none');
        console.log('Form data received');
        
        // Add tempFilePath for uploaded files (for cloudinary)
        if (req.files) {
          Object.keys(req.files).forEach(fieldName => {
            req.files[fieldName].forEach(file => {
              file.tempFilePath = file.path;
            });
          });
        }
        
        next();
      });
    } else {
      // For JSON requests, just continue
      console.log('Processing as JSON');
      next();
    }
  };
};

// Cleanup temporary files middleware
exports.cleanupFiles = (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to cleanup files
  res.end = function(chunk, encoding) {
    // Cleanup uploaded files
    const filesToCleanup = [];
    
    if (req.file) {
      filesToCleanup.push(req.file.path);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(file => filesToCleanup.push(file.path));
      } else {
        Object.keys(req.files).forEach(fieldName => {
          req.files[fieldName].forEach(file => filesToCleanup.push(file.path));
        });
      }
    }
    
    // Cleanup files asynchronously
    if (filesToCleanup.length > 0) {
      setTimeout(() => {
        filesToCleanup.forEach(filePath => {
          fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Error deleting temporary file:', filePath, err);
            }
          });
        });
      }, 1000); // Wait 1 second before cleanup to ensure upload is complete
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Image validation middleware
exports.validateImages = (req, res, next) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  let hasInvalidImage = false;
  
  if (req.file && !imageTypes.includes(req.file.mimetype)) {
    hasInvalidImage = true;
  }
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (!imageTypes.includes(file.mimetype)) {
          hasInvalidImage = true;
        }
      });
    } else {
      Object.keys(req.files).forEach(fieldName => {
        req.files[fieldName].forEach(file => {
          if (!imageTypes.includes(file.mimetype)) {
            hasInvalidImage = true;
          }
        });
      });
    }
  }
  
  if (hasInvalidImage) {
    return res.status(400).json({
      status: 'error',
      message: 'Only image files (JPEG, JPG, PNG, GIF) are allowed.'
    });
  }
  
  next();
};