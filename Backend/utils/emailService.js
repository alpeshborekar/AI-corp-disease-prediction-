// This file was referenced in authController.js but not created
// It's actually covered by notificationService.js, but let's create it for clarity

const { sendEmail: sendEmailNotification } = require('./notificationService');

// Wrapper function for backward compatibility
exports.sendEmail = async (options) => {
  return await sendEmailNotification(options);
};

// Export the notification service functions
const notificationService = require('./notificationService');
module.exports = {
  ...module.exports,
  ...notificationService
};