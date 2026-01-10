const axios = require('axios');

/**
 * TikTok Platform Adapter
 * Handles posting videos to TikTok via Content Posting API
 */

class TikTokAdapter {
  constructor() {
    this.apiUrl = 'https://open.tiktokapis.com/v2';
  }
  
  async publish(params) {
    const { account, content, mediaUrls = [], accessToken } = params;
    
    if (mediaUrls.length === 0) {
      throw new Error('TikTok requires video content');
    }
    
    try {
      // TikTok requires video upload - this is simplified
      // In production, upload video file first, then create post
      const response = await axios.post(
        `${this.apiUrl}/post/publish/video/init/`,
        {
          post_info: {
            title: content.substring(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_url: mediaUrls[0]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const publishId = response.data.data.publish_id;
      
      return {
        platformPostId: publishId,
        platformPostUrl: `https://tiktok.com/@${account.platformUsername}/video/${publishId}`
      };
    } catch (error) {
      throw new Error(`TikTok publish failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async fetchMetrics(postId, accessToken) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/post/publish/status/fetch/`,
        { publish_id: postId },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const status = response.data.data;
      
      return {
        impressions: status.views || 0,
        likes: status.likes || 0,
        comments: status.comments || 0,
        shares: status.shares || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch TikTok metrics: ${error.message}`);
    }
  }
}

module.exports = new TikTokAdapter();
