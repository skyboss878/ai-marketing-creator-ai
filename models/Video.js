const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a video title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['commercial', 'social', 'tour', 'product'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  videoUrl: String,
  thumbnailUrl: String,
  duration: Number,
  resolution: {
    type: String,
    enum: ['720p', '1080p', '4k'],
    default: '720p'
  },
  settings: {
    music: String,
    voiceover: Boolean,
    style: String,
    format: String
  },
  metadata: {
    fileSize: Number,
    format: String,
    codec: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema);
