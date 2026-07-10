/**
 * FGE AI Generator Service
 *
 * Wraps OpenAI completions and image generation.
 * All calls are guarded so the app degrades gracefully when
 * OPENAI_API_KEY is not configured.
 */

'use strict';

const OPENAI_AVAILABLE = !!process.env.OPENAI_API_KEY;

let openai = null;
if (OPENAI_AVAILABLE) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn('[FGE] OpenAI init failed:', e.message);
  }
}

// ─── Text Generation ──────────────────────────────────────────────────────────

/**
 * Generate text content using GPT.
 * @param {string} systemPrompt - Instruction for the model role.
 * @param {string} userPrompt   - The specific request.
 * @param {string} [model]      - GPT model to use (default gpt-4o-mini).
 * @returns {Promise<string>} Generated text.
 */
async function generateText(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
  if (!openai) throw new Error('OpenAI is not configured. Set OPENAI_API_KEY.');

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Blog Article ─────────────────────────────────────────────────────────────

/**
 * Generate a complete blog article.
 * @param {object} opts
 * @param {string} opts.topic    - Main subject (e.g. "Spring HVAC maintenance").
 * @param {string} [opts.service]- Related Fixlo service category.
 * @param {string} [opts.city]   - Target city for local SEO.
 * @returns {Promise<{title, slug, excerpt, body, metaTitle, metaDescription, tags}>}
 */
async function generateBlogArticle({ topic, service = '', city = '' }) {
  const locationHint = city ? ` targeting homeowners in ${city}` : '';
  const serviceHint = service ? ` related to ${service} services` : '';

  const system = `You are a professional content writer for Fixlo, a home-services marketplace.
Write engaging, SEO-optimised blog articles${serviceHint}${locationHint}.
Always output valid JSON matching the requested schema.`;

  const prompt = `Write a blog article about: "${topic}".

Return JSON with these exact keys:
{
  "title": "...",
  "slug": "url-friendly-slug",
  "excerpt": "2–3 sentence summary",
  "body": "full HTML article (use <h2>, <p>, <ul>)",
  "metaTitle": "SEO title ≤60 chars",
  "metaDescription": "SEO description ≤160 chars",
  "tags": ["tag1","tag2","tag3"],
  "readTimeMinutes": 5
}`;

  const raw = await generateText(system, prompt, 'gpt-4o-mini');

  // Strip markdown code fences if present
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

// ─── Social Posts ─────────────────────────────────────────────────────────────

/**
 * Generate a social media post.
 * @param {object} opts
 * @param {'facebook'|'instagram'|'linkedin'|'x'|'google_business'} opts.platform
 * @param {string} opts.topic   - Subject or campaign topic.
 * @param {string} [opts.service]
 * @returns {Promise<string>} Post text ready for publishing.
 */
async function generateSocialPost({ platform, topic, service = '' }) {
  const platformGuides = {
    facebook: 'Conversational, 1–3 paragraphs, include a question to drive engagement.',
    instagram: 'Short punchy caption (≤150 words) + 10–15 relevant hashtags on a new line.',
    linkedin: 'Professional tone, 3 short paragraphs, end with a CTA.',
    x: 'Max 280 characters, punchy, include 2–3 hashtags.',
    google_business: '150–300 words, local focus, include a CTA to book a service.',
  };

  const guide = platformGuides[platform] || 'Write an engaging post.';
  const system = `You are a social media manager for Fixlo, a home-services marketplace.`;
  const serviceHint = service ? ` (service: ${service})` : '';

  const prompt = `Write a ${platform} post about: "${topic}"${serviceHint}.
Style guide: ${guide}
Return only the post text — no JSON wrapper needed.`;

  return generateText(system, prompt);
}

// ─── Email Campaign ───────────────────────────────────────────────────────────

/**
 * Generate an email campaign (subject + HTML body).
 * @param {object} opts
 * @param {string} opts.topic
 * @param {'homeowners'|'contractors'|'recruiters'|'all'} [opts.audience]
 * @param {string} [opts.cta]   - Call-to-action text.
 * @param {string} [opts.ctaUrl]
 * @returns {Promise<{subject, bodyHtml, bodyText, previewText}>}
 */
async function generateEmailCampaign({ topic, audience = 'all', cta = 'Book Now', ctaUrl = 'https://fixloapp.com' }) {
  const system = `You are an email marketing specialist for Fixlo, a home-services marketplace.
Write conversion-focused emails. Output valid JSON only.`;

  const prompt = `Create an email campaign about: "${topic}" for audience: "${audience}".

Return JSON:
{
  "subject": "...",
  "previewText": "short preview snippet",
  "bodyHtml": "full responsive HTML email body",
  "bodyText": "plain text fallback"
}

CTA: "${cta}" → ${ctaUrl}`;

  const raw = await generateText(system, prompt, 'gpt-4o-mini');
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

// ─── SMS Campaign ─────────────────────────────────────────────────────────────

/**
 * Generate an SMS message (≤160 chars).
 * @param {object} opts
 * @param {string} opts.topic
 * @param {string} [opts.audience]
 * @returns {Promise<string>}
 */
async function generateSmsMessage({ topic, audience = 'all' }) {
  const system = `You write concise SMS messages for Fixlo, a home-services marketplace.
Keep messages under 160 characters. No emojis unless specifically asked.`;

  const prompt = `Write an SMS message about "${topic}" for ${audience}. Max 160 chars.`;

  return generateText(system, prompt);
}

// ─── SEO Landing Page ─────────────────────────────────────────────────────────

/**
 * Generate content for a service+city landing page.
 * @param {object} opts
 * @param {string} opts.service  - e.g. "plumber"
 * @param {string} opts.city     - e.g. "Charlotte"
 * @param {string} opts.state    - e.g. "NC"
 * @returns {Promise<object>} Landing page content.
 */
async function generateLandingPageContent({ service, city, state }) {
  const system = `You are an SEO content writer for Fixlo, a home-services marketplace.
Create highly localised service pages. Output valid JSON only.`;

  const prompt = `Create an SEO landing page for: ${service} services in ${city}, ${state}.

Return JSON:
{
  "title": "page <title> tag (≤60 chars)",
  "metaDescription": "≤160 chars",
  "h1": "main heading",
  "body": "full HTML content (600–800 words, use <h2>, <p>, <ul>)",
  "faq": [
    {"question":"...","answer":"..."},
    {"question":"...","answer":"..."},
    {"question":"...","answer":"..."}
  ],
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description"
}`;

  const raw = await generateText(system, prompt, 'gpt-4o-mini');
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

// ─── AI Report ────────────────────────────────────────────────────────────────

/**
 * Generate the daily AI growth summary report.
 * @param {object} metricsSnapshot - Snapshot from analytics collections.
 * @returns {Promise<{summary, seoOpportunities, recommendations, brokenLinks}>}
 */
async function generateDailyReport(metricsSnapshot) {
  const system = `You are a growth strategist for Fixlo, a home-services marketplace.
Analyse the metrics provided and give actionable recommendations.
Output valid JSON only.`;

  const prompt = `Here are today's metrics:
${JSON.stringify(metricsSnapshot, null, 2)}

Return JSON:
{
  "summary": "2–3 sentence executive summary",
  "seoOpportunities": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "highlights": ["...", "..."]
}`;

  const raw = await generateText(system, prompt, 'gpt-4o-mini');
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

// ─── Image Generation ─────────────────────────────────────────────────────────

/**
 * Generate an image using DALL-E 3.
 * @param {string} prompt      - Image description.
 * @param {'1024x1024'|'1792x1024'|'1024x1792'} [size]
 * @returns {Promise<{url, revisedPrompt}>}
 */
async function generateImage(prompt, size = '1024x1024') {
  if (!openai) throw new Error('OpenAI is not configured. Set OPENAI_API_KEY.');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality: 'standard',
  });

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
}

module.exports = {
  generateText,
  generateBlogArticle,
  generateSocialPost,
  generateEmailCampaign,
  generateSmsMessage,
  generateLandingPageContent,
  generateDailyReport,
  generateImage,
  isAvailable: OPENAI_AVAILABLE && !!openai,
};
