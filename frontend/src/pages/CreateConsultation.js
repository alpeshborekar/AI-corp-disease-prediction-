import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { consultationAPI } from '../services/api';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateConsultation = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        toast.error(`Some files were rejected. Please check file size and format.`);
      }
      
      // Add accepted files to existing images
      setImages(prevImages => [...prevImages, ...acceptedFiles]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.file.name} is too large. Max size is 10MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.file.name} has invalid type. Only images are allowed.`);
          }
        });
      });
    }
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!data.title?.trim()) {
        toast.error('Please enter a consultation title');
        return;
      }
      if (!data.description?.trim()) {
        toast.error('Please enter a description');
        return;
      }
      if (!data.cropType) {
        toast.error('Please select a crop type');
        return;
      }

      const formData = new FormData();
      
      // Add text fields with proper validation
      formData.append('title', data.title.trim());
      formData.append('description', data.description.trim());
      formData.append('cropType', data.cropType);
      
      // Add optional fields if they exist
      if (data.priority) formData.append('priority', data.priority);
      if (data.location) formData.append('location', data.location);
      if (data.urgency) formData.append('urgency', data.urgency);
      
      // Add images if any exist
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          // Validate that it's actually a file object
          if (image instanceof File) {
            formData.append('images', image);
            console.log(`Adding image ${index}:`, image.name, image.size);
          }
        });
      }

      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }

      const response = await consultationAPI.create(formData);
      
      toast.success('Consultation created successfully!');
      
      // Navigate to the created consultation
      const consultationId = response.data?._id || response.data?.consultation?._id || response.data?.id;
      if (consultationId) {
        navigate(`/consultations/${consultationId}`);
      } else {
        navigate('/consultations');
      }
      
    } catch (error) {
      console.error('Create consultation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create consultation';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="flex items-center mb-6">
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="form-label">Consultation Title *</label>
              <input 
                {...register('title', { 
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' }
                })} 
                placeholder="Brief title describing your issue"
                className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Description *</label>
              <textarea 
                {...register('description', { 
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' }
                })} 
                placeholder="Describe your issue in detail - symptoms, when it started, affected area, etc."
                className={`form-textarea h-32 ${errors.description ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Crop Type */}
            <div>
              <label className="form-label">Crop Type *</label>
              <select 
                {...register('cropType', { required: 'Please select a crop type' })} 
                className={`form-select ${errors.cropType ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select Crop Type</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="corn">Corn</option>
                <option value="tomato">Tomato</option>
                <option value="potato">Potato</option>
                <option value="cotton">Cotton</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="other">Other</option>
              </select>
              {errors.cropType && (
                <p className="text-red-500 text-sm mt-1">{errors.cropType.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="form-label">Priority Level</label>
              <select 
                {...register('priority')} 
                className="form-select"
                disabled={isLoading}
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="form-label">Location (Optional)</label>
              <input 
                {...register('location')} 
                placeholder="City, State or Farm location"
                className="form-input"
                disabled={isLoading}
              />
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="form-label">Crop Images</label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input {...getInputProps()} />
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                {isDragActive ? (
                  <p className="text-green-600">Drop images here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop crop images here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Max 5 images, 10MB each. JPG, PNG, GIF supported
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Images ({images.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/consultations')}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="btn-primary flex items-center"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Consultation
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateConsultation;