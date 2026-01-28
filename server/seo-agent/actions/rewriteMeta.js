// Rewrite Meta Action - LLM ALLOWED
// Rewrites meta titles and descriptions using AI

const OpenAI = require('openai');
const mongoose = require('mongoose');

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Rewrites meta tags for an existing page
 * @param {Object} decision - The REWRITE_META decision object
 */
async function rewriteMeta(decision) {
  const { service, city, data } = decision;
  
  console.log(`✏️ Rewriting meta tags: ${service} in ${city}`);
  
  try {
    // Generate new meta tags using LLM
    const newMeta = await generateMetaTags(service, city, data);
    
    // Update page in database
    await updatePageMeta(service, city, newMeta);
    
    console.log(`✅ Meta tags updated for ${service} in ${city}`);
    
    return { success: true, newMeta };
    
  } catch (error) {
    console.error(`❌ Failed to rewrite meta for ${service} in ${city}:`, error.message);
    throw error;
  }
}

/**
 * Generate optimized meta tags using OpenAI
 * Focus on improving CTR for current position
 */
async function generateMetaTags(service, city, data) {
  if (!openaiClient) {
    throw new Error('OpenAI not configured - cannot generate meta tags');
  }
  
  const currentCTR = (data.currentCTR * 100).toFixed(2);
  const expectedCTR = (data.expectedCTR * 100).toFixed(2);
  
  const prompt = `Rewrite SEO meta tags to improve click-through rate.

Service: ${service}
Location: ${city}
Current Position: ${data.position.toFixed(1)}
Current CTR: ${currentCTR}% (Expected: ${expectedCTR}%)
Target Query: "${data.query}"

Create:
1. Title tag (50-60 characters) - must be compelling and include location
2. Meta description (150-160 characters) - must include strong CTA

Focus on:
- Emotional triggers (trust, urgency, convenience)
- Differentiation (verified, professional, fast)
- Local relevance
- Clear benefit

Format: JSON with keys: title, description`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO copywriter specializing in meta tags that drive high CTR. Be compelling but authentic.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8, // Higher creativity for meta tags
    max_tokens: 300,
  });
  
  const contentText = response.choices[0].message.content;
  
  // Parse JSON response
  try {
    const jsonMatch = contentText.match(/```json\n?([\s\S]*?)\n?```/) || 
                      contentText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : contentText;
    const parsed = JSON.parse(jsonText);
    
    return {
      title: parsed.title || `${service} in ${city} - Get Free Quotes`,
      description: parsed.description || `Find trusted ${service} professionals in ${city}. Verified experts, fast response, free quotes.`,
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error.message);
    // Return safe fallback
    return {
      title: `${service} in ${city} - Trusted Professionals`,
      description: `Connect with verified ${service} experts in ${city}. Free quotes, fast service, 100% satisfaction guaranteed.`,
    };
  }
}

/**
 * Update page meta tags in database
 */
async function updatePageMeta(service, city, newMeta) {
  let SEOPage;
  try {
    SEOPage = mongoose.model('SEOPage');
  } catch (error) {
    console.warn('⚠️ SEOPage model not found - skipping update for now');
    return;
  }
  
  const result = await SEOPage.findOneAndUpdate(
    { service, city },
    {
      $set: {
        'content.title': newMeta.title,
        'content.metaDescription': newMeta.description,
        'metadata.lastMetaUpdate': new Date(),
        'metadata.metaUpdateCount': { $inc: 1 },
      },
    },
    { new: true }
  );
  
  if (!result) {
    console.warn(`⚠️ Page not found: ${service} in ${city}`);
  } else {
    console.log(`💾 Meta tags updated in database`);
  }
}

module.exports = {
  rewriteMeta,
  generateMetaTags,
};
