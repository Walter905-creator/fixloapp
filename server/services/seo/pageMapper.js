const SEOPageMapping = require('../../models/SEOPageMapping');
const { FIXLO_SERVICES } = require('../../config/seoAgentConstants');

/**
 * Page Mapper Service
 * Crawls existing Fixlo routes and maps service + city combinations
 */
class PageMapper {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'https://www.fixloapp.com';
  }

  /**
   * Map all existing pages to database
   * This should be called periodically to keep mapping up-to-date
   */
  async mapExistingPages() {
    console.log('📍 Mapping existing Fixlo pages...');

    const mappings = [];

    // Map service pages (e.g., /services/plumbing)
    for (const service of FIXLO_SERVICES) {
      const url = `${this.baseUrl}/services/${service}`;
      mappings.push({
        service,
        city: 'all', // National page
        country: 'us',
        url,
        status: 'ACTIVE',
        isGenerated: false
      });
    }

    // Store mappings in database
    for (const mapping of mappings) {
      await SEOPageMapping.findOneAndUpdate(
        { url: mapping.url },
        mapping,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Mapped ${mappings.length} existing pages`);
    return mappings;
  }

  /**
   * Detect missing service + city combinations
   * These are opportunities for new page creation
   */
  async findMissingCombinations(cities) {
    const missing = await SEOPageMapping.findMissingCombinations(
      FIXLO_SERVICES,
      cities
    );

    console.log(`🔍 Found ${missing.length} missing service/city combinations`);
    return missing;
  }

  /**
   * Generate canonical URL for service + city combination
   */
  generateCanonicalUrl(service, city, state = null) {
    // Format: /services/plumbing/miami-fl
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = state ? `-${state.toLowerCase()}` : '';
    return `${this.baseUrl}/services/${service}/${citySlug}${stateSlug}`;
  }

  /**
   * Create page mapping for a new service + city combination
   */
  async createPageMapping(service, city, state = null, country = 'us') {
    const url = this.generateCanonicalUrl(service, city, state);

    const mapping = await SEOPageMapping.create({
      service,
      city,
      state,
      country,
      url,
      status: 'CREATED',
      isGenerated: true,
      indexedAt: new Date()
    });

    console.log(`✅ Created page mapping: ${url}`);
    return mapping;
  }

  /**
   * Parse URL to extract service and city
   */
  parseUrl(url) {
    // Example: https://www.fixloapp.com/services/plumbing/miami-fl
    const match = url.match(/\/services\/([^/]+)\/([^/]+)/);
    
    if (!match) {
      return null;
    }

    const service = match[1];
    const locationPart = match[2];
    
    // Extract city and state if present
    const parts = locationPart.split('-');
    const state = parts.length > 1 ? parts[parts.length - 1] : null;
    const city = parts.slice(0, -1).join('-') || locationPart;

    return { service, city, state };
  }

  /**
   * Update page metrics from GSC data
   */
  async updatePageMetrics(url, metrics) {
    const mapping = await SEOPageMapping.findOne({ url });
    
    if (!mapping) {
      console.warn(`⚠️ No mapping found for ${url}`);
      return null;
    }

    await mapping.updateMetrics(metrics);
    console.log(`✅ Updated metrics for ${url}`);
    return mapping;
  }

  /**
   * Get major US cities for initial mapping
   * This list should be expanded based on market analysis
   */
  getMajorCities() {
    return [
      { name: 'miami', state: 'fl' },
      { name: 'new-york', state: 'ny' },
      { name: 'los-angeles', state: 'ca' },
      { name: 'chicago', state: 'il' },
      { name: 'houston', state: 'tx' },
      { name: 'phoenix', state: 'az' },
      { name: 'philadelphia', state: 'pa' },
      { name: 'san-antonio', state: 'tx' },
      { name: 'san-diego', state: 'ca' },
      { name: 'dallas', state: 'tx' },
      { name: 'san-jose', state: 'ca' },
      { name: 'austin', state: 'tx' },
      { name: 'jacksonville', state: 'fl' },
      { name: 'fort-worth', state: 'tx' },
      { name: 'columbus', state: 'oh' },
      { name: 'charlotte', state: 'nc' },
      { name: 'san-francisco', state: 'ca' },
      { name: 'indianapolis', state: 'in' },
      { name: 'seattle', state: 'wa' },
      { name: 'denver', state: 'co' },
      { name: 'washington', state: 'dc' },
      { name: 'boston', state: 'ma' },
      { name: 'nashville', state: 'tn' },
      { name: 'atlanta', state: 'ga' },
      { name: 'portland', state: 'or' },
      { name: 'las-vegas', state: 'nv' },
      { name: 'detroit', state: 'mi' },
      { name: 'baltimore', state: 'md' },
      { name: 'memphis', state: 'tn' },
      { name: 'louisville', state: 'ky' }
    ];
  }
}

module.exports = PageMapper;
