const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const rateLimit = require('express-rate-limit');

// Rate limiting for comment creation to prevent spam
const commentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 comments per minute
  message: { message: 'Too many comments created. Please wait a minute before posting again.' }
});

router.post('/:postId', protect, validateObjectId('postId'), commentLimiter, addComment);
router.get('/:postId', validateObjectId('postId'), getComments);
router.delete('/:commentId', protect, validateObjectId('commentId'), deleteComment);

module.exports = router;
