const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API health check — returns status, DB state, uptime
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
