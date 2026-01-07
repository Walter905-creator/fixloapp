/**
 * Social Echo System
 * 
 * Generates social-ready content summaries and scheduling payloads.
 * NO AUTO-POSTING - preparation only for manual or API-based publishing.
 */

const fs = require('fs');
const path = require('path');
const { SOCIAL_ECHO } = require('./config');
const logger = require('./logger');

class SocialEcho {
  constructor() {
    this.outputDirectory = SOCIAL_ECHO.outputDirectory;
    
    // Ensure output directory exists
    if (SOCIAL_ECHO.enabled && !fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }
  }
  
  /**
   * Generate social media summary from page content
   */
  generateSocialSummary(pageContent, platform = 'twitter') {
    if (!SOCIAL_ECHO.enabled) {
      logger.debug('Social Echo is disabled');
      return null;
    }
    
    const { service, location, title, description } = pageContent;
    
    // Platform-specific character limits and formats
    const summaries = {
      twitter: this.generateTwitterSummary(service, location, title, description),
      facebook: this.generateFacebookSummary(service, location, title, description),
      linkedin: this.generateLinkedInSummary(service, location, title, description),
    };
    
    return summaries[platform] || summaries.twitter;
  }
  
  /**
   * Generate Twitter-optimized summary (280 chars)
   */
  generateTwitterSummary(service, location, title, description) {
    const templates = [
      `Looking for ${service} in ${location}? Connect with verified professionals on Fixlo. Learn more: [URL]`,
      `Quality ${service} services in ${location}. Background-checked pros ready to help. [URL]`,
      `Need ${service} in ${location}? Fixlo makes it easy to find trusted local experts. [URL]`,
      `${location} homeowners: Find reliable ${service} professionals through Fixlo's verified network. [URL]`,
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Ensure it fits Twitter's limit (leaving room for URL)
    return this.truncateToLimit(template, 250);
  }
  
  /**
   * Generate Facebook-optimized summary
   */
  generateFacebookSummary(service, location, title, description) {
    return `🏠 Home Services Spotlight: ${service} in ${location}

Looking for trusted ${service} professionals? Fixlo connects ${location} homeowners with verified, background-checked experts.

✓ All pros are licensed and vetted
✓ Transparent pricing
✓ Fast, reliable service
✓ Local professionals who care

Learn more about finding the right ${service} professional for your needs.

#HomeServices #${service.replace(/\s+/g, '')} #${location.replace(/\s+/g, '')} #HomeImprovement`;
  }
  
  /**
   * Generate LinkedIn-optimized summary
   */
  generateLinkedInSummary(service, location, title, description) {
    return `Professional Home Services: ${service} in ${location}

The home services industry continues to evolve with technology-enabled platforms making it easier for homeowners to connect with qualified professionals.

Fixlo's approach focuses on:
• Comprehensive background checks and verification
• Transparent pricing and reviews
• Streamlined booking process
• Local professional networks

This benefits both homeowners seeking reliable service and professionals looking to grow their businesses in the ${location} market.

${description}

#HomeServices #Marketplace #LocalBusiness #${service.replace(/\s+/g, '')}`;
  }
  
  /**
   * Truncate text to character limit
   */
  truncateToLimit(text, limit) {
    if (text.length <= limit) return text;
    
    return text.substring(0, limit - 3) + '...';
  }
  
  /**
   * Generate scheduling payload
   */
  generateSchedulingPayload(pageContent, platforms = SOCIAL_ECHO.platforms) {
    if (!SOCIAL_ECHO.enabled || !SOCIAL_ECHO.generatePayloads) {
      return null;
    }
    
    const payload = {
      generatedAt: new Date().toISOString(),
      pageUrl: pageContent.url,
      pageTitle: pageContent.title,
      autoPost: false, // ALWAYS false
      requiresManualApproval: true,
      platforms: {},
    };
    
    for (const platform of platforms) {
      const summary = this.generateSocialSummary(pageContent, platform);
      
      payload.platforms[platform] = {
        content: summary,
        charCount: summary ? summary.length : 0,
        tone: SOCIAL_ECHO.tone,
        suggestedTiming: this.suggestPostTiming(),
        hashtags: this.generateHashtags(pageContent, platform),
      };
    }
    
    return payload;
  }
  
  /**
   * Suggest optimal posting time
   */
  suggestPostTiming() {
    // Suggest random time during business hours (9am-5pm EST)
    const hour = 9 + Math.floor(Math.random() * 8);
    const minute = Math.floor(Math.random() * 60);
    
    return {
      hour,
      minute,
      timezone: 'America/New_York',
      note: 'Suggested time during business hours for maximum engagement',
    };
  }
  
  /**
   * Generate relevant hashtags
   */
  generateHashtags(pageContent, platform) {
    const { service, location } = pageContent;
    
    const baseHashtags = [
      '#HomeServices',
      '#HomeImprovement',
      `#${service.replace(/[\s-]+/g, '')}`,
    ];
    
    // Add location if not too long
    if (location && location.length < 15) {
      baseHashtags.push(`#${location.replace(/[\s-]+/g, '')}`);
    }
    
    // Platform-specific hashtag count
    const maxHashtags = platform === 'twitter' ? 3 : 5;
    
    return baseHashtags.slice(0, maxHashtags);
  }
  
  /**
   * Save scheduling payload to file
   */
  savePayload(payload, filename = null) {
    if (!SOCIAL_ECHO.enabled) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const payloadFilename = filename || `social-payload-${timestamp}.json`;
    const filepath = path.join(this.outputDirectory, payloadFilename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
      
      logger.info('Social payload saved', { 
        filepath,
        platforms: Object.keys(payload.platforms),
      });
      
      return filepath;
    } catch (error) {
      logger.error('Failed to save social payload', { error: error.message });
      return null;
    }
  }
  
  /**
   * Generate batch payloads for multiple pages
   */
  generateBatchPayloads(pages) {
    if (!SOCIAL_ECHO.enabled) return [];
    
    const payloads = [];
    
    for (const page of pages) {
      const payload = this.generateSchedulingPayload(page);
      if (payload) {
        payloads.push(payload);
      }
    }
    
    // Save batch to single file
    if (payloads.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const batchFilename = `social-batch-${timestamp}.json`;
      const filepath = path.join(this.outputDirectory, batchFilename);
      
      try {
        fs.writeFileSync(
          filepath,
          JSON.stringify({ 
            generatedAt: new Date().toISOString(),
            count: payloads.length,
            payloads,
          }, null, 2),
          'utf8'
        );
        
        logger.info('Social batch payloads saved', { 
          filepath,
          count: payloads.length,
        });
      } catch (error) {
        logger.error('Failed to save batch payloads', { error: error.message });
      }
    }
    
    return payloads;
  }
  
  /**
   * Validate that auto-posting is disabled
   */
  validateNoAutoPost() {
    if (SOCIAL_ECHO.autoPost === true) {
      logger.logSafetyGuardrail('auto_post_detected', 'prevented');
      throw new Error('SAFETY VIOLATION: Auto-posting is not allowed');
    }
    
    return true;
  }
  
  /**
   * Get social echo status
   */
  getStatus() {
    return {
      enabled: SOCIAL_ECHO.enabled,
      autoPost: SOCIAL_ECHO.autoPost, // Should always be false
      platforms: SOCIAL_ECHO.platforms,
      outputDirectory: this.outputDirectory,
      tone: SOCIAL_ECHO.tone,
      payloadsGenerated: this.countGeneratedPayloads(),
    };
  }
  
  /**
   * Count generated payloads
   */
  countGeneratedPayloads() {
    if (!fs.existsSync(this.outputDirectory)) return 0;
    
    try {
      const files = fs.readdirSync(this.outputDirectory);
      return files.filter(f => f.startsWith('social-payload-') || f.startsWith('social-batch-')).length;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new SocialEcho();
