/**
 * FGE SEO Generator Service
 *
 * Builds complete LandingPage documents from AI-generated content,
 * constructs Schema.org JSON-LD, breadcrumbs, canonical URLs, and
 * internal links. Also handles sitemap updates and indexing queue.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const LandingPage = require('../models/LandingPage');
const MarketingQueue = require('../models/MarketingQueue');
const { generateLandingPageContent } = require('./aiGenerator');

const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://fixloapp.com';
const SITEMAP_PATH = path.resolve(__dirname, '../../../../sitemap.xml');

// ─── Slug helpers ─────────────────────────────────────────────────────────────

/**
 * Build a URL-friendly slug from a service, city, and state.
 * e.g. ("Plumber", "Charlotte", "NC") → "plumber/charlotte-nc"
 */
function buildSlug(service, city, state) {
  const svc = service.toLowerCase().trim().replace(/\s+/g, '-');
  const cty = city.toLowerCase().trim().replace(/\s+/g, '-');
  const st = state.toLowerCase().trim();
  return `${svc}/${cty}-${st}`;
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

/**
 * Build a LocalBusiness + Service schema JSON-LD string.
 */
function buildSchemaJson({ service, city, state, title, metaDescription }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description: metaDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Fixlo',
      url: SITE_BASE_URL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: 'US',
      },
    },
    areaServed: {
      '@type': 'City',
      name: `${city}, ${state}`,
    },
    serviceType: service,
    url: `${SITE_BASE_URL}/${buildSlug(service, city, state)}`,
  };
  return JSON.stringify(schema, null, 2);
}

// ─── FAQPage JSON-LD ──────────────────────────────────────────────────────────

function buildFaqSchemaJson(faqItems) {
  if (!faqItems || faqItems.length === 0) return null;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

function buildBreadcrumbs(service, city, state) {
  const slug = buildSlug(service, city, state);
  return [
    { label: 'Home', url: `${SITE_BASE_URL}/` },
    { label: `${city}, ${state}`, url: `${SITE_BASE_URL}/location/${city.toLowerCase()}-${state.toLowerCase()}` },
    { label: service, url: `${SITE_BASE_URL}/${slug}` },
  ];
}

// ─── Internal Links ───────────────────────────────────────────────────────────

function buildInternalLinks(service, city, state) {
  return [
    { text: 'Browse All Services', href: `${SITE_BASE_URL}/services` },
    { text: `Find a Pro in ${city}`, href: `${SITE_BASE_URL}/pros?city=${encodeURIComponent(city)}&state=${state}` },
    { text: `Get a ${service} Quote`, href: `${SITE_BASE_URL}/request?service=${encodeURIComponent(service)}` },
    { text: 'How It Works', href: `${SITE_BASE_URL}/how-it-works` },
  ];
}

// ─── Create or Update Landing Page ───────────────────────────────────────────

/**
 * Generate and persist a single SEO landing page.
 * If the page already exists it will be updated, not duplicated.
 *
 * @param {object} opts
 * @param {string} opts.service
 * @param {string} opts.city
 * @param {string} opts.state
 * @param {boolean} [opts.skipIfExists=true] - Skip if already published.
 * @returns {Promise<LandingPage document>}
 */
async function createLandingPage({ service, city, state, skipIfExists = true }) {
  const slug = buildSlug(service, city, state);

  if (skipIfExists) {
    const existing = await LandingPage.findOne({ slug, status: 'published' });
    if (existing) return existing;
  }

  // Generate AI content
  const content = await generateLandingPageContent({ service, city, state });

  const schemaJson = [
    buildSchemaJson({ service, city, state, title: content.title, metaDescription: content.metaDescription }),
    buildFaqSchemaJson(content.faq),
  ]
    .filter(Boolean)
    .join('\n');

  const page = await LandingPage.findOneAndUpdate(
    { slug },
    {
      service: service.toLowerCase(),
      city: city.toLowerCase(),
      state: state.toLowerCase(),
      slug,
      title: content.title,
      metaDescription: content.metaDescription,
      h1: content.h1,
      body: content.body,
      faq: content.faq || [],
      canonicalUrl: `${SITE_BASE_URL}/${slug}`,
      schemaJson,
      ogTitle: content.ogTitle || content.title,
      ogDescription: content.ogDescription || content.metaDescription,
      breadcrumbs: buildBreadcrumbs(service, city, state),
      internalLinks: buildInternalLinks(service, city, state),
      status: 'published',
      publishedAt: new Date(),
      generatedByAI: true,
    },
    { upsert: true, new: true }
  );

  // Queue sitemap update and indexing
  await queueSitemapUpdate();
  await queueIndexingRequest(`${SITE_BASE_URL}/${slug}`);

  return page;
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

async function queueSitemapUpdate() {
  await MarketingQueue.create({ type: 'sitemap_update', priority: 3 });
}

async function queueIndexingRequest(url) {
  await MarketingQueue.create({
    type: 'indexing_request',
    priority: 4,
    payload: { url },
  });
}

// ─── Sitemap helpers (synchronous file write) ─────────────────────────────────

/**
 * Append new landing page URLs to the existing sitemap.xml.
 * Checks for existing entries to avoid duplicates.
 * The production generate-sitemap.js script should be run periodically via cron.
 */
async function updateSitemap() {
  try {
    const pages = await LandingPage.find({ status: 'published' }).select('slug updatedAt').lean();

    if (!fs.existsSync(SITEMAP_PATH)) {
      console.warn('[FGE SEO] sitemap.xml not found at', SITEMAP_PATH);
      return;
    }

    let xmlContent = fs.readFileSync(SITEMAP_PATH, 'utf8');

    // Only add pages whose URL is not already present in the sitemap
    const newPages = pages.filter(
      (p) => !xmlContent.includes(`<loc>${SITE_BASE_URL}/${p.slug}</loc>`)
    );

    if (newPages.length === 0) {
      console.log('[FGE SEO] Sitemap already up to date.');
      return;
    }

    const newEntries = newPages
      .map(
        (p) =>
          `  <url>\n    <loc>${SITE_BASE_URL}/${p.slug}</loc>\n    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      )
      .join('\n');

    // Insert before closing </urlset>
    if (xmlContent.includes('</urlset>') && newEntries.trim().length > 0) {
      xmlContent = xmlContent.replace('</urlset>', `${newEntries}\n</urlset>`);
      fs.writeFileSync(SITEMAP_PATH, xmlContent, 'utf8');
      console.log(`[FGE SEO] Sitemap updated — added ${newPages.length} new landing pages.`);
    }
  } catch (err) {
    console.error('[FGE SEO] Sitemap update failed:', err.message);
  }
}

module.exports = {
  buildSlug,
  buildSchemaJson,
  buildFaqSchemaJson,
  buildBreadcrumbs,
  buildInternalLinks,
  createLandingPage,
  updateSitemap,
  queueSitemapUpdate,
  queueIndexingRequest,
};
