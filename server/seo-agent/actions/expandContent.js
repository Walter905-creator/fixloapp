// Expand Content Action - LLM ALLOWED
// Expands page content with FAQs and additional sections

const OpenAI = require('openai');
const mongoose = require('mongoose');

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Expands existing page content
 * @param {Object} decision - The EXPAND_CONTENT decision object
 */
async function expandContent(decision) {
  const { service, city, data } = decision;
  
  console.log(`📝 Expanding content: ${service} in ${city}`);
  
  try {
    // Generate additional content using LLM
    const expansion = await generateContentExpansion(service, city, data);
    
    // Update page in database
    await updatePageContent(service, city, expansion);
    
    console.log(`✅ Content expanded for ${service} in ${city}`);
    
    return { success: true, expansion };
    
  } catch (error) {
    console.error(`❌ Failed to expand content for ${service} in ${city}:`, error.message);
    throw error;
  }
}

/**
 * Generate content expansion using OpenAI
 * Adds FAQs and additional helpful sections
 */
async function generateContentExpansion(service, city, data) {
  if (!openaiClient) {
    throw new Error('OpenAI not configured - cannot generate content');
  }
  
  const prompt = `Expand content for a high-performing service page to increase engagement.

Service: ${service}
Location: ${city}
Current Position: ${data.position.toFixed(1)}
Current CTR: ${(data.ctr * 100).toFixed(2)}%
Impressions: ${data.impressions}

Generate additional content:
1. FAQ section (5-7 questions) - address common concerns
2. "Why Choose Us" section (3-4 bullet points)
3. "How It Works" steps (3-4 steps)
4. Local tips paragraph (specific to ${city})

Focus on:
- Answering real user questions
- Building trust and credibility
- Local relevance and insights
- Conversion optimization

Format: JSON with keys: faqs (array), whyChooseUs (array), howItWorks (array), localTips (string)`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert content writer for home services. Create helpful, trustworthy content that answers real user questions.',
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
    const jsonMatch = contentText.match(/```json\n?([\s\S]*?)\n?```/) || 
                      contentText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : contentText;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse LLM response:', error.message);
    // Return minimal fallback
    return {
      faqs: [
        {
          question: `How do I find ${service} professionals in ${city}?`,
          answer: 'Use Fixlo to connect with verified local professionals.',
        },
      ],
      whyChooseUs: ['Verified professionals', 'Fast response time', 'Free quotes'],
      howItWorks: ['Submit request', 'Get matched', 'Hire with confidence'],
      localTips: `${city} residents trust Fixlo for quality ${service} services.`,
    };
  }
}

/**
 * Update page content in database
 */
async function updatePageContent(service, city, expansion) {
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
        'content.faqs': expansion.faqs,
        'content.whyChooseUs': expansion.whyChooseUs,
        'content.howItWorks': expansion.howItWorks,
        'content.localTips': expansion.localTips,
        'metadata.lastContentExpansion': new Date(),
        'metadata.contentExpansionCount': { $inc: 1 },
      },
    },
    { new: true }
  );
  
  if (!result) {
    console.warn(`⚠️ Page not found: ${service} in ${city}`);
  } else {
    console.log(`💾 Content expansion saved to database`);
  }
}

module.exports = {
  expandContent,
  generateContentExpansion,
};
