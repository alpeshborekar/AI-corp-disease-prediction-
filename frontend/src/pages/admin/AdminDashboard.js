import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAPI, reportsAPI } from '../../services/api';
import { 
  Users, 
  Activity, 
  BarChart3, 
  Settings,
  Shield,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState({ role: 'all', status: 'all', search: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers({ page: 1, limit: 50 })
      ]);
      
      setDashboardData(dashboardResponse.data);
      setUsers(usersResponse.data.users);
    } catch (error) {
      console.error('Admin dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, updates) => {
    try {
      await adminAPI.updateUserStatus(userId, updates);
      toast.success('User status updated');
      loadDashboardData();
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user status');
    }
  };

  const exportUsers = async (format = 'json') => {
    try {
      await adminAPI.exportUsers(format);
      toast.success('Export started - check your downloads');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'system', label: 'System Health', icon: Settings }
  ];

  const filteredUsers = users.filter(user => {
    const matchesRole = userFilter.role === 'all' || user.role === userFilter.role;
    const matchesStatus = userFilter.status === 'all' || 
      (userFilter.status === 'active' && user.isActive) ||
      (userFilter.status === 'inactive' && !user.isActive);
    const matchesSearch = !userFilter.search || 
      user.name.toLowerCase().includes(userFilter.search.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilter.search.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, monitor system health, and view analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardData}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
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
                  {tab.label}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && dashboardData && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.summary?.totalUsers || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Farmers</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.summary?.totalFarmers || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Experts</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.summary?.totalExperts || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Activity className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Consultations</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.summary?.totalConsultations || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (30 days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.userGrowth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {dashboardData.recentActivity?.recentUsers?.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">Joined • {user.role}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="form-label">Search Users</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email"
                        value={userFilter.search}
                        onChange={(e) => setUserFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="form-input pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Role</label>
                    <select
                      value={userFilter.role}
                      onChange={(e) => setUserFilter(prev => ({ ...prev, role: e.target.value }))}
                      className="form-select"
                    >
                      <option value="all">All Roles</option>
                      <option value="farmer">Farmers</option>
                      <option value="expert">Experts</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={userFilter.status}
                      onChange={(e) => setUserFilter(prev => ({ ...prev, status: e.target.value }))}
                      className="form-select"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <button
                      onClick={() => exportUsers('csv')}
                      className="btn-secondary flex items-center w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'expert' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => updateUserStatus(user._id, { isActive: !user.isActive })}
                              className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                                user.isActive 
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {user.isActive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Farmers', value: dashboardData?.summary?.totalFarmers || 0 },
                          { name: 'Experts', value: dashboardData?.summary?.totalExperts || 0 },
                          { name: 'Admins', value: 1 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">Database</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Healthy</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">API Services</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">Storage</span>
                    </div>
                    <span className="text-sm text-yellow-600 font-medium">85% Used</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Server Status</p>
                    <p className="text-lg font-semibold text-blue-600">Online</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-lg font-semibold text-green-600">99.9%</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Active Sessions</p>
                    <p className="text-lg font-semibold text-purple-600">127</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Events</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Database backup completed</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Security scan passed</p>
                      <p className="text-xs text-gray-500">6 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-blue-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">System update applied</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;