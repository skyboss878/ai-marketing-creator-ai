const axios = require('axios');
const FormData = require('form-data');

class AIService {
  constructor() {
    this.puterApiKey = process.env.PUTER_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.puter.com/v1'; // Puter API endpoint
  }

  // Generate video script using OpenAI via Puter
  async generateVideoScript(prompt, videoType) {
    try {
      const systemPrompt = this.getSystemPrompt(videoType);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.puterApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating script:', error);
      throw new Error('Failed to generate video script');
    }
  }

  // Generate video using AI (simulated - you'd integrate with actual video AI service)
  async generateVideo(script, videoType, settings = {}) {
    try {
      // This would integrate with services like Runway ML, Synthesia, or similar
      // For now, we'll simulate the process
      
      const videoPrompt = this.createVideoPrompt(script, videoType, settings);
      
      // Simulate video generation delay
      await this.delay(5000);
      
      // Return mock video data
      return {
        videoUrl: 'https://example.com/generated-video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        duration: 30,
        resolution: settings.resolution || '1080p'
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error('Failed to generate video');
    }
  }

  // Generate image for product showcases
  async generateImage(prompt, style = 'realistic') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: 'dall-e-3',
          prompt: `${prompt}, ${style} style, high quality, professional photography`,
          size: '1024x1024',
          quality: 'hd',
          n: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.puterApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].url;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Generate voiceover text-to-speech
  async generateVoiceover(text, voice = 'alloy') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/audio/speech`,
        {
          model: 'tts-1',
          input: text,
          voice: voice,
          response_format: 'mp3'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.puterApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error generating voiceover:', error);
      throw new Error('Failed to generate voiceover');
    }
  }

  getSystemPrompt(videoType) {
    const prompts = {
      commercial: `You are a professional commercial scriptwriter. Create engaging 30-60 second TV commercial scripts that:
        - Hook viewers in the first 3 seconds
        - Clearly present the value proposition
        - Include a strong call-to-action
        - Are suitable for TV/digital advertising
        - Match the brand voice and target audience`,
      
      social: `You are a viral social media content creator. Create short, engaging scripts for TikTok/Instagram Reels that:
        - Start with a hook that stops scrolling
        - Include trending elements and hashtags
        - Are 15-30 seconds long
        - Encourage engagement and shares
        - Match current social media trends`,
      
      tour: `You are a real estate/business tour guide scriptwriter. Create immersive walkthrough scripts that:
        - Highlight key features and benefits
        - Create emotional connection with viewers
        - Guide viewers through the space logically
        - Include compelling calls-to-action
        - Work well with 360° video format`,
      
      product: `You are a product marketing specialist. Create compelling product showcase scripts that:
        - Highlight unique features and benefits
        - Address customer pain points
        - Include social proof when relevant
        - Create desire and urgency
        - End with clear purchase incentives`
    };

    return prompts[videoType] || prompts.commercial;
  }

  createVideoPrompt(script, videoType, settings) {
    const basePrompt = `Create a professional ${videoType} video based on this script: "${script}"`;
    
    const stylePrompts = {
      commercial: 'Cinematic lighting, professional actors, high-end production value',
      social: 'Trendy, energetic, mobile-first format, vibrant colors',
      tour: 'Smooth camera movements, architectural beauty, welcoming atmosphere',
      product: 'Clean background, perfect lighting, focus on product details'
    };

    return `${basePrompt}. Style: ${stylePrompts[videoType]}. ${settings.style || ''}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AIService();
