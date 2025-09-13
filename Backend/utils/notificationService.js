const nodemailer = require('nodemailer');

// Email transporter configuration
let emailTransporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter initialized successfully');
  } catch (error) {
    console.warn('⚠️ Email transporter initialization failed:', error.message);
    emailTransporter = null;
  }
} else {
  console.warn('⚠️ Email credentials not configured - Email notifications disabled');
}

// Send email notification
exports.sendEmail = async (options) => {
  try {
    if (!emailTransporter) {
      console.warn('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `"Crop Disease Management" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: generateEmailTemplate(options.template, options.data),
      text: options.text || generateTextVersion(options.template, options.data)
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
};

// General notification sender
exports.sendNotification = async (notificationData) => {
  try {
    const { userId, type, title, message, data = {} } = notificationData;

    // Get user details to determine preferred notification methods
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found for notification:', userId);
      return false;
    }

    const notifications = [];

    // Send email notification if enabled
    if (user.notifications.email) {
      notifications.push(
        exports.sendEmail({
          email: user.email,
          subject: title,
          template: 'notification',
          data: {
            name: user.name,
            title,
            message,
            type,
            ...data
          }
        })
      );
    }

    // Push notification placeholder
    if (user.notifications.push) {
      console.log('📲 Push notification would be sent to:', userId);
    }

    const results = await Promise.allSettled(notifications);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;

    console.log(`✅ Notification sent: ${successCount}/${notifications.length} successful`);
    return successCount > 0;
  } catch (error) {
    console.error('❌ Notification sending error:', error);
    return false;
  }
};

// Send bulk notifications
exports.sendBulkNotifications = async (notifications) => {
  try {
    const results = await Promise.allSettled(
      notifications.map(notification => exports.sendNotification(notification))
    );

    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value
    ).length;

    console.log(`📢 Bulk notifications sent: ${successCount}/${notifications.length} successful`);
    return successCount;
  } catch (error) {
    console.error('❌ Bulk notification error:', error);
    return 0;
  }
};

// Send consultation notifications
exports.sendConsultationNotification = async (consultation, type, additionalData = {}) => {
  try {
    const notifications = [];

    switch (type) {
      case 'created':
        // Notify available experts
        const User = require('../models/User');
        const experts = await User.findExpertsBySpecialization(
          getCategoryMapping(consultation.category),
          consultation.location,
          10
        );

        experts.forEach(expert => {
          notifications.push({
            userId: expert._id,
            type: 'new-consultation',
            title: 'New Consultation Available',
            message: `A new ${consultation.category} consultation is available for ${consultation.cropType}`,
            data: {
              consultationId: consultation._id,
              cropType: consultation.cropType,
              category: consultation.category
            }
          });
        });
        break;

      case 'assigned':
        notifications.push({
          userId: consultation.expert,
          type: 'consultation-assigned',
          title: 'New Consultation Assigned',
          message: `You have been assigned to: ${consultation.title}`,
          data: {
            consultationId: consultation._id,
            farmerName: additionalData.farmerName
          }
        });
        break;

      case 'message':
        // Notify the other participant
        const recipientId = additionalData.senderId === consultation.farmer.toString()
          ? consultation.expert
          : consultation.farmer;

        if (recipientId) {
          notifications.push({
            userId: recipientId,
            type: 'new-message',
            title: 'New Message in Consultation',
            message: additionalData.message.substring(0, 100) + '...',
            data: {
              consultationId: consultation._id,
              senderName: additionalData.senderName
            }
          });
        }
        break;

      case 'resolved':
        notifications.push({
          userId: consultation.farmer,
          type: 'consultation-resolved',
          title: 'Consultation Resolved',
          message: `Your consultation "${consultation.title}" has been resolved`,
          data: {
            consultationId: consultation._id
          }
        });
        break;
    }

    return await exports.sendBulkNotifications(notifications);
  } catch (error) {
    console.error('❌ Consultation notification error:', error);
    return 0;
  }
};

// Email templates
const generateEmailTemplate = (template, data) => {
  switch (template) {
    case 'verification':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Welcome to Crop Disease Management System!</h2>
          <p>Hello ${data.name},</p>
          <p>Please verify your email by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>This link will expire in 24 hours.</p>
        </div>
      `;

    case 'passwordReset':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Password Reset Request</h2>
          <p>Hello ${data.name},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background-color: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
        </div>
      `;

    case 'notification':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">${data.title}</h2>
          <p>Hello ${data.name},</p>
          <p>${data.message}</p>
          ${data.consultationId ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/consultations/${data.consultationId}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Consultation</a>
            </div>
          ` : ''}
        </div>
      `;

    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">Crop Disease Management System</h2>
          <p>Hello ${data.name},</p>
          <p>${data.message}</p>
        </div>
      `;
  }
};

// Generate text version of emails
const generateTextVersion = (template, data) => {
  switch (template) {
    case 'verification':
      return `Hello ${data.name}, please verify your email: ${data.verificationUrl}`;
    case 'passwordReset':
      return `Hello ${data.name}, reset your password: ${data.resetUrl}`;
    default:
      return `${data.title}\n\nHello ${data.name},\n\n${data.message}`;
  }
};

// Map consultation category to expert specialization
const getCategoryMapping = (category) => {
  const mapping = {
    'disease-diagnosis': 'plant-pathology',
    'pest-control': 'entomology',
    'nutrition': 'agronomy',
    'irrigation': 'agronomy',
    'general': 'agronomy'
  };
  return mapping[category] || 'agronomy';
};
