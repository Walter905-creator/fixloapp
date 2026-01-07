/**
 * Sitemap Manager for Distribution Engine
 * 
 * Handles automatic sitemap updates, segmentation, and submission
 * to search engines.
 */

const fs = require('fs');
const path = require('path');
const { SITEMAP_CONFIG } = require('./config');
const logger = require('./logger');

class SitemapManager {
  constructor() {
    this.sitemapPath = path.join(process.cwd(), 'sitemap.xml');
    this.sitemapIndexPath = path.join(process.cwd(), 'sitemap-index.xml');
    this.generatedPages = new Map(); // URL -> metadata
  }
  
  /**
   * Add page to sitemap tracking
   */
  addPage(url, metadata = {}) {
    const pageData = {
      url,
      addedAt: new Date().toISOString(),
      lastmod: metadata.lastmod || new Date().toISOString(),
      changefreq: metadata.changefreq || SITEMAP_CONFIG.updateFrequency,
      priority: metadata.priority || SITEMAP_CONFIG.defaultPriority,
      ...metadata,
    };
    
    this.generatedPages.set(url, pageData);
    logger.debug('Page added to sitemap tracking', { url, pageData });
  }
  
  /**
   * Remove page from sitemap tracking
   */
  removePage(url) {
    if (this.generatedPages.has(url)) {
      this.generatedPages.delete(url);
      logger.debug('Page removed from sitemap tracking', { url });
      return true;
    }
    return false;
  }
  
  /**
   * Generate sitemap XML content
   */
  generateSitemapXML(urls, sitemapIndex = null) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const [url, metadata] of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url)}</loc>\n`;
      xml += `    <lastmod>${metadata.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${metadata.changefreq}</changefreq>\n`;
      xml += `    <priority>${metadata.priority}</priority>\n`;
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    
    return xml;
  }
  
  /**
   * Generate sitemap index XML
   */
  generateSitemapIndexXML(sitemaps) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const sitemap of sitemaps) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${this.escapeXml(sitemap.loc)}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
    
    xml += '</sitemapindex>';
    
    return xml;
  }
  
  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  /**
   * Segment pages into multiple sitemaps if needed
   */
  segmentSitemap() {
    const pages = Array.from(this.generatedPages.entries());
    const maxUrls = SITEMAP_CONFIG.maxUrlsPerSitemap;
    
    if (pages.length <= maxUrls) {
      return [{ index: 0, pages }];
    }
    
    const segments = [];
    for (let i = 0; i < pages.length; i += maxUrls) {
      segments.push({
        index: Math.floor(i / maxUrls),
        pages: pages.slice(i, i + maxUrls),
      });
    }
    
    logger.info('Sitemap segmented', { 
      totalPages: pages.length,
      segments: segments.length,
    });
    
    return segments;
  }
  
  /**
   * Update sitemap files
   */
  async updateSitemap() {
    try {
      const segments = this.segmentSitemap();
      
      if (segments.length === 1) {
        // Single sitemap
        const xml = this.generateSitemapXML(segments[0].pages);
        fs.writeFileSync(this.sitemapPath, xml, 'utf8');
        
        logger.info('Sitemap updated', { 
          path: this.sitemapPath,
          urlCount: segments[0].pages.length,
        });
        
        logger.logSitemapUpdate({
          type: 'single',
          urlCount: segments[0].pages.length,
        });
      } else {
        // Multiple sitemaps with index
        const sitemaps = [];
        
        for (const segment of segments) {
          const filename = `sitemap-${segment.index}.xml`;
          const filepath = path.join(process.cwd(), filename);
          const xml = this.generateSitemapXML(segment.pages);
          
          fs.writeFileSync(filepath, xml, 'utf8');
          
          sitemaps.push({
            loc: `https://www.fixloapp.com/${filename}`,
            lastmod: new Date().toISOString(),
          });
        }
        
        // Create sitemap index
        const indexXml = this.generateSitemapIndexXML(sitemaps);
        fs.writeFileSync(this.sitemapIndexPath, indexXml, 'utf8');
        
        logger.info('Sitemap index updated', { 
          path: this.sitemapIndexPath,
          sitemapCount: sitemaps.length,
          totalUrls: this.generatedPages.size,
        });
        
        logger.logSitemapUpdate({
          type: 'segmented',
          sitemapCount: sitemaps.length,
          totalUrls: this.generatedPages.size,
        });
      }
      
      // Submit to search engines if enabled
      if (SITEMAP_CONFIG.autoSubmit) {
        await this.submitToSearchEngines();
      }
      
      return true;
    } catch (error) {
      logger.error('Sitemap update failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Submit sitemap to search engines
   */
  async submitToSearchEngines() {
    const sitemapUrl = `https://www.fixloapp.com/sitemap.xml`;
    
    // Google
    await this.pingSearchEngine('google', `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    
    // Bing
    await this.pingSearchEngine('bing', `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    
    logger.info('Sitemap submitted to search engines', { sitemapUrl });
  }
  
  /**
   * Ping individual search engine
   */
  async pingSearchEngine(engine, url) {
    try {
      // Use axios for Node.js compatibility
      const axios = require('axios');
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.status === 200) {
        logger.info(`Sitemap ping successful: ${engine}`, { url });
      } else {
        logger.warn(`Sitemap ping failed: ${engine}`, { 
          url,
          status: response.status,
        });
      }
    } catch (error) {
      logger.error(`Sitemap ping error: ${engine}`, { 
        url,
        error: error.message,
      });
    }
  }
  
  /**
   * Load existing sitemap for merging
   */
  loadExistingSitemap() {
    try {
      if (fs.existsSync(this.sitemapPath)) {
        const content = fs.readFileSync(this.sitemapPath, 'utf8');
        
        // Simple XML parsing for URLs
        const urlMatches = content.matchAll(/<loc>(.*?)<\/loc>/g);
        const existingUrls = [];
        
        for (const match of urlMatches) {
          existingUrls.push(match[1]);
        }
        
        logger.info('Existing sitemap loaded', { 
          urlCount: existingUrls.length,
        });
        
        return existingUrls;
      }
    } catch (error) {
      logger.error('Failed to load existing sitemap', { error: error.message });
    }
    
    return [];
  }
  
  /**
   * Merge with existing sitemap
   */
  mergeWithExisting() {
    const existingUrls = this.loadExistingSitemap();
    
    for (const url of existingUrls) {
      if (!this.generatedPages.has(url)) {
        // Add existing URL to tracking
        this.addPage(url, {
          lastmod: new Date().toISOString(),
          priority: 0.5,
        });
      }
    }
    
    logger.info('Sitemaps merged', {
      existingCount: existingUrls.length,
      totalCount: this.generatedPages.size,
    });
  }
  
  /**
   * Get sitemap statistics
   */
  getStats() {
    return {
      totalPages: this.generatedPages.size,
      needsSegmentation: this.generatedPages.size > SITEMAP_CONFIG.maxUrlsPerSitemap,
      estimatedSegments: Math.ceil(this.generatedPages.size / SITEMAP_CONFIG.maxUrlsPerSitemap),
    };
  }
}

module.exports = new SitemapManager();
