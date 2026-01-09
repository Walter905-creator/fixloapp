const axios = require('axios');
const { tokenEncryption } = require('../security');

/**
 * Meta Platform Adapter (Instagram + Facebook)
 * Handles posting to Instagram and Facebook via Graph API
 */

class MetaAdapter {
  constructor() {
    this.graphApiUrl = 'https://graph.facebook.com/v18.0';
  }
  
  /**
   * Publish post to Instagram
   * @param {Object} params - Post parameters
   * @returns {Promise<Object>} - Published post data
   */
  async publishInstagram(params) {
    const { account, content, mediaUrls = [], accessToken } = params;
    
    const igAccountId = account.platformAccountId;
    
    try {
      if (mediaUrls.length === 0) {
        // Text-only posts not supported on Instagram
        throw new Error('Instagram requires at least one image or video');
      }
      
      if (mediaUrls.length === 1) {
        // Single media post
        return await this.publishInstagramSingleMedia({
          igAccountId,
          accessToken,
          imageUrl: mediaUrls[0],
          caption: content
        });
      } else {
        // Carousel post
        return await this.publishInstagramCarousel({
          igAccountId,
          accessToken,
          mediaUrls,
          caption: content
        });
      }
    } catch (error) {
      throw new Error(`Instagram publish failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async publishInstagramSingleMedia(params) {
    const { igAccountId, accessToken, imageUrl, caption } = params;
    
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${this.graphApiUrl}/${igAccountId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: accessToken
      }
    );
    
    const containerId = containerResponse.data.id;
    
    // Step 2: Publish container
    const publishResponse = await axios.post(
      `${this.graphApiUrl}/${igAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken
      }
    );
    
    const postId = publishResponse.data.id;
    
    return {
      platformPostId: postId,
      platformPostUrl: `https://instagram.com/p/${this.getInstagramShortcode(postId)}`
    };
  }
  
  async publishInstagramCarousel(params) {
    const { igAccountId, accessToken, mediaUrls, caption } = params;
    
    // Step 1: Create media containers for each item
    const containerIds = [];
    for (const mediaUrl of mediaUrls) {
      const response = await axios.post(
        `${this.graphApiUrl}/${igAccountId}/media`,
        {
          image_url: mediaUrl,
          is_carousel_item: true,
          access_token: accessToken
        }
      );
      containerIds.push(response.data.id);
    }
    
    // Step 2: Create carousel container
    const carouselResponse = await axios.post(
      `${this.graphApiUrl}/${igAccountId}/media`,
      {
        media_type: 'CAROUSEL',
        children: containerIds.join(','),
        caption,
        access_token: accessToken
      }
    );
    
    const carouselId = carouselResponse.data.id;
    
    // Step 3: Publish carousel
    const publishResponse = await axios.post(
      `${this.graphApiUrl}/${igAccountId}/media_publish`,
      {
        creation_id: carouselId,
        access_token: accessToken
      }
    );
    
    const postId = publishResponse.data.id;
    
    return {
      platformPostId: postId,
      platformPostUrl: `https://instagram.com/p/${this.getInstagramShortcode(postId)}`
    };
  }
  
  /**
   * Publish post to Facebook Page
   * @param {Object} params - Post parameters
   * @returns {Promise<Object>} - Published post data
   */
  async publishFacebook(params) {
    const { account, content, mediaUrls = [], accessToken } = params;
    
    const pageId = account.platformSettings?.pageId || account.platformAccountId;
    
    try {
      const postData = {
        message: content,
        access_token: accessToken
      };
      
      if (mediaUrls.length > 0) {
        // Facebook supports multiple images/videos
        postData.attached_media = mediaUrls.map((url, index) => ({
          media_fbid: url, // In production, upload media first and use returned ID
          alt_text: `Image ${index + 1}`
        }));
      }
      
      const response = await axios.post(
        `${this.graphApiUrl}/${pageId}/feed`,
        postData
      );
      
      const postId = response.data.id;
      
      return {
        platformPostId: postId,
        platformPostUrl: `https://facebook.com/${postId}`
      };
    } catch (error) {
      throw new Error(`Facebook publish failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Get Instagram shortcode from post ID (for URL)
   */
  getInstagramShortcode(postId) {
    // This is a simplified version - in production, fetch the post to get permalink
    return postId;
  }
  
  /**
   * Fetch post metrics from Instagram
   * @param {string} postId - Instagram post ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - Post metrics
   */
  async fetchInstagramMetrics(postId, accessToken) {
    try {
      const response = await axios.get(
        `${this.graphApiUrl}/${postId}/insights`,
        {
          params: {
            metric: 'impressions,reach,likes,comments,saved,shares',
            access_token: accessToken
          }
        }
      );
      
      const metrics = {};
      response.data.data.forEach(metric => {
        metrics[metric.name] = metric.values[0]?.value || 0;
      });
      
      return {
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        saves: metrics.saved || 0,
        shares: metrics.shares || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch Instagram metrics: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Fetch post metrics from Facebook
   * @param {string} postId - Facebook post ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - Post metrics
   */
  async fetchFacebookMetrics(postId, accessToken) {
    try {
      const response = await axios.get(
        `${this.graphApiUrl}/${postId}`,
        {
          params: {
            fields: 'insights.metric(post_impressions,post_impressions_unique,post_engaged_users,post_clicks)',
            access_token: accessToken
          }
        }
      );
      
      const insights = response.data.insights?.data || [];
      const metrics = {};
      
      insights.forEach(metric => {
        metrics[metric.name] = metric.values[0]?.value || 0;
      });
      
      return {
        impressions: metrics.post_impressions || 0,
        reach: metrics.post_impressions_unique || 0,
        likes: 0, // Fetch separately if needed
        comments: 0,
        shares: 0,
        clicks: metrics.post_clicks || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch Facebook metrics: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new MetaAdapter();
