const { google } = require('googleapis');
const GSCPageDaily = require('../../models/GSCPageDaily');
const GSCQueryDaily = require('../../models/GSCQueryDaily');

/**
 * Google Search Console API Client
 * Handles authentication and data fetching from GSC
 */
class GSCClient {
  constructor() {
    this.auth = null;
    this.searchConsole = null;
    this.siteUrl = process.env.GSC_SITE_URL || 'sc-domain:fixloapp.com';
  }

  /**
   * Initialize Google Search Console API client
   */
  async initialize() {
    try {
      // Check if credentials are available
      if (!process.env.GSC_CLIENT_EMAIL || !process.env.GSC_PRIVATE_KEY) {
        console.warn('⚠️ GSC credentials not found. Set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY');
        return false;
      }

      // Create JWT auth client
      this.auth = new google.auth.JWT({
        email: process.env.GSC_CLIENT_EMAIL,
        key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
      });

      // Authorize
      await this.auth.authorize();

      // Initialize Search Console client
      this.searchConsole = google.searchconsole({
        version: 'v1',
        auth: this.auth
      });

      console.log('✅ Google Search Console API initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize GSC API:', error.message);
      return false;
    }
  }

  /**
   * Check if GSC is properly configured
   */
  isConfigured() {
    return this.auth !== null && this.searchConsole !== null;
  }

  /**
   * Fetch page performance data for a date range
   */
  async fetchPageData(startDate, endDate, dimensions = ['page']) {
    if (!this.isConfigured()) {
      throw new Error('GSC client not initialized');
    }

    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          dimensions: dimensions,
          rowLimit: 25000, // Maximum allowed by API
          startRow: 0
        }
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('❌ Failed to fetch GSC page data:', error.message);
      throw error;
    }
  }

  /**
   * Fetch query performance data for a date range
   */
  async fetchQueryData(startDate, endDate, dimensions = ['query', 'page']) {
    if (!this.isConfigured()) {
      throw new Error('GSC client not initialized');
    }

    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          dimensions: dimensions,
          rowLimit: 25000,
          startRow: 0
        }
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('❌ Failed to fetch GSC query data:', error.message);
      throw error;
    }
  }

  /**
   * Store page performance data in database
   */
  async storeDailyPageData(date) {
    const rows = await this.fetchPageData(date, date, ['page']);
    
    const bulkOps = rows.map(row => ({
      updateOne: {
        filter: {
          page: row.keys[0],
          date: new Date(date)
        },
        update: {
          $set: {
            page: row.keys[0],
            date: new Date(date),
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
            fetchedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await GSCPageDaily.bulkWrite(bulkOps);
      console.log(`✅ Stored ${bulkOps.length} page performance records for ${date}`);
    }

    return bulkOps.length;
  }

  /**
   * Store query performance data in database
   */
  async storeDailyQueryData(date) {
    const rows = await this.fetchQueryData(date, date, ['query', 'page']);
    
    const bulkOps = rows.map(row => ({
      updateOne: {
        filter: {
          query: row.keys[0],
          page: row.keys[1],
          date: new Date(date)
        },
        update: {
          $set: {
            query: row.keys[0],
            page: row.keys[1],
            date: new Date(date),
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
            fetchedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await GSCQueryDaily.bulkWrite(bulkOps);
      console.log(`✅ Stored ${bulkOps.length} query performance records for ${date}`);
    }

    return bulkOps.length;
  }

  /**
   * Fetch and store data for the last N days
   */
  async syncLastNDays(days = 7) {
    if (!this.isConfigured()) {
      await this.initialize();
      if (!this.isConfigured()) {
        throw new Error('GSC client could not be initialized');
      }
    }

    const results = {
      pages: 0,
      queries: 0,
      errors: []
    };

    // GSC data has a 2-3 day delay, so start from 3 days ago
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);

    for (let i = 0; i < days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);

      try {
        const pageCount = await this.storeDailyPageData(dateStr);
        results.pages += pageCount;

        const queryCount = await this.storeDailyQueryData(dateStr);
        results.queries += queryCount;

        console.log(`✅ Synced data for ${dateStr}`);
      } catch (error) {
        console.error(`❌ Failed to sync data for ${dateStr}:`, error.message);
        results.errors.push({ date: dateStr, error: error.message });
      }
    }

    return results;
  }

  /**
   * Submit URL for indexing
   */
  async submitUrlForIndexing(url) {
    if (!this.isConfigured()) {
      throw new Error('GSC client not initialized');
    }

    try {
      // Use URL Inspection API to request indexing
      const response = await this.searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: this.siteUrl
        }
      });

      console.log(`✅ Submitted ${url} for indexing`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to submit ${url} for indexing:`, error.message);
      throw error;
    }
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Singleton instance
let gscClientInstance = null;

function getGSCClient() {
  if (!gscClientInstance) {
    gscClientInstance = new GSCClient();
  }
  return gscClientInstance;
}

module.exports = {
  GSCClient,
  getGSCClient
};
