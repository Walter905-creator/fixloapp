// Create Page Action - LLM ALLOWED
// Generates and saves new service pages

const OpenAI = require('openai');
const mongoose = require('mongoose');

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Creates a new service page with AI-generated content
 * @param {Object} decision - The CREATE_PAGE decision object
 */
async function createPage(decision) {
  const { service, city, state, data } = decision;
  
  console.log(`📝 Creating page: ${service} in ${city}, ${state}`);
  
  try {
    // Generate page content using LLM
    const content = await generatePageContent(service, city, state, data);
    
    // Save page to database
    const slug = `/services/${service}-in-${city.toLowerCase().replace(/\s+/g, '-')}`;
    await savePageToCMS({
      slug,
      service,
      city,
      state,
      content,
      schema: buildSchema(service, city, state),
      metadata: {
        createdBy: 'seo-agent',
        sourceQuery: data.query,
        sourceImpressions: data.impressions,
        sourcePosition: data.position,
      },
    });
    
    console.log(`✅ Page created: ${slug}`);
    
    // Submit for indexing (separate action)
    // await submitIndexing(slug);
    
    return { success: true, slug };
    
  } catch (error) {
    console.error(`❌ Failed to create page for ${service} in ${city}:`, error.message);
    throw error;
  }
}

/**
 * Generate page content using OpenAI
 * LLM is used ONLY for content generation, not decisions
 */
async function generatePageContent(service, city, state, data) {
  if (!openaiClient) {
    throw new Error('OpenAI not configured - cannot generate content');
  }
  
  const prompt = `Generate SEO-optimized content for a home services marketplace page.

Service: ${service}
Location: ${city}, ${state}
Target keyword: "${data.query || `${service} in ${city}`}"

Create a comprehensive service page with:
1. Compelling H1 title (50-60 chars)
2. Meta description (150-160 chars)
3. Opening paragraph (100-150 words)
4. Service benefits (3-5 bullet points)
5. FAQ section (3-5 questions)
6. Call-to-action paragraph

Focus on local relevance, trust signals, and conversion optimization.
Tone: Professional, helpful, trustworthy.
Format: JSON with keys: title, metaDescription, h1, intro, benefits, faqs, cta`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO content writer for a home services marketplace. Generate high-quality, conversion-focused content.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });
  
  const contentText = response.choices[0].message.content;
  
  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const jsonMatch = contentText.match(/```json\n?([\s\S]*?)\n?```/) || 
                      contentText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : contentText;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error.message);
    // Return structured fallback
    return {
      title: `${service} in ${city} - Professional Service`,
      metaDescription: `Find trusted ${service} professionals in ${city}. Get free quotes from verified experts.`,
      h1: `${service.charAt(0).toUpperCase() + service.slice(1)} Services in ${city}`,
      intro: contentText.substring(0, 500),
      benefits: [],
      faqs: [],
      cta: 'Get started today!',
    };
  }
}

/**
 * Save page to CMS/Database
 */
async function savePageToCMS(pageData) {
  // Get or create SEOPage model
  let SEOPage;
  try {
    SEOPage = mongoose.model('SEOPage');
  } catch (error) {
    // Model doesn't exist yet - will be created with database models
    console.warn('⚠️ SEOPage model not found - skipping save for now');
    return;
  }
  
  const page = new SEOPage(pageData);
  await page.save();
  
  console.log(`💾 Saved page to database: ${pageData.slug}`);
}

/**
 * Build structured data schema for the page
 */
function buildSchema(service, city, state) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service} in ${city}`,
    serviceType: service,
    areaServed: {
      '@type': 'City',
      name: city,
      containedIn: {
        '@type': 'State',
        name: state,
      },
    },
    provider: {
      '@type': 'Organization',
      name: 'Fixlo',
      url: 'https://www.fixloapp.com',
    },
  };
}

module.exports = {
  createPage,
  generatePageContent,
};
