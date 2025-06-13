const express = require('express');
const path = require('path');
const router = express.Router();

// @desc    Serve test PDF report
// @route   GET /api/test/pdf-report
// @access  Public
router.get('/pdf-report', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-pdf-report.html'));
});

module.exports = router;
