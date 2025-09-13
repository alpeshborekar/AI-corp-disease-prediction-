import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings,
  Bell,
  Shield,
  Camera,
  Save,
  Lock,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
      state: user?.profile?.location?.state || '',
      district: user?.profile?.location?.district || '',
      village: user?.profile?.location?.village || '',
      farmSize: user?.profile?.farmDetails?.farmSize || '',
      farmingExperience: user?.profile?.farmDetails?.farmingExperience || '',
      cropTypes: user?.profile?.farmDetails?.cropTypes || [],
      specialization: user?.profile?.expertise?.specialization || [],
      qualifications: user?.profile?.expertise?.qualifications || '',
      expertExperience: user?.profile?.expertise?.experience || '',
      preferredLanguage: user?.profile?.preferredLanguage || 'en'
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm();

  const watchedNewPassword = watch('newPassword');

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  const onSubmitProfile = async (data) => {
    try {
      setLoading(true);
      
      const updateData = {
        name: data.name,
        profile: {
          phone: data.phone,
          location: {
            state: data.state,
            district: data.district,
            village: data.village
          },
          preferredLanguage: data.preferredLanguage
        }
      };

      // Add role-specific data
      if (user?.role === 'farmer') {
        updateData.profile.farmDetails = {
          farmSize: parseFloat(data.farmSize) || 0,
          cropTypes: data.cropTypes,
          farmingExperience: parseInt(data.farmingExperience) || 0
        };
      } else if (user?.role === 'expert') {
        updateData.profile.expertise = {
          specialization: data.specialization,
          qualifications: data.qualifications,
          experience: parseInt(data.expertExperience) || 0
        };
      }

      await updateUser(updateData);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    try {
      setLoading(true);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      resetPassword();
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h1>
          <p className="text-gray-600 capitalize">{user?.role}</p>
          <div className="flex items-center justify-center mt-2">
            {user?.isVerified ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified Account
              </div>
            ) : (
              <div className="flex items-center text-yellow-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Unverified Account
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-1 mb-8"
        >
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <Edit3 className="h-5 w-5 text-gray-400" />
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          {...register('name', { required: 'Name is required' })}
                          className={`form-input pl-10 ${errors.name ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.name && <p className="form-error">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          {...register('email')}
                          className="form-input pl-10 bg-gray-50"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="form-label">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          {...register('phone')}
                          className="form-input pl-10"
                          placeholder="10-digit phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Preferred Language</label>
                      <select {...register('preferredLanguage')} className="form-select">
                        {languageOptions.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div>
                      <label className="form-label">Village/City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          {...register('village')}
                          className="form-input pl-10"
                          placeholder="Your village or city"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-specific Information */}
                {user?.role === 'farmer' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="form-label">Farming Experience (years)</label>
                        <input
                          type="number"
                          {...register('farmingExperience')}
                          className="form-input"
                          placeholder="Years of experience"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="form-label">Primary Crops</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {cropOptions.map(crop => (
                            <label key={crop} className="flex items-center">
                              <input
                                type="checkbox"
                                value={crop}
                                {...register('cropTypes')}
                                className="rounded border-gray-300 text-green-600 mr-2"
                              />
                              <span className="text-sm capitalize">{crop}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === 'expert' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Expert Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Specializations</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {specializationOptions.map(spec => (
                            <label key={spec} className="flex items-center">
                              <input
                                type="checkbox"
                                value={spec}
                                {...register('specialization')}
                                className="rounded border-gray-300 text-green-600 mr-2"
                              />
                              <span className="text-sm">
                                {spec.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </label>
                          ))}
                        </div>
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
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                <Lock className="h-5 w-5 text-gray-400" />
              </div>

              <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    className={`form-input ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="form-error">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    {...registerPassword('newPassword', { 
                      required: 'New password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    className={`form-input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="form-error">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === watchedNewPassword || 'Passwords do not match'
                    })}
                    className={`form-input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="form-error">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Change Password
                  </button>
                </div>
              </form>

              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-700 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn-danger flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={user?.notifications?.email}
                        className="rounded border-gray-300 text-green-600 mr-3"
                      />
                      <span className="text-gray-700">Disease detection results</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                      <span className="text-gray-700">Expert consultation updates</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                      <span className="text-gray-700">Weather alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                      <span className="text-gray-700">Weekly reports</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={user?.notifications?.sms}
                        className="rounded border-gray-300 text-green-600 mr-3"
                      />
                      <span className="text-gray-700">Urgent disease alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                      <span className="text-gray-700">Expert responses</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={user?.notifications?.push}
                        className="rounded border-gray-300 text-green-600 mr-3"
                      />
                      <span className="text-gray-700">Real-time chat messages</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                      <span className="text-gray-700">System updates</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="form-label">Theme</label>
                  <select className="form-select">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Default Crop Type</label>
                  <select className="form-select">
                    <option value="">No Default</option>
                    <option value="rice">Rice</option>
                    <option value="wheat">Wheat</option>
                    <option value="tomato">Tomato</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Temperature Unit</label>
                  <select className="form-select">
                    <option value="celsius">Celsius (°C)</option>
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                    <span className="text-gray-700">Show my profile to other users</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                    <span className="text-gray-700">Allow location-based recommendations</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-green-600 mr-3" />
                    <span className="text-gray-700">Share analytics data for research</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;