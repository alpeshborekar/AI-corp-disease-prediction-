const express = require('express');
const User = require('../models/User');
const Disease = require('../models/Disease');
const Consultation = require('../models/Consultation');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Disease prevalence report
router.get('/disease-prevalence', async (req, res) => {
  try {
    const { cropType, region, dateRange, limit = 10 } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        dateFilter.createdAt = {
          $gte: new Date(range.startDate),
          $lte: new Date(range.endDate)
        };
      } catch (parseError) {
        console.error('Date range parse error:', parseError);
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          isActive: true,
          'aiPrediction.diseaseName': { $exists: true, $ne: null },
          ...dateFilter
        }
      }
    ];

    // Add crop type filter if specified
    if (cropType && cropType !== 'all') {
      pipeline[0].$match.cropType = cropType;
    }

    // Add region filter if specified
    if (region) {
      pipeline[0].$match['location.state'] = { $regex: region, $options: 'i' };
    }

    // Group by disease and count occurrences
    pipeline.push(
      {
        $group: {
          _id: '$aiPrediction.diseaseName',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiPrediction.confidence' },
          locations: { $push: '$location' },
          cropTypes: { $push: '$cropType' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    );

    const diseasePrevalence = await Consultation.aggregate(pipeline);

    // Get additional statistics
    const totalPredictions = await Consultation.countDocuments({
      isActive: true,
      'aiPrediction.diseaseName': { $exists: true, $ne: null },
      ...dateFilter
    });

    res.status(200).json({
      status: 'success',
      data: {
        diseasePrevalence,
        summary: {
          totalPredictions,
          uniqueDiseases: diseasePrevalence.length,
          filters: { cropType, region, dateRange }
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Disease prevalence report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate disease prevalence report'
    });
  }
});

// Regional analysis report
router.get('/regional-analysis', async (req, res) => {
  try {
    const { cropType, diseaseType } = req.query;

    const pipeline = [
      {
        $match: {
          isActive: true,
          'location.state': { $exists: true, $ne: null }
        }
      }
    ];

    // Add filters
    if (cropType && cropType !== 'all') {
      pipeline[0].$match.cropType = cropType;
    }

    if (diseaseType && diseaseType !== 'all') {
      pipeline[0].$match['aiPrediction.diseaseName'] = { $regex: diseaseType, $options: 'i' };
    }

    // Group by state and district
    pipeline.push(
      {
        $group: {
          _id: {
            state: '$location.state',
            district: '$location.district'
          },
          consultationCount: { $sum: 1 },
          diseases: { $push: '$aiPrediction.diseaseName' },
          cropTypes: { $push: '$cropType' },
          avgResolutionTime: { $avg: '$actualResolutionTime' }
        }
      },
      {
        $group: {
          _id: '$_id.state',
          districts: {
            $push: {
              district: '$_id.district',
              consultationCount: '$consultationCount',
              diseases: '$diseases',
              cropTypes: '$cropTypes',
              avgResolutionTime: '$avgResolutionTime'
            }
          },
          stateTotal: { $sum: '$consultationCount' }
        }
      },
      { $sort: { stateTotal: -1 } }
    );

    const regionalData = await Consultation.aggregate(pipeline);

    // Process and clean the data
    const processedData = regionalData.map(state => ({
      state: state._id,
      totalConsultations: state.stateTotal,
      districts: state.districts.map(district => ({
        name: district.district,
        consultations: district.consultationCount,
        uniqueDiseases: [...new Set(district.diseases.filter(d => d))].length,
        uniqueCrops: [...new Set(district.cropTypes)].length,
        avgResolutionTime: Math.round(district.avgResolutionTime || 0)
      })).filter(d => d.name) // Remove districts with null names
    }));

    res.status(200).json({
      status: 'success',
      data: {
        regionalAnalysis: processedData,
        summary: {
          totalStates: processedData.length,
          totalDistricts: processedData.reduce((sum, state) => sum + state.districts.length, 0),
          filters: { cropType, diseaseType }
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Regional analysis report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate regional analysis report'
    });
  }
});

// Expert performance report (admin and experts only)
router.get('/expert-performance', restrictTo('admin', 'expert'), async (req, res) => {
  try {
    const { dateRange, expertId } = req.query;
    
    // Build query
    let query = {
      isActive: true,
      expert: { $exists: true, $ne: null },
      status: { $in: ['resolved', 'closed'] }
    };

    // Filter by specific expert if provided
    if (expertId) {
      query.expert = expertId;
    }

    // Add date filter
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        query.resolvedAt = {
          $gte: new Date(range.startDate),
          $lte: new Date(range.endDate)
        };
      } catch (parseError) {
        console.error('Date range parse error:', parseError);
      }
    }

    // If user is an expert (not admin), only show their own data
    if (req.user.role === 'expert') {
      query.expert = req.user.userId;
    }

    const performanceData = await Consultation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$expert',
          totalConsultations: { $sum: 1 },
          avgResolutionTime: { $avg: '$actualResolutionTime' },
          avgFarmerRating: { $avg: '$rating.farmerRating' },
          consultationsByPriority: {
            $push: '$priority'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'expertInfo'
        }
      },
      {
        $project: {
          expertInfo: { $arrayElemAt: ['$expertInfo', 0] },
          totalConsultations: 1,
          avgResolutionTime: { $round: ['$avgResolutionTime', 0] },
          avgFarmerRating: { $round: ['$avgFarmerRating', 1] },
          urgentCount: {
            $size: {
              $filter: {
                input: '$consultationsByPriority',
                cond: { $eq: ['$$this', 'urgent'] }
              }
            }
          },
          highCount: {
            $size: {
              $filter: {
                input: '$consultationsByPriority',
                cond: { $eq: ['$$this', 'high'] }
              }
            }
          }
        }
      },
      { $sort: { avgFarmerRating: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        expertPerformance: performanceData.map(expert => ({
          expertId: expert._id,
          name: expert.expertInfo?.name || 'Unknown',
          email: expert.expertInfo?.email || 'Unknown',
          specialization: expert.expertInfo?.profile?.expertise?.specialization || [],
          totalConsultations: expert.totalConsultations,
          avgResolutionTime: expert.avgResolutionTime,
          avgFarmerRating: expert.avgFarmerRating || 0,
          urgentCasesHandled: expert.urgentCount,
          highPriorityCasesHandled: expert.highCount
        })),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Expert performance report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate expert performance report'
    });
  }
});

// User activity report
router.get('/user-activity', restrictTo('admin'), async (req, res) => {
  try {
    const { dateRange, userType = 'all' } = req.query;
    
    let dateFilter = {};
    if (dateRange) {
      try {
        const range = JSON.parse(dateRange);
        dateFilter = {
          $gte: new Date(range.startDate),
          $lte: new Date(range.endDate)
        };
      } catch (parseError) {
        console.error('Date range parse error:', parseError);
      }
    }

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          isActive: true,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
          ...(userType !== 'all' ? { role: userType } : {})
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          roles: { $push: '$role' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Active users (users who logged in recently)
    const activeUsers = await User.aggregate([
      {
        $match: {
          isActive: true,
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgLoginCount: { $avg: '$loginCount' }
        }
      }
    ]);

    // User engagement (consultations created)
    const userEngagement = await Consultation.aggregate([
      {
        $match: {
          isActive: true,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: '$farmer',
          consultationCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgConsultationsPerUser: { $avg: '$consultationCount' },
          maxConsultations: { $max: '$consultationCount' },
          minConsultations: { $min: '$consultationCount' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        registrationTrends,
        activeUsers,
        engagement: userEngagement[0] || {
          totalUsers: 0,
          avgConsultationsPerUser: 0,
          maxConsultations: 0,
          minConsultations: 0
        },
        summary: {
          totalActiveUsers: activeUsers.reduce((sum, role) => sum + role.count, 0),
          filters: { dateRange, userType }
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('User activity report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate user activity report'
    });
  }
});

// System usage report
router.get('/system-usage', restrictTo('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalConsultations,
      newConsultations,
      totalPredictions,
      avgPredictionAccuracy,
      topDiseases,
      topCrops
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, createdAt: { $gte: thirtyDaysAgo } }),
      Consultation.countDocuments({ isActive: true }),
      Consultation.countDocuments({ isActive: true, createdAt: { $gte: thirtyDaysAgo } }),
      Consultation.countDocuments({ 'aiPrediction.diseaseName': { $exists: true } }),
      Consultation.aggregate([
        { $match: { 'aiPrediction.confidence': { $exists: true } } },
        { $group: { _id: null, avgConfidence: { $avg: '$aiPrediction.confidence' } } }
      ]),
      Consultation.aggregate([
        { $match: { 'aiPrediction.diseaseName': { $exists: true, $ne: null } } },
        { $group: { _id: '$aiPrediction.diseaseName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Consultation.aggregate([
        { $match: { cropType: { $exists: true } } },
        { $group: { _id: '$cropType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          newUsersLast30Days: newUsers,
          totalConsultations,
          newConsultationsLast30Days: newConsultations,
          totalPredictions,
          avgPredictionAccuracy: avgPredictionAccuracy[0]?.avgConfidence || 0
        },
        trends: {
          topDiseases,
          topCrops
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('System usage report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate system usage report'
    });
  }
});

module.exports = router;