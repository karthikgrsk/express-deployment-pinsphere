const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Post description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  category: {
    type: String,
    default: 'All',
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must be linked to a user']
  },
  likesCount: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index title and description for search
postSchema.index({ title: 'text', description: 'text', category: 'text' });
// Index likedBy for faster search of posts liked by a user
postSchema.index({ likedBy: 1 });

module.exports = mongoose.model('Post', postSchema);
