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
    this.credentialsChecked = false;
  }

  /**
   * Initialize Google Search Console API client
   */
  async initialize() {
    try {
      // Resolve credentials: support JSON service account key or individual env vars
      let clientEmail = process.env.GSC_CLIENT_EMAIL;
      let privateKey = process.env.GSC_PRIVATE_KEY;

      if (process.env.GSC_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_KEY);
          if (!serviceAccount.client_email || !serviceAccount.private_key) {
            console.error('❌ GSC_SERVICE_ACCOUNT_KEY is missing required fields: client_email and/or private_key');
          } else {
            clientEmail = clientEmail || serviceAccount.client_email;
            privateKey = privateKey || serviceAccount.private_key;
          }
        } catch (parseError) {
          console.error('❌ Failed to parse GSC_SERVICE_ACCOUNT_KEY as JSON. Ensure it contains a valid service account key with client_email and private_key fields:', parseError.message);
        }
      }

      // Check if credentials are available
      if (!clientEmail || !privateKey) {
        // Log once at startup only
        if (!this.credentialsChecked) {
          console.log('ℹ️ GSC integration disabled (credentials not configured)');
          this.credentialsChecked = true;
        }
        return false;
      }

      // Create JWT auth client
      this.auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, '\n'),
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
        // Return gracefully without throwing
        return {
          pages: 0,
          queries: 0,
          errors: [],
          skipped: true,
          reason: 'GSC credentials not configured'
        };
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
   * Note: This uses the Indexing API (not Search Console API)
   * Requires separate setup: https://developers.google.com/search/apis/indexing-api/v3/quickstart
   */
  async submitUrlForIndexing(url) {
    // Indexing API requires separate service account setup
    // For now, we'll log and skip actual submission
    // TODO: Implement proper Indexing API integration
    console.log(`📝 URL ready for indexing: ${url}`);
    console.log('⚠️ Note: Indexing API requires separate setup from Search Console API');
    
    return {
      url,
      message: 'URL logged for manual submission',
      status: 'pending'
    };
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
