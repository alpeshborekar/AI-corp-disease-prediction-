import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Leaf, 
  Mail, 
  Lock, 
  User,
  Phone,
  MapPin,
  ArrowRight, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    trigger
  } = useForm();

  const watchedPassword = watch('password');

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword from data
      const { confirmPassword, ...userData } = data;
      
      // Structure the data according to backend expectations
      const registrationData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'farmer',
        profile: {
          phone: data.phone,
          location: {
            state: data.state,
            district: data.district,
            village: data.village
          },
          farmDetails: data.role === 'farmer' ? {
            farmSize: parseFloat(data.farmSize) || 0,
            cropTypes: data.cropTypes || [],
            farmingExperience: parseInt(data.farmingExperience) || 0
          } : undefined,
          expertise: data.role === 'expert' ? {
            specialization: data.specialization || [],
            qualifications: data.qualifications,
            experience: parseInt(data.expertExperience) || 0
          } : undefined,
          preferredLanguage: data.preferredLanguage || 'en'
        }
      };

      const result = await registerUser(registrationData);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred' });
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['name', 'email', 'password', 'confirmPassword'] 
      : ['phone', 'role'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const cropOptions = [
    'rice', 'wheat', 'corn', 'tomato', 'potato', 'cotton', 'sugarcane', 'soybean'
  ];

  const specializationOptions = [
    'plant-pathology', 'entomology', 'agronomy', 'soil-science', 'horticulture'
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'te', label: 'Telugu' },
    { value: 'ta', label: 'Tamil' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'gu', label: 'Gujarati' },
    { value: 'mr', label: 'Marathi' },
    { value: 'bn', label: 'Bengali' },
    { value: 'pa', label: 'Punjabi' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">CropCare</h1>
                  <p className="text-sm text-gray-500">AI Disease Management</p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= i 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step > i ? <CheckCircle className="h-5 w-5" /> : i}
                    </div>
                    {i < 3 && (
                      <div className={`w-12 h-0.5 ${
                        step > i ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  Step {step} of 3: {
                    step === 1 ? 'Account Details' :
                    step === 2 ? 'Personal Info' :
                    'Additional Details'
                  }
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">
                Join thousands of farmers using AI for crop protection
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="form-label">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                        className={`form-input pl-10 ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        })}
                        className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: value => value === watchedPassword || 'Passwords do not match'
                        })}
                        className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="form-label">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        {...register('phone', {
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Please enter a valid 10-digit phone number'
                          }
                        })}
                        className={`form-input pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="Enter 10-digit phone number"
                      />
                    </div>
                    {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">I am a</label>
                    <select
                      {...register('role', { required: 'Please select your role' })}
                      className={`form-select ${errors.role ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select your role</option>
                      <option value="farmer">Farmer</option>
                      <option value="expert">Agricultural Expert</option>
                    </select>
                    {errors.role && <p className="form-error">{errors.role.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        {...register('state')}
                        className="form-input"
                        placeholder="Your state"
                      />
                    </div>
                    <div>
                      <label className="form-label">District</label>
                      <input
                        type="text"
                        {...register('district')}
                        className="form-input"
                        placeholder="Your district"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Village/City</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        {...register('village')}
                        className="form-input pl-10"
                        placeholder="Your village or city"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Preferred Language</label>
                    <select
                      {...register('preferredLanguage')}
                      className="form-select"
                    >
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Role-specific Info */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {watch('role') === 'farmer' && (
                    <>
                      <div>
                        <label className="form-label">Farm Size (acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          {...register('farmSize')}
                          className="form-input"
                          placeholder="Enter farm size"
                        />
                      </div>

                      <div>
                        <label className="form-label">Primary Crops (select multiple)</label>
                        <select
                          multiple
                          {...register('cropTypes')}
                          className="form-select h-24"
                        >
                          {cropOptions.map(crop => (
                            <option key={crop} value={crop} className="py-1">
                              {crop.charAt(0).toUpperCase() + crop.slice(1)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple crops</p>
                      </div>

                      <div>
                        <label className="form-label">Farming Experience (years)</label>
                        <input
                          type="number"
                          {...register('farmingExperience')}
                          className="form-input"
                          placeholder="Years of experience"
                        />
                      </div>
                    </>
                  )}

                  {watch('role') === 'expert' && (
                    <>
                      <div>
                        <label className="form-label">Specializations (select multiple)</label>
                        <select
                          multiple
                          {...register('specialization')}
                          className="form-select h-24"
                        >
                          {specializationOptions.map(spec => (
                            <option key={spec} value={spec} className="py-1">
                              {spec.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple specializations</p>
                      </div>

                      <div>
                        <label className="form-label">Qualifications</label>
                        <textarea
                          {...register('qualifications')}
                          className="form-textarea h-20"
                          placeholder="Your educational qualifications and certifications"
                        />
                      </div>

                      <div>
                        <label className="form-label">Professional Experience (years)</label>
                        <input
                          type="number"
                          {...register('expertExperience')}
                          className="form-input"
                          placeholder="Years of professional experience"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary px-6"
                  >
                    Previous
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className={`btn-primary px-6 ${step === 1 ? 'ml-auto' : ''}`}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6 ml-auto flex items-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Root Error */}
              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.root.message}
                  </p>
                </div>
              )}
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-farm-pattern"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white"
          >
            <h3 className="text-4xl font-bold mb-6">
              Join the AI Revolution in Agriculture
            </h3>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Become part of a community that's transforming farming with artificial intelligence. 
              Protect your crops, increase yields, and connect with experts.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Instant Disease Detection</h4>
                  <p className="text-green-100">Upload a photo and get AI-powered diagnosis in seconds</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Expert Network Access</h4>
                  <p className="text-green-100">Connect with certified agricultural experts for personalized advice</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">Weather Intelligence</h4>
                  <p className="text-green-100">Receive proactive alerts based on weather and environmental data</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <h4 className="text-white font-semibold mb-2">Trusted by farmers worldwide</h4>
              <div className="flex items-center space-x-6 text-green-100">
                <div>
                  <div className="text-2xl font-bold text-white">10,000+</div>
                  <div className="text-sm">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;