import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { consultationAPI } from '../../services/api';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  TrendingUp,
  Calendar,
  MapPin,
  Eye,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExpertDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openConsultations, setOpenConsultations] = useState([]);
  const [myConsultations, setMyConsultations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    priority: 'all',
    cropType: 'all',
    category: 'all'
  });

  useEffect(() => {
    loadExpertData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadExpertData = async () => {
    try {
      setLoading(true);
      const [openResponse, myResponse, statsResponse] = await Promise.all([
        consultationAPI.getOpenConsultations(filter),
        consultationAPI.getAll({ expert: user._id, ...filter }),
        consultationAPI.getStatistics()
      ]);
      
      setOpenConsultations(openResponse.data.consultations || []);
      setMyConsultations(myResponse.data.consultations || []);
      setStats(statsResponse.data || {});
    } catch (error) {
      console.error('Expert dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const assignConsultation = async (consultationId) => {
    try {
      await consultationAPI.assignExpert(consultationId, user._id);
      toast.success('Consultation assigned successfully');
      loadExpertData();
    } catch (error) {
      console.error('Assign consultation error:', error);
      toast.error('Failed to assign consultation');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expert dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Dashboard</h1>
              <p className="text-gray-600">Help farmers with agricultural expertise and guidance</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-lg font-semibold text-gray-800">{user?.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white shadow rounded-xl p-6 flex items-center">
            <User className="h-10 w-10 text-green-600 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">My Consultations</p>
              <p className="text-2xl font-bold">{stats.myConsultations || 0}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center">
            <Clock className="h-10 w-10 text-yellow-600 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Open Consultations</p>
              <p className="text-2xl font-bold">{stats.openConsultations || 0}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center">
            <CheckCircle className="h-10 w-10 text-blue-600 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Resolved</p>
              <p className="text-2xl font-bold">{stats.resolved || 0}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-xl p-6 flex items-center">
            <TrendingUp className="h-10 w-10 text-purple-600 mr-4" />
            <div>
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-2xl font-bold">{stats.successRate || 0}%</p>
            </div>
          </div>
        </div>

        {/* Open Consultations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Consultations</h2>
          {openConsultations.length === 0 ? (
            <p className="text-gray-600">No open consultations available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openConsultations.map((consultation) => (
                <motion.div
                  key={consultation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                    <span className="text-sm text-gray-500">{getTimeAgo(consultation.createdAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{consultation.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{consultation.description}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => assignConsultation(consultation._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" /> Take Case
                    </button>
                    <Link
                      to={`/consultations/${consultation._id}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* My Consultations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Consultations</h2>
          {myConsultations.length === 0 ? (
            <p className="text-gray-600">You haven’t taken any consultations yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myConsultations.map((consultation) => (
                <motion.div
                  key={consultation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                      {consultation.status}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(consultation.createdAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{consultation.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{consultation.description}</p>
                  <div className="flex justify-between items-center">
                    <Link
                      to={`/consultations/${consultation._id}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
