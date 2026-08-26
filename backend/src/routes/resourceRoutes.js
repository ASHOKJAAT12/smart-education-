const express = require('express');
const router = express.Router();
const { getResources, getResourceById, createResource, updateResource, deleteResource } = require('../controllers/resourceController');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorize');
const { uploadSingle } = require('../middleware/upload');
const { createResourceValidators, updateResourceValidators } = require('../validators/courseValidators');

router.get('/', optionalAuth, getResources);
router.get('/:id', optionalAuth, getResourceById);

// Create: file upload optional (links don't need a file)
router.post(
    '/',
    authenticateUser,
    authorizeRoles('teacher', 'admin'),
    uploadSingle('file'),
    createResourceValidators,
    createResource
);
router.patch(
    '/:id',
    authenticateUser,
    authorizeRoles('teacher', 'admin'),
    uploadSingle('file'),
    updateResourceValidators,
    updateResource
);
router.delete('/:id', authenticateUser, authorizeRoles('teacher', 'admin'), deleteResource);

module.exports = router;
