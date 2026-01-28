// Fetch existing Fixlo pages for comparison
// Returns current pages to avoid duplication

const mongoose = require('mongoose');

/**
 * Fetches all existing Fixlo service pages
 * @returns {Promise<Set>} Set of existing page identifiers
 */
async function fetchFixloPages() {
  console.log('📄 Fetching existing Fixlo pages...');
  
  try {
    // Check if SEOPage model exists
    let SEOPage;
    try {
      SEOPage = mongoose.model('SEOPage');
    } catch (error) {
      console.warn('⚠️ SEOPage model not found - will create it later');
      return new Set();
    }
    
    const pages = await SEOPage.find({}, 'service city state slug').lean();
    
    // Create a Set of page identifiers for fast lookup
    const pageSet = new Set();
    pages.forEach(page => {
      // Store multiple identifier formats for flexible matching
      pageSet.add(`${page.service}:${page.city}`);
      pageSet.add(`${page.service}:${page.city}:${page.state}`);
      pageSet.add(page.slug);
    });
    
    console.log(`✅ Found ${pages.length} existing pages`);
    return pageSet;
    
  } catch (error) {
    console.error('❌ Error fetching Fixlo pages:', error.message);
    // Return empty set on error to allow agent to continue
    return new Set();
  }
}

/**
 * Check if a page exists for the given service/city combination
 * @param {Set} pageSet - Set of existing page identifiers
 * @param {string} service - Service type
 * @param {string} city - City name
 * @param {string} state - State (optional)
 * @returns {boolean} True if page exists
 */
function pageExists(pageSet, service, city, state = null) {
  if (state) {
    return pageSet.has(`${service}:${city}:${state}`);
  }
  return pageSet.has(`${service}:${city}`);
}

module.exports = {
  fetchFixloPages,
  pageExists,
};
