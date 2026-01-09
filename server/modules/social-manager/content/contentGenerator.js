const axios = require('axios');

/**
 * AI Content Generator for Social Media
 * Uses OpenAI to generate brand-safe, Fixlo-aligned content
 * 
 * BRAND VOICE:
 * - Premium and trustworthy (not cartoonish or overly casual)
 * - Professional yet approachable
 * - Solution-focused and empowering
 * - Emphasizes quality, reliability, and verified pros
 */

class ContentGenerator {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.SOCIAL_AI_MODEL || 'gpt-4';
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Fixlo brand guidelines
    this.brandVoice = {
      tone: 'professional, trustworthy, solution-oriented',
      avoid: ['cartoonish language', 'excessive emojis', 'salesy language', 'guarantees'],
      emphasize: ['quality', 'trust', 'verification', 'expertise', 'peace of mind']
    };
  }
  
  isConfigured() {
    return !!this.apiKey;
  }
  
  /**
   * Generate social media post content
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} - Generated content and metadata
   */
  async generatePost(params) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }
    
    const {
      platform,
      contentType = 'general', // general, service-specific, seasonal, testimonial
      service = null, // e.g., 'plumbing', 'electrical'
      city = null, // e.g., 'New York'
      season = null, // e.g., 'winter', 'summer'
      trend = null, // e.g., 'home renovation tips'
      maxLength = null, // platform-specific character limits
      includeHashtags = true,
      includeCallToAction = true
    } = params;
    
    // Build prompt based on parameters
    const prompt = this.buildPrompt({
      platform,
      contentType,
      service,
      city,
      season,
      trend,
      maxLength,
      includeHashtags,
      includeCallToAction
    });
    
    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const generatedContent = response.data.choices[0].message.content.trim();
      
      return {
        content: generatedContent,
        metadata: {
          model: this.model,
          prompt,
          contentType,
          service,
          city,
          season,
          trend,
          platform,
          generatedAt: new Date(),
          tokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`Content generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Get system prompt defining Fixlo brand voice
   */
  getSystemPrompt() {
    return `You are a professional social media content creator for Fixlo, a premium home services marketplace connecting homeowners with verified, trusted professionals.

BRAND VOICE:
- Professional, trustworthy, and solution-oriented
- Premium quality without being pretentious
- Approachable yet expert
- Emphasize peace of mind, reliability, and verified expertise

TONE GUIDELINES:
- ✓ DO: Use clear, confident language
- ✓ DO: Focus on solving problems and adding value
- ✓ DO: Emphasize quality and verification
- ✓ DO: Be helpful and informative
- ✗ DON'T: Use cartoonish or overly casual language
- ✗ DON'T: Make unrealistic guarantees
- ✗ DON'T: Use excessive emojis (max 1-2 per post)
- ✗ DON'T: Be pushy or salesy

CONTENT FOCUS:
- Helping homeowners find trusted professionals
- Showcasing verified pro expertise
- Home maintenance tips and seasonal advice
- Building trust in the platform
- Celebrating successful projects

Generate content that reflects these values and resonates with both homeowners seeking help and professionals looking to grow their business.`;
  }
  
  /**
   * Build content generation prompt
   */
  buildPrompt(params) {
    const {
      platform,
      contentType,
      service,
      city,
      season,
      trend,
      maxLength,
      includeHashtags,
      includeCallToAction
    } = params;
    
    let prompt = `Create a ${platform} post for Fixlo`;
    
    // Add content type context
    if (contentType === 'service-specific' && service) {
      prompt += ` about ${service} services`;
    } else if (contentType === 'seasonal' && season) {
      prompt += ` with ${season} home maintenance tips`;
    } else if (contentType === 'testimonial') {
      prompt += ` celebrating a successful project`;
    } else if (trend) {
      prompt += ` related to ${trend}`;
    }
    
    // Add location context
    if (city) {
      prompt += ` for homeowners in ${city}`;
    }
    
    prompt += '.';
    
    // Platform-specific requirements
    const platformSpecs = this.getPlatformSpecs(platform);
    if (maxLength || platformSpecs.maxLength) {
      const limit = maxLength || platformSpecs.maxLength;
      prompt += ` Keep it under ${limit} characters.`;
    }
    
    // Hashtags
    if (includeHashtags) {
      prompt += ` Include ${platformSpecs.hashtagCount} relevant, professional hashtags.`;
    }
    
    // Call to action
    if (includeCallToAction) {
      prompt += ` End with a subtle call-to-action that encourages engagement or platform use.`;
    }
    
    // Format requirements
    prompt += ` Format: ${platformSpecs.format}`;
    
    return prompt;
  }
  
  /**
   * Get platform-specific specifications
   */
  getPlatformSpecs(platform) {
    const specs = {
      meta_instagram: {
        maxLength: 2200,
        hashtagCount: '5-8',
        format: 'Caption with line breaks for readability, hashtags at the end'
      },
      meta_facebook: {
        maxLength: 63206,
        hashtagCount: '3-5',
        format: 'Engaging caption with natural paragraph breaks'
      },
      tiktok: {
        maxLength: 2200,
        hashtagCount: '4-6',
        format: 'Short, punchy caption optimized for video content'
      },
      x: {
        maxLength: 280,
        hashtagCount: '2-3',
        format: 'Concise, impactful message within character limit'
      },
      linkedin: {
        maxLength: 3000,
        hashtagCount: '3-5',
        format: 'Professional post with clear value proposition and business focus'
      }
    };
    
    return specs[platform] || specs.meta_instagram;
  }
  
  /**
   * Generate batch of posts for scheduling
   * @param {Object} params - Batch generation parameters
   * @returns {Promise<Array>} - Array of generated posts
   */
  async generateBatch(params) {
    const {
      count = 5,
      platforms = ['meta_instagram'],
      contentTypes = ['general', 'service-specific', 'seasonal'],
      services = ['plumbing', 'electrical', 'hvac', 'landscaping'],
      city = null
    } = params;
    
    const posts = [];
    
    for (let i = 0; i < count; i++) {
      // Rotate through content types and services
      const contentType = contentTypes[i % contentTypes.length];
      const service = contentType === 'service-specific' 
        ? services[i % services.length] 
        : null;
      const platform = platforms[i % platforms.length];
      
      try {
        const generated = await this.generatePost({
          platform,
          contentType,
          service,
          city,
          season: this.getCurrentSeason(),
          includeHashtags: true,
          includeCallToAction: true
        });
        
        posts.push({
          ...generated,
          platform,
          contentType,
          service
        });
        
        // Rate limit: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate post ${i + 1}:`, error.message);
      }
    }
    
    return posts;
  }
  
  /**
   * Get current season for seasonal content
   */
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
  
  /**
   * Validate generated content for brand safety
   * @param {string} content - Content to validate
   * @returns {Object} - Validation result
   */
  validateContent(content) {
    const issues = [];
    
    // Check for prohibited terms
    const prohibited = ['guaranteed', '100%', 'cheapest', 'free money', 'get rich'];
    prohibited.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        issues.push(`Contains prohibited term: "${term}"`);
      }
    });
    
    // Check emoji count
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 3) {
      issues.push(`Too many emojis (${emojiCount}). Max recommended: 2`);
    }
    
    // Check for excessive punctuation
    if ((content.match(/!{2,}/g) || []).length > 0) {
      issues.push('Contains excessive exclamation marks');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = new ContentGenerator();
