const OpenAI = require('openai');
const { TRUST_SIGNALS, ACTION_VERBS } = require('../../config/seoAgentConstants');

/**
 * SEO Content Generator - Execution Layer
 * 
 * LLM IS ALLOWED HERE (but only as a worker, not decider)
 * 
 * Generates:
 * - Page content (H1, intro, pricing, FAQs)
 * - Meta titles and descriptions
 * - Content expansions
 */
class ContentGenerator {
  constructor() {
    this.openai = null;
    this.model = 'gpt-4o-mini'; // Cost-effective model for content generation
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI initialized for SEO content generation');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not set - content generation will not work');
    }
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured() {
    return this.openai !== null;
  }

  /**
   * Task 3.1 — Page Generator
   * 
   * Generate complete page content for service + city
   */
  async generatePage(service, city, state = null) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI not configured');
    }

    const location = state ? `${city}, ${state}` : city;
    const locationName = city.replace(/-/g, ' ');
    const serviceName = service.replace(/-/g, ' ');

    const systemPrompt = `You are an expert SEO content writer for Fixlo, a trusted home services marketplace.

Your task is to generate LOCAL SERVICE PAGE CONTENT that:
1. Builds trust (Fixlo vets all pros, background checks, licensed professionals)
2. Explains pricing transparency (no hidden fees, free quotes)
3. Highlights speed (instant response, same-day service when available)
4. Answers common questions (FAQs)
5. Includes strong local relevance

Guidelines:
- Use simple, clear language (8th grade reading level)
- Focus on homeowner benefits, not features
- Include trust signals naturally (not salesy)
- Make it scannable (short paragraphs, bullet points)
- NO fluff or keyword stuffing`;

    const userPrompt = `Generate content for: ${serviceName} services in ${locationName}

Provide the following in JSON format:
{
  "h1": "Main heading (include service + city)",
  "intro": "2-3 sentence intro paragraph (trust-focused)",
  "pricing": "Paragraph explaining pricing transparency",
  "whyFixlo": "3-4 bullet points why homeowners choose Fixlo",
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}

Make it specific to ${locationName} where possible (mention local factors).`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = JSON.parse(response.choices[0].message.content);
      
      return {
        ...content,
        model: this.model,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      console.error('❌ Failed to generate page content:', error.message);
      throw error;
    }
  }

  /**
   * Task 3.2 — Meta Rewriter
   * 
   * Generate ONE title/meta variant optimized for CTR
   */
  async generateMeta(url, service, city, state = null, currentMetrics = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI not configured');
    }

    const location = state ? `${city}, ${state}` : city;
    const locationName = city.replace(/-/g, ' ');
    const serviceName = service.replace(/-/g, ' ');
    
    // Provide defaults for metrics
    const ctr = currentMetrics.ctr || 0;
    const position = currentMetrics.position || 10;

    const systemPrompt = `You are an expert SEO meta tag optimizer for Fixlo.

Your task is to write HIGH-CTR meta titles and descriptions that:
1. Include action verb (${ACTION_VERBS.join(', ')})
2. Include location (${locationName})
3. Include trust signal (${TRUST_SIGNALS.slice(0, 3).join(', ')})
4. Create urgency or value proposition
5. Stay within character limits (title: 60 chars, description: 155 chars)

Guidelines:
- Make it compelling and click-worthy
- Use power words and emotional triggers
- Be specific and benefit-focused
- NO clickbait or misleading claims`;

    const userPrompt = url 
      ? `Current page: ${url}
Service: ${serviceName}
Location: ${locationName}
Current CTR: ${(ctr * 100).toFixed(2)}%
Current Position: ${position.toFixed(1)}

Generate ONE optimized meta title and description in JSON format:
{
  "title": "...",
  "metaDescription": "..."
}

Focus on improving CTR from current ${(ctr * 100).toFixed(2)}%.`
      : `New page for: ${serviceName} in ${locationName}

Generate ONE optimized meta title and description in JSON format:
{
  "title": "...",
  "metaDescription": "..."
}

Focus on high CTR and compelling copy.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8, // Slightly higher for creativity
        max_tokens: 300
      });

      const meta = JSON.parse(response.choices[0].message.content);
      
      return {
        ...meta,
        model: this.model,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      console.error('❌ Failed to generate meta tags:', error.message);
      throw error;
    }
  }

  /**
   * Task 3.3 — Content Expander
   * 
   * Add FAQs, pricing transparency, trust blocks
   * DO NOT rewrite entire page
   */
  async expandContent(url, service, city, state = null, currentPosition) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI not configured');
    }

    const locationName = city.replace(/-/g, ' ');
    const serviceName = service.replace(/-/g, ' ');

    const systemPrompt = `You are an expert SEO content expander for Fixlo.

Your task is to generate ADDITIONAL content to add to existing pages:
1. More FAQs (answer real user questions)
2. Pricing transparency section (build trust)
3. Trust blocks (why choose Fixlo)

Guidelines:
- DO NOT rewrite existing content
- Focus on adding depth and value
- Answer questions users might have
- Build trust and credibility
- Keep it concise and scannable`;

    const userPrompt = `Page: ${url}
Service: ${serviceName} in ${locationName}
Current Position: ${currentPosition.toFixed(1)}

Generate expansion content in JSON format:
{
  "additionalFaqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ],
  "pricingDetails": "Paragraph with pricing transparency details",
  "trustBlock": "2-3 sentences about Fixlo's vetting process and guarantees"
}

Focus on queries that might help us rank higher (position ${currentPosition.toFixed(1)} → position 1-3).`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000
      });

      const expansion = JSON.parse(response.choices[0].message.content);
      
      return {
        ...expansion,
        model: this.model,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      console.error('❌ Failed to expand content:', error.message);
      throw error;
    }
  }

  /**
   * Generate schema.org structured data
   */
  generateSchema(service, city, state = null) {
    const locationName = city.replace(/-/g, ' ');
    const serviceName = service.replace(/-/g, ' ');
    const location = state ? `${locationName}, ${state.toUpperCase()}` : locationName;

    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': `${serviceName} in ${location}`,
      'serviceType': serviceName,
      'provider': {
        '@type': 'LocalBusiness',
        'name': 'Fixlo',
        'description': 'Trusted home services marketplace connecting homeowners with vetted professionals',
        'areaServed': {
          '@type': 'City',
          'name': locationName
        }
      },
      'areaServed': {
        '@type': 'City',
        'name': locationName
      }
    };
  }

  /**
   * Generate FAQ schema
   */
  generateFAQSchema(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
  }
}

module.exports = ContentGenerator;
