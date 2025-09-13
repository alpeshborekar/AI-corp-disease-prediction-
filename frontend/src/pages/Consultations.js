import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { consultationAPI } from '../services/api';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  Calendar,
  ArrowRight,
  Users,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Consultations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    cropType: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    pending: 0
  });

  // Load consultations
  useEffect(() => {
    loadConsultations();
  }, [filter]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const params = {
        ...filter,
        status: filter.status === 'all' ? undefined : filter.status,
        priority: filter.priority === 'all' ? undefined : filter.priority,
        cropType: filter.cropType === 'all' ? undefined : filter.cropType,
        search: filter.search || undefined
      };

      const response = await consultationAPI.getAll(params);
      
      // Fixed: Handle different possible response structures
      let consultationList = [];
      
      if (Array.isArray(response.data)) {
        // Case 1: Backend returns array directly
        consultationList = response.data;
      } else if (response.data && response.data.consultations && Array.isArray(response.data.consultations)) {
        // Case 2: Backend returns { consultations: [...] }
        consultationList = response.data.consultations;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Case 3: Backend returns { data: [...] }
        consultationList = response.data.data;
      } else {
        // Fallback: empty array
        console.warn('Unexpected API response structure:', response.data);
        consultationList = [];
      }

      setConsultations(consultationList);
      
      // Calculate stats safely
      setStats({
        total: consultationList.length,
        active: consultationList.filter(c => c && (c.status === 'in-progress' || c.status === 'assigned')).length,
        resolved: consultationList.filter(c => c && c.status === 'resolved').length,
        pending: consultationList.filter(c => c && c.status === 'open').length
      });
    } catch (error) {
      console.error('Failed to load consultations:', error);
      toast.error('Failed to load consultations');
      // Set empty array and zero stats on error
      setConsultations([]);
      setStats({
        total: 0,
        active: 0,
        resolved: 0,
        pending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'assigned':
      case 'in-progress':
        return <User className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <Eye className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultations</h1>
            <p className="text-gray-600">Connect with agricultural experts for personalized advice</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/consultations/new"
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Consultation
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search consultations..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                className="form-select"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="form-label">Crop Type</label>
              <select
                value={filter.cropType}
                onChange={(e) => setFilter(prev => ({ ...prev, cropType: e.target.value }))}
                className="form-select"
              >
                <option value="all">All Crops</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="corn">Corn</option>
                <option value="tomato">Tomato</option>
                <option value="potato">Potato</option>
                <option value="cotton">Cotton</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Consultations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Loading consultations...</span>
            </div>
          ) : !Array.isArray(consultations) || consultations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
              <p className="text-gray-600 mb-4">
                {filter.search || filter.status !== 'all' || filter.priority !== 'all' || filter.cropType !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start your first consultation with an agricultural expert.'}
              </p>
              <Link to="/consultations/new" className="btn-primary inline-flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Create First Consultation
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => {
                // Safe check for consultation object
                if (!consultation || (!consultation._id && !consultation.id)) {
                  return null;
                }
                
                return (
                  <div
                    key={consultation._id || consultation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/consultations/${consultation._id || consultation.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 hover:text-green-600 transition-colors">
                            {consultation.title || 'Untitled Consultation'}
                          </h3>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status || 'unknown')}`}>
                              {getStatusIcon(consultation.status || 'unknown')}
                              <span className="ml-1 capitalize">{(consultation.status || 'unknown').replace('-', ' ')}</span>
                            </span>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(consultation.priority || 'medium')}`}>
                              {consultation.priority === 'urgent' && <Zap className="h-3 w-3 mr-1" />}
                              <span className="capitalize">{consultation.priority || 'medium'}</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {consultation.description || 'No description available'}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(consultation.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium capitalize">{consultation.cropType || 'Unknown crop'}</span>
                          </div>
                          
                          {consultation.expert && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              <span>{consultation.expert.name || 'Expert'}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span>{consultation.messageCount || 0} messages</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-sm text-gray-500">
                          {getTimeAgo(consultation.updatedAt || consultation.createdAt)}
                        </span>
                        
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Info Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {consultation.location?.district && (
                          <span>📍 {consultation.location.district}, {consultation.location.state}</span>
                        )}
                        
                        {consultation.category && (
                          <span className="capitalize">🏷️ {consultation.category.replace('-', ' ')}</span>
                        )}
                      </div>

                      {consultation.isUrgent && (
                        <div className="flex items-center text-red-600 text-xs font-medium">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Urgent
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Actions for Experts */}
        {user?.role === 'expert' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Expert Dashboard</h2>
              <Link to="/expert" className="text-green-600 hover:text-green-500 text-sm font-medium">
                View Full Dashboard →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/consultations?status=open"
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Open Consultations</p>
                    <p className="text-sm text-gray-600">Available for assignment</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/consultations?status=assigned&expert=me"
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center">
                  <User className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">My Consultations</p>
                    <p className="text-sm text-gray-600">Assigned to you</p>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/consultations?priority=urgent"
                className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Urgent Cases</p>
                    <p className="text-sm text-gray-600">Need immediate attention</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Consultations;