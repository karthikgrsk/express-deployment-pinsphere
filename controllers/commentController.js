const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Helper function to sanitize text input (remove HTML tags)
const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim();
};

// @desc    Add a comment to a post
// @route   POST /api/comments/:postId
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    const sanitized = sanitizeText(text);
    if (!sanitized) {
      return res.status(400).json({ message: 'Comment text cannot be empty or contain only HTML tags' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      text: sanitized,
      post: postId,
      user: req.user._id
    });

    // Populate user info for the response
    const populated = await Comment.findById(comment._id).populate('user', 'username avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post (paginated)
// @route   GET /api/comments/:postId
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .populate('user', 'username avatar')
      .sort({ createdAt: 1 }) // Chronological order
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: postId });

    res.json({
      comments,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
