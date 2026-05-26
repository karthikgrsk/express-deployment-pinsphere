const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all posts (paginated using aggregation pipeline)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          mediaUrl: 1,
          mediaType: 1,
          category: 1,
          createdAt: 1,
          likesCount: 1,
          likedBy: 1,
          commentsCount: { $size: '$comments' },
          'user._id': 1,
          'user.username': 1,
          'user.avatar': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const total = await Post.countDocuments();

    res.json({
      posts,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts/create
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    
    // Check if media URL was provided directly or uploaded via file
    let mediaUrl = req.body.mediaUrl;
    let mediaType = req.body.mediaType || 'image';

    if (req.file) {
      mediaUrl = req.file.path || req.file.secure_url;
      // Detect if it is video based on mime type or path
      if (req.file.mimetype && req.file.mimetype.startsWith('video')) {
        mediaType = 'video';
      } else if (req.file.path && req.file.path.match(/\.(mp4|mov|avi|webm)$/i)) {
        mediaType = 'video';
      }
    }

    if (!mediaUrl) {
      return res.status(400).json({ message: 'Media (image or video) is required' });
    }

    const post = await Post.create({
      title,
      description,
      mediaUrl,
      mediaType,
      category: category || 'General',
      user: req.user._id
    });

    // Populate user info for the response
    const populatedPost = await Post.findById(post._id).populate('user', 'username avatar');

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Search posts using aggregation pipeline
// @route   GET /api/posts/search
// @access  Public
exports.searchPosts = async (req, res, next) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: 'Search query parameter (q) is required' });
    }

    // Search query object
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    const posts = await Post.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          mediaUrl: 1,
          mediaType: 1,
          category: 1,
          createdAt: 1,
          likesCount: 1,
          likedBy: 1,
          commentsCount: { $size: '$comments' },
          'user._id': 1,
          'user.username': 1,
          'user.avatar': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const total = await Post.countDocuments(searchQuery);

    res.json({
      posts,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like/unlike post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likedBy.push(userId);
      post.likesCount += 1;
    }

    await post.save();

    res.json({
      likesCount: post.likesCount,
      likedBy: post.likedBy,
      liked: !isLiked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Public
exports.getLikes = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('likedBy', 'username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.likedBy);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle save/unsave post
// @route   POST /api/posts/:id/save
// @access  Private
exports.savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSaved = user.savedPosts.includes(post._id);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== post._id.toString());
    } else {
      // Save
      user.savedPosts.push(post._id);
    }

    await user.save();

    res.json({
      saved: !isSaved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's saved posts
// @route   GET /api/users/saved-posts
// @access  Private
exports.getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.aggregate([
      { $match: { _id: { $in: user.savedPosts } } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          mediaUrl: 1,
          mediaType: 1,
          category: 1,
          createdAt: 1,
          likesCount: 1,
          likedBy: 1,
          commentsCount: { $size: '$comments' },
          'user._id': 1,
          'user.username': 1,
          'user.avatar': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(posts);
  } catch (error) {
    next(error);
  }
};
