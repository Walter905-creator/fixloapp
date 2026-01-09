const axios = require('axios');

/**
 * X (Twitter) Platform Adapter
 * Handles posting tweets via X API v2
 */

class XAdapter {
  constructor() {
    this.apiUrl = 'https://api.twitter.com/2';
  }
  
  async publish(params) {
    const { content, mediaUrls = [], accessToken } = params;
    
    try {
      const tweetData = { text: content };
      
      // Add media if provided (media must be uploaded first via media endpoint)
      if (mediaUrls.length > 0) {
        tweetData.media = {
          media_ids: mediaUrls // In production, these would be media IDs from upload
        };
      }
      
      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        tweetData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const tweetId = response.data.data.id;
      
      return {
        platformPostId: tweetId,
        platformPostUrl: `https://twitter.com/i/web/status/${tweetId}`
      };
    } catch (error) {
      throw new Error(`X publish failed: ${error.response?.data?.detail || error.message}`);
    }
  }
  
  async fetchMetrics(tweetId, accessToken) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const metrics = response.data.data.public_metrics;
      
      return {
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch X metrics: ${error.message}`);
    }
  }
}

module.exports = new XAdapter();
