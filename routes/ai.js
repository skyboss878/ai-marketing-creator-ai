const express = require('express');  
const router = express.Router();  
const AIService = require('../services/aiService');  
const Video = require('../models/Video');  
const User = require('../models/User');  
const { protect } = require('../middleware/auth');  
const { body, validationResult } = require('express-validator');  
  
// Generate video  
router.post('/generate-video', protect, [  
  body('prompt').isLength({ min: 10, max: 500 }).withMessage('Prompt must be between 10-500 characters'),  
  body('type').isIn(['commercial', 'social', 'tour', 'product']).withMessage('Invalid video type'),  
  body('title').isLength({ min: 3, max: 100 }).withMessage('Title must be between 3-100 characters')  
], async (req, res) => {  
  try {  
    // Check validation errors  
    const errors = validationResult(req);  
    if (!errors.isEmpty()) {  
      return res.status(400).json({  
        success: false,  
        message: 'Validation errors',  
        errors: errors.array()  
      });  
    }  
  
    const { prompt, type, title, settings = {} } = req.body;  
      
    // Check user's video limit  
    const user = await User.findById(req.user.id);  
    if (user.subscription.videosUsed >= user.subscription.videoLimit) {  
      return res.status(403).json({  
        success: false,  
        message: 'Video generation limit reached. Please upgrade your plan.'  
      });  
    }  
  
    // Create video record  
    const video = await Video.create({  
      user: req.user.id,  
      title,  
      prompt,  
      type,  
      status: 'processing',  
      settings,  
      resolution: user.subscription.type === 'free' ? '720p' : '1080p'  
    });  
  
    // Start video generation process (async)  
    generateVideoAsync(video._id, prompt, type, settings, user.subscription.type);  
  
    // Update user's video count  
    await User.findByIdAndUpdate(req.user.id, {  
      $inc: { 'subscription.videosUsed': 1 }  
    });  
  
    res.json({  
      success: true,  
      message: 'Video generation started',  
      data: {  
        videoId: video._id,  
        status: 'processing'  
      }  
    });  
  } catch (error) {  
    console.error('Video generation error:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Failed to start video generation'  
    });  
  }  
});  
  
// Get video status  
router.get('/videos/:id/status', protect, async (req, res) => {  
  try {  
    const video = await Video.findOne({  
      _id: req.params.id,  
      user: req.user.id  
    });  
  
    if (!video) {  
      return res.status(404).json({  
        success: false,  
        message: 'Video not found'  
      });  
    }  
  
    res.json({  
      success: true,  
      data: video  
    });  
  } catch (error) {  
    console.error('Get video status error:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Failed to get video status'  
    });  
  }  
});  
  
// Generate script only  
router.post('/generate-script', protect, [  
  body('prompt').isLength({ min: 10, max: 500 }).withMessage('Prompt must be between 10-500 characters'),  
  body('type').isIn(['commercial', 'social', 'tour', 'product']).withMessage('Invalid video type')  
], async (req, res) => {  
  try {  
    const errors = validationResult(req);  
    if (!errors.isEmpty()) {  
      return res.status(400).json({  
        success: false,  
        message: 'Validation errors',  
        errors: errors.array()  
      });  
    }  
  
    const { prompt, type } = req.body;  
      
    const script = await AIService.generateVideoScript(prompt, type);  
      
    res.json({  
      success: true,  
      data: { script }  
    });  
  } catch (error) {  
    console.error('Script generation error:', error);  
    res.status(500).json({  
      success: false,  
      message: 'Failed to generate script'  
    });  
  }  
});  
  
// Async video generation function  
async function generateVideoAsync(videoId, prompt, type, settings, subscriptionType) {  
  try {  
    // Update status to processing  
    await Video.findByIdAndUpdate(videoId, {  
      status: 'processing'  
    });  
  
    // Generate script  
    const script = await AIService.generateVideoScript(prompt, type);  
      
    // Generate video  
    const videoData = await AIService.generateVideo(script, type, {  
      ...settings,  
      resolution: subscriptionType === 'free' ? '720p' : '1080p'  
    });  
  
    // Update video with results  
    await Video.findByIdAndUpdate(videoId, {  
      status: 'completed',  
      videoUrl: videoData.videoUrl,  
      thumbnailUrl: videoData.thumbnailUrl,  
      duration: videoData.duration,  
      resolution: videoData.resolution,  
      'metadata.fileSize': videoData.fileSize || 0,  
      'metadata.format': videoData.format || 'mp4'  
    });  
  
  } catch (error) {  
    console.error('Async video generation error:', error);  
      
    // Update video status to failed  
    await Video.findByIdAndUpdate(videoId, {  
      status: 'failed'  
    });  
  }  
}  
  
module.exports = router;
