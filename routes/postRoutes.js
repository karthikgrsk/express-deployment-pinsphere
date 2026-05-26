const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  createPost, 
  searchPosts, 
  likePost, 
  getLikes, 
  savePost 
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const upload = require('../config/cloudinary');

router.get('/', getPosts);
router.get('/search', searchPosts);
router.post('/create', protect, upload.single('media'), createPost);

// Social interaction routes
router.post('/:id/like', protect, validateObjectId('id'), likePost);
router.get('/:id/likes', validateObjectId('id'), getLikes);
router.post('/:id/save', protect, validateObjectId('id'), savePost);

module.exports = router;
