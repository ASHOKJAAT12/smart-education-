const express = require('express');
const { getHealth, getReadiness } = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Liveness — is the process running? Independent of the database.
 * @access  Public
 */
router.get('/', getHealth);

/**
 * @route   GET /api/v1/health/ready
 * @desc    Readiness — can the API serve traffic? 503 when the DB is down.
 * @access  Public
 */
router.get('/ready', getReadiness);

module.exports = router;
