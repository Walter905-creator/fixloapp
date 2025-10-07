/**
 * DEPRECATED: This script has been replaced by the root generate-sitemap.js
 * 
 * This script was generating 4,232 URLs (9 services × 470 cities) which caused
 * Google Search Console indexing issues:
 * - Soft 404 errors for non-existent city pages
 * - Duplicate content issues
 * - Crawl budget waste
 * - "Crawled - currently not indexed" issues
 * 
 * The correct sitemap generator is now in the root directory which generates
 * only 17 high-value URLs for pages that actually exist with unique content.
 * 
 * This file is kept for reference but should not be used.
 */

console.warn('⚠️ WARNING: This sitemap generator is deprecated.');
console.warn('⚠️ Use the root generate-sitemap.js instead.');
console.warn('⚠️ This script was generating 4,232 URLs causing GSC indexing issues.');
process.exit(1);