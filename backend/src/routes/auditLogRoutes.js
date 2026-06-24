const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAuditLogs,
  getAuditLog,
  exportAuditLogs,
} = require('../controllers/auditLogController');

// All audit log routes are restricted to Super Admin only
router.use(protect, authorize('super-admin'));

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);
router.get('/:id', getAuditLog);

module.exports = router;