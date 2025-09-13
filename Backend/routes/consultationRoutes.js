const express = require('express');
const {
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
} = require('../controllers/consultationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadFiles } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// General routes
router.get('/', getConsultations);
router.get('/statistics', getConsultationStatistics);
router.get('/open', restrictTo('expert', 'admin'), getOpenConsultations);
router.get('/:id', getConsultationById);

// Create consultation
router.post('/',
  uploadFiles.fields([
    { name: 'images', maxCount: 5 }
  ]),
  createConsultation
);

// Update consultation status
router.patch('/:id/status', updateConsultationStatus);

// Send message in consultation
router.post('/:id/messages',
  uploadFiles.fields([
    { name: 'attachments', maxCount: 3 }
  ]),
  sendMessage
);

// Assign expert to consultation
router.patch('/:id/assign', assignExpert);

// Rate consultation
router.post('/:id/rate', rateConsultation);

// Delete consultation (admin or owner only)
router.delete('/:id', deleteConsultation);

module.exports = router;