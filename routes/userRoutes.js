const express = require('express');
const router = express.Router();
const { getSavedPosts } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/saved-posts', protect, getSavedPosts);

module.exports = router;
