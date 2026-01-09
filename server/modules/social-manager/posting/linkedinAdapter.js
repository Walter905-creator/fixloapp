const axios = require('axios');

/**
 * LinkedIn Platform Adapter
 * Handles posting to LinkedIn Company Pages via LinkedIn API
 */

class LinkedInAdapter {
  constructor() {
    this.apiUrl = 'https://api.linkedin.com/v2';
  }
  
  async publish(params) {
    const { account, content, mediaUrls = [], accessToken } = params;
    
    const organizationId = account.platformAccountId;
    
    try {
      const postData = {
        author: `urn:li:organization:${organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: mediaUrls.length > 0 ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      
      // Add media if provided (simplified - needs proper media upload)
      if (mediaUrls.length > 0) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaUrls.map(url => ({
          status: 'READY',
          description: {
            text: 'Image'
          },
          media: url,
          title: {
            text: 'Image'
          }
        }));
      }
      
      const response = await axios.post(
        `${this.apiUrl}/ugcPosts`,
        postData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      
      const postId = response.data.id;
      const postUrn = postId.split(':').pop();
      
      return {
        platformPostId: postId,
        platformPostUrl: `https://linkedin.com/feed/update/${postUrn}`
      };
    } catch (error) {
      throw new Error(`LinkedIn publish failed: ${error.response?.data?.message || error.message}`);
    }
  }
  
  async fetchMetrics(postId, accessToken) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/organizationalEntityShareStatistics`,
        {
          params: {
            q: 'organizationalEntity',
            organizationalEntity: postId
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      
      const stats = response.data.elements[0];
      
      return {
        impressions: stats.totalShareStatistics?.impressionCount || 0,
        likes: stats.totalShareStatistics?.likeCount || 0,
        comments: stats.totalShareStatistics?.commentCount || 0,
        shares: stats.totalShareStatistics?.shareCount || 0,
        clicks: stats.totalShareStatistics?.clickCount || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn metrics: ${error.message}`);
    }
  }
}

module.exports = new LinkedInAdapter();
