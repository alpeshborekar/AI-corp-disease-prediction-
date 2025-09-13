const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const path = require('path');
const fs = require('fs').promises;

// Create new consultation
const createConsultation = async (req, res) => {
  try {
    const { title, description, cropType, urgency, location } = req.body;
    const userId = req.user.id;

    // Handle uploaded images
    let imagePaths = [];
    if (req.files && req.files.images) {
      imagePaths = req.files.images.map(file => file.path);
    }

    const consultation = await Consultation.create({
      userId,
      title,
      description,
      cropType,
      urgency: urgency || 'medium',
      location,
      images: imagePaths,
      status: 'open'
    });

    await consultation.populate('userId', 'name email');

    // Send notification to available experts
    const experts = await User.find({ 
      role: 'expert', 
      isActive: true,
      specialization: { $in: [cropType, 'general'] }
    });

    for (const expert of experts) {
      try {
        await sendEmail({
          to: expert.email,
          subject: 'New Consultation Available',
          html: `
            <h2>New Consultation Request</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Crop Type:</strong> ${cropType}</p>
            <p><strong>Urgency:</strong> ${urgency}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p>Please log in to the system to review and respond to this consultation.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email to expert:', expert.email, emailError);
      }
    }

    res.status(201).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating consultation',
      error: error.message
    });
  }
};

// Get all consultations (with filters)
const getConsultations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, cropType, urgency, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Role-based filtering
    if (userRole === 'farmer') {
      filter.userId = userId;
    } else if (userRole === 'expert') {
      filter.$or = [
        { expertId: userId },
        { status: 'open' }
      ];
    }
    // Admin can see all consultations

    // Additional filters
    if (status) filter.status = status;
    if (cropType) filter.cropType = cropType;
    if (urgency) filter.urgency = urgency;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'expertId', select: 'name email specialization' }
      ],
      sort: { createdAt: -1 }
    };

    const consultations = await Consultation.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: consultations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching consultations',
      error: error.message
    });
  }
};

// Get consultation by ID
const getConsultationById = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const consultation = await Consultation.findById(consultationId)
      .populate('userId', 'name email')
      .populate('expertId', 'name email specialization')
      .populate('messages.senderId', 'name email role');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      userRole === 'admin' ||
      consultation.userId._id.toString() === userId ||
      consultation.expertId?._id.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation',
      error: error.message
    });
  }
};

// Update consultation status
const updateConsultationStatus = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { status, resolution } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const consultation = await Consultation.findById(consultationId)
      .populate('userId', 'name email')
      .populate('expertId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const canUpdate = 
      userRole === 'admin' ||
      consultation.expertId?._id.toString() === userId ||
      (consultation.userId._id.toString() === userId && status === 'cancelled');

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this consultation'
      });
    }

    // Update consultation
    consultation.status = status;
    if (resolution) consultation.resolution = resolution;
    if (status === 'closed') consultation.closedAt = new Date();

    await consultation.save();

    // Send notification email
    const recipient = userRole === 'expert' ? consultation.userId : consultation.expertId;
    if (recipient) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `Consultation Status Updated - ${consultation.title}`,
          html: `
            <h2>Consultation Status Update</h2>
            <p>The consultation "${consultation.title}" has been updated to: <strong>${status}</strong></p>
            ${resolution ? `<p><strong>Resolution:</strong> ${resolution}</p>` : ''}
            <p>Please log in to view the full details.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating consultation status',
      error: error.message
    });
  }
};

// Send message in consultation
const sendMessage = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const consultation = await Consultation.findById(consultationId)
      .populate('userId', 'name email')
      .populate('expertId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      userRole === 'admin' ||
      consultation.userId._id.toString() === userId ||
      consultation.expertId?._id.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Handle uploaded attachments
    let attachmentPaths = [];
    if (req.files && req.files.attachments) {
      attachmentPaths = req.files.attachments.map(file => file.path);
    }

    // Add message to consultation
    const newMessage = {
      senderId: userId,
      message,
      attachments: attachmentPaths,
      timestamp: new Date()
    };

    consultation.messages.push(newMessage);
    consultation.lastActivity = new Date();
    await consultation.save();

    // Populate the new message
    await consultation.populate('messages.senderId', 'name email role');
    const populatedMessage = consultation.messages[consultation.messages.length - 1];

    // Send notification to other party
    const recipient = consultation.userId._id.toString() === userId ? 
      consultation.expertId : consultation.userId;

    if (recipient) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `New message in consultation - ${consultation.title}`,
          html: `
            <h2>New Message</h2>
            <p>You have received a new message in the consultation: "${consultation.title}"</p>
            <p><strong>Message:</strong> ${message}</p>
            <p>Please log in to view and respond.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send message notification email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Assign expert to consultation
const assignExpert = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { expertId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const consultation = await Consultation.findById(consultationId)
      .populate('userId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if consultation is open
    if (consultation.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Consultation is not available for assignment'
      });
    }

    // Auto-assign (expert assigns themselves) or admin assignment
    let targetExpertId = expertId;
    if (userRole === 'expert' && !expertId) {
      targetExpertId = userId;
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign experts'
      });
    }

    // Verify expert exists and is active
    const expert = await User.findOne({ 
      _id: targetExpertId, 
      role: 'expert', 
      isActive: true 
    });

    if (!expert) {
      return res.status(400).json({
        success: false,
        message: 'Expert not found or inactive'
      });
    }

    // Assign expert
    consultation.expertId = targetExpertId;
    consultation.status = 'in_progress';
    consultation.assignedAt = new Date();
    await consultation.save();

    await consultation.populate('expertId', 'name email specialization');

    // Send notifications
    try {
      // Notify farmer
      await sendEmail({
        to: consultation.userId.email,
        subject: `Expert assigned to your consultation - ${consultation.title}`,
        html: `
          <h2>Expert Assigned</h2>
          <p>An expert has been assigned to your consultation: "${consultation.title}"</p>
          <p><strong>Expert:</strong> ${expert.name}</p>
          <p><strong>Specialization:</strong> ${expert.specialization}</p>
          <p>The expert will contact you soon to help resolve your query.</p>
        `
      });

      // Notify expert
      await sendEmail({
        to: expert.email,
        subject: `New consultation assigned - ${consultation.title}`,
        html: `
          <h2>Consultation Assigned</h2>
          <p>You have been assigned to a consultation: "${consultation.title}"</p>
          <p><strong>Crop Type:</strong> ${consultation.cropType}</p>
          <p><strong>Urgency:</strong> ${consultation.urgency}</p>
          <p>Please log in to review the details and start helping the farmer.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send assignment notification emails:', emailError);
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning expert',
      error: error.message
    });
  }
};

// Rate consultation
const rateConsultation = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { rating, review } = req.body;
    const userId = req.user.id;

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Only the farmer (user who created consultation) can rate
    if (consultation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the consultation creator can rate'
      });
    }

    // Can only rate closed consultations
    if (consultation.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate closed consultations'
      });
    }

    // Check if already rated
    if (consultation.rating) {
      return res.status(400).json({
        success: false,
        message: 'Consultation already rated'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Add rating
    consultation.rating = rating;
    consultation.review = review;
    consultation.ratedAt = new Date();
    await consultation.save();

    // Update expert's rating statistics
    if (consultation.expertId) {
      const expert = await User.findById(consultation.expertId);
      if (expert) {
        const expertConsultations = await Consultation.find({
          expertId: consultation.expertId,
          rating: { $exists: true }
        });

        const totalRating = expertConsultations.reduce((sum, c) => sum + c.rating, 0);
        const avgRating = totalRating / expertConsultations.length;

        expert.averageRating = avgRating;
        expert.totalRatings = expertConsultations.length;
        await expert.save();
      }
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rating consultation',
      error: error.message
    });
  }
};

// Get open consultations (for experts)
const getOpenConsultations = async (req, res) => {
  try {
    const { cropType, urgency, page = 1, limit = 10 } = req.query;

    let filter = { status: 'open' };

    if (cropType) filter.cropType = cropType;
    if (urgency) filter.urgency = urgency;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'userId', select: 'name email' }
      ],
      sort: { createdAt: -1 }
    };

    const consultations = await Consultation.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: consultations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching open consultations',
      error: error.message
    });
  }
};

// Get consultation statistics
const getConsultationStatistics = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let matchCondition = {};
    
    if (userRole === 'farmer') {
      matchCondition.userId = userId;
    } else if (userRole === 'expert') {
      matchCondition.expertId = userId;
    }
    // Admin gets all statistics

    const stats = await Consultation.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          avgRating: { 
            $avg: { 
              $cond: [{ $ne: ['$rating', null] }, '$rating', null] 
            } 
          }
        }
      }
    ]);

    // Get crop type distribution
    const cropStats = await Consultation.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$cropType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly consultation trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Consultation.aggregate([
      { 
        $match: { 
          ...matchCondition,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const result = {
      overview: stats[0] || {
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0,
        cancelled: 0,
        avgRating: 0
      },
      cropDistribution: cropStats,
      monthlyTrends: monthlyStats
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation statistics',
      error: error.message
    });
  }
};

// Delete consultation
const deleteConsultation = async (req, res) => {
  try {
    const consultationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const consultation = await Consultation.findById(consultationId);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if user is admin or owner of the consultation
    if (userRole !== 'admin' && consultation.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this consultation'
      });
    }

    // Delete associated files
    try {
      // Delete consultation images
      if (consultation.images && consultation.images.length > 0) {
        for (const imagePath of consultation.images) {
          try {
            await fs.unlink(imagePath);
          } catch (fileError) {
            console.error('Error deleting image file:', imagePath, fileError);
          }
        }
      }

      // Delete message attachments
      if (consultation.messages && consultation.messages.length > 0) {
        for (const message of consultation.messages) {
          if (message.attachments && message.attachments.length > 0) {
            for (const attachmentPath of message.attachments) {
              try {
                await fs.unlink(attachmentPath);
              } catch (fileError) {
                console.error('Error deleting attachment file:', attachmentPath, fileError);
              }
            }
          }
        }
      }
    } catch (fileError) {
      console.error('Error deleting consultation files:', fileError);
      // Continue with deletion even if file cleanup fails
    }

    await Consultation.findByIdAndDelete(consultationId);

    res.status(200).json({
      success: true,
      message: 'Consultation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting consultation',
      error: error.message
    });
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
  sendMessage,
  assignExpert,
  rateConsultation,
  getOpenConsultations,
  getConsultationStatistics,
  deleteConsultation
};