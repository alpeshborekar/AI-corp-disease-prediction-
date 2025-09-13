const express = require('express');
const User = require('../models/User');
const Disease = require('../models/Disease');
const Consultation = require('../models/Consultation');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes are protected and restricted to admin only
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard Statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalExperts,
      totalDiseases,
      totalConsultations,
      activeConsultations,
      recentUsers,
      recentConsultations
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'farmer', isActive: true }),
      User.countDocuments({ role: 'expert', isActive: true }),
      Disease.countDocuments({ isActive: true }),
      Consultation.countDocuments({ isActive: true }),
      Consultation.countDocuments({ status: { $in: ['open', 'assigned', 'in-progress'] }, isActive: true }),
      User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Consultation.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('farmer', 'name email')
        .populate('expert', 'name email')
        .select('title status priority createdAt')
    ]);

    // User growth statistics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalUsers,
          totalFarmers,
          totalExperts,
          totalDiseases,
          totalConsultations,
          activeConsultations
        },
        recentActivity: {
          recentUsers,
          recentConsultations
        },
        userGrowth
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;
    
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
});

// Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// System Health Check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await User.findOne().lean() ? 'connected' : 'disconnected';
    
    // Check recent activity
    const recentActivity = await Promise.all([
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Consultation.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        system: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        database: {
          status: dbStatus,
          collections: {
            users: await User.countDocuments(),
            diseases: await Disease.countDocuments(),
            consultations: await Consultation.countDocuments()
          }
        },
        activity: {
          newUsersToday: recentActivity[0],
          newConsultationsToday: recentActivity[1]
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Export users data
router.get('/export/users', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const users = await User.find({ isActive: true })
      .select('-password -verificationToken')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.profile?.phone || '',
        location: user.profile?.location ? 
          `${user.profile.location.village || ''}, ${user.profile.location.district || ''}, ${user.profile.location.state || ''}` : '',
        joinDate: user.createdAt?.toISOString().split('T')[0] || '',
        isVerified: user.isVerified ? 'Yes' : 'No'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      // Simple CSV conversion
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      
      return res.send(csv);
    }

    res.status(200).json({
      status: 'success',
      data: {
        users,
        exportedAt: new Date(),
        totalCount: users.length
      }
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export users data'
    });
  }
});

module.exports = router;