/**
 * Content Generator with Variation Engine
 * 
 * Generates unique, high-quality SEO content with built-in variation
 * to ensure no duplicate content is created.
 */

const crypto = require('crypto');
const { CONTENT_QUALITY, LANGUAGES, SERVICES } = require('./config');
const logger = require('./logger');

class ContentGenerator {
  constructor() {
    this.contentHashes = new Map(); // Store fingerprints to avoid duplication
    this.synonyms = this.loadSynonyms();
    this.templates = this.loadTemplates();
  }
  
  /**
   * Load synonyms for variation
   */
  loadSynonyms() {
    return {
      professional: ['expert', 'specialist', 'technician', 'contractor', 'pro'],
      quality: ['high-quality', 'premium', 'top-rated', 'excellent', 'superior'],
      service: ['work', 'service', 'assistance', 'help', 'solution'],
      reliable: ['dependable', 'trustworthy', 'reliable', 'consistent', 'solid'],
      fast: ['quick', 'rapid', 'speedy', 'prompt', 'swift'],
      experienced: ['skilled', 'seasoned', 'veteran', 'qualified', 'proficient'],
      affordable: ['reasonable', 'competitive', 'fair-priced', 'cost-effective', 'economical'],
      emergency: ['urgent', 'immediate', 'crisis', 'critical', 'pressing'],
    };
  }
  
  /**
   * Load content templates for different page types
   */
  loadTemplates() {
    return {
      intro: [
        'Looking for {service} in {location}? Fixlo connects you with verified professionals ready to help.',
        'Need {service} services in {location}? Get matched with trusted local experts through Fixlo.',
        'Find {service} professionals in {location} quickly and easily with Fixlo\'s verified network.',
        'Connect with top-rated {service} specialists in {location} through our trusted platform.',
        'Get quality {service} services in {location} from background-checked professionals.',
      ],
      value: [
        'All professionals are verified, licensed, and background-checked for your safety.',
        'Every service provider undergoes thorough vetting to ensure quality and reliability.',
        'We screen all professionals to guarantee you receive the best service possible.',
        'Your safety is our priority - all providers are carefully vetted and verified.',
        'Trust in our network of pre-screened, qualified professionals.',
      ],
      process: [
        'Simply describe your needs, get matched with qualified professionals, and book your service.',
        'Tell us what you need, review matched experts, and schedule at your convenience.',
        'Submit your request, compare qualified professionals, and choose the right fit.',
        'Describe your project, receive matches from verified pros, and book instantly.',
        'Request service, get connected with vetted professionals, and schedule your appointment.',
      ],
      closing: [
        'Ready to get started? Submit your request today and connect with the best {service} professionals in {location}.',
        'Don\'t wait - find your perfect {service} expert in {location} now.',
        'Get matched with qualified {service} specialists in {location} within minutes.',
        'Start your {service} project today with trusted professionals in {location}.',
        'Connect with top {service} experts in {location} and get your project done right.',
      ],
    };
  }
  
  /**
   * Generate content fingerprint hash
   */
  generateFingerprint(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Check if content is duplicate
   */
  isDuplicate(content) {
    const fingerprint = this.generateFingerprint(content);
    return this.contentHashes.has(fingerprint);
  }
  
  /**
   * Store content fingerprint
   */
  storeFingerprint(content) {
    const fingerprint = this.generateFingerprint(content);
    this.contentHashes.set(fingerprint, new Date().toISOString());
  }
  
  /**
   * Get random item from array
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * Replace placeholders in template
   */
  fillTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
  
  /**
   * Apply synonym variation to text
   */
  applySynonymVariation(text) {
    let result = text;
    
    // Randomly replace some words with synonyms
    for (const [word, synonymList] of Object.entries(this.synonyms)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(result) && Math.random() > 0.5) {
        result = result.replace(regex, this.randomChoice(synonymList));
      }
    }
    
    return result;
  }
  
  /**
   * Generate unique intro
   */
  generateIntro(service, location, variant = 'standard') {
    const template = this.randomChoice(this.templates.intro);
    let intro = this.fillTemplate(template, { service, location });
    
    // Apply variation for emergency variants
    if (variant.includes('emergency')) {
      intro = intro.replace('Looking for', 'Need urgent');
      intro = intro.replace('Find', 'Get immediate');
    }
    
    return this.applySynonymVariation(intro);
  }
  
  /**
   * Generate unique value proposition
   */
  generateValueProposition() {
    const template = this.randomChoice(this.templates.value);
    const expanded = template + ' ' + this.generateAdditionalContent();
    return this.applySynonymVariation(expanded);
  }
  
  /**
   * Generate unique process description
   */
  generateProcessDescription() {
    const template = this.randomChoice(this.templates.process);
    const expanded = template + ' ' + this.generateProcessDetails();
    return this.applySynonymVariation(expanded);
  }
  
  /**
   * Generate additional content for sections
   */
  generateAdditionalContent() {
    const additions = [
      'Our platform ensures transparency throughout the entire process, from initial contact to project completion.',
      'We understand that finding the right professional for your home is important, which is why we take vetting seriously.',
      'Each professional in our network has been carefully evaluated to meet our high standards for quality and reliability.',
      'Your peace of mind is our priority, and we work hard to connect you with professionals who care about your home as much as you do.',
    ];
    return this.randomChoice(additions);
  }
  
  /**
   * Generate process details
   */
  generateProcessDetails() {
    const details = [
      'Once you submit your request, our system matches you with qualified professionals in your area who can help.',
      'You\'ll be able to review profiles, compare pricing, and read reviews from other homeowners before making your decision.',
      'The entire process is designed to be simple and straightforward, with no hidden fees or surprises.',
      'Communication is easy through our platform, and you can track your service request every step of the way.',
    ];
    return this.randomChoice(details);
  }
  
  /**
   * Generate unique closing
   */
  generateClosing(service, location) {
    const template = this.randomChoice(this.templates.closing);
    const closing = this.fillTemplate(template, { service, location });
    return this.applySynonymVariation(closing);
  }
  
  /**
   * Generate varied headings
   */
  generateHeadings(service, location, variant = 'standard') {
    const headingTemplates = [
      [`Why Choose {service} Services in {location}?`, `Benefits of Professional {service}`, `What to Expect`],
      [`Professional {service} in {location}`, `Our {service} Process`, `Quality Guaranteed`],
      [`Top {service} Services in {location}`, `How We Help`, `Get Started Today`],
      [`Expert {service} for {location}`, `Service Details`, `Book Your Appointment`],
    ];
    
    const selected = this.randomChoice(headingTemplates);
    return selected.map(h => this.fillTemplate(h, { service, location }));
  }
  
  /**
   * Generate FAQ items
   */
  generateFAQ(service, location, language = 'en') {
    if (language === 'es') {
      return this.generateSpanishFAQ(service, location);
    }
    
    const faqs = [
      {
        question: `How quickly can I get ${service} service in ${location}?`,
        answer: `Most ${service} professionals in ${location} can respond within 24 hours, with many offering same-day service for urgent needs.`,
      },
      {
        question: `Are the ${service} professionals verified?`,
        answer: `Yes, all professionals on Fixlo are background-checked, licensed, and verified to ensure quality and safety.`,
      },
      {
        question: `What does ${service} service typically cost in ${location}?`,
        answer: `Costs vary based on the specific work needed. You'll receive transparent quotes from multiple professionals before booking.`,
      },
      {
        question: `How do I choose the right ${service} professional?`,
        answer: `Review ratings, read past customer reviews, compare quotes, and select the professional that best fits your needs and budget.`,
      },
      {
        question: `What if I'm not satisfied with the ${service}?`,
        answer: `Fixlo connects you with professionals who stand behind their work. Contact our support team if you have any concerns.`,
      },
    ];
    
    // Return random subset
    const shuffled = faqs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.max(CONTENT_QUALITY.minFAQItems, 3));
  }
  
  /**
   * Generate Spanish FAQ items
   */
  generateSpanishFAQ(service, location) {
    const faqs = [
      {
        question: `¿Qué tan rápido puedo obtener servicio de ${service} en ${location}?`,
        answer: `La mayoría de los profesionales de ${service} en ${location} pueden responder dentro de 24 horas, y muchos ofrecen servicio el mismo día para necesidades urgentes.`,
      },
      {
        question: `¿Los profesionales de ${service} están verificados?`,
        answer: `Sí, todos los profesionales en Fixlo están verificados, tienen licencia y han pasado verificación de antecedentes para garantizar calidad y seguridad.`,
      },
      {
        question: `¿Cuánto cuesta típicamente el servicio de ${service} en ${location}?`,
        answer: `Los costos varían según el trabajo específico necesario. Recibirá cotizaciones transparentes de múltiples profesionales antes de reservar.`,
      },
    ];
    
    return faqs;
  }
  
  /**
   * Generate complete page content
   */
  generatePageContent(params) {
    const { service, location, variant = 'standard', language = 'en' } = params;
    
    try {
      // Generate content sections
      const intro = this.generateIntro(service, location, variant);
      const value = this.generateValueProposition();
      const process = this.generateProcessDescription();
      const closing = this.generateClosing(service, location);
      const headings = this.generateHeadings(service, location, variant);
      const faq = this.generateFAQ(service, location, language);
      
      // Add more content sections to meet word count
      const additionalSections = [
        {
          heading: `What Makes Our ${service} Service Different`,
          body: `We've built our platform with one goal in mind: making it easy for homeowners to find trustworthy professionals. Our ${service} network in ${location} consists of experienced, licensed professionals who are dedicated to providing excellent service. Every professional goes through our comprehensive screening process, which includes background checks, license verification, and review of their work history. This means you can have confidence in the quality of service you'll receive. We also provide transparent pricing upfront, so you'll know what to expect before any work begins.`,
        },
        {
          heading: `Understanding Your ${service} Needs`,
          body: `Every home and every ${service} project is unique. Whether you need routine maintenance, emergency repairs, or a major installation, having the right professional makes all the difference. In ${location}, our network of ${service} experts has experience with everything from simple fixes to complex projects. They understand local building codes, common issues specific to the area, and the best practices for ensuring long-lasting results. When you submit your service request, you'll receive personalized attention from professionals who truly understand your needs.`,
        },
        {
          heading: `The Benefits of Using Fixlo`,
          body: `Choosing Fixlo for your ${service} needs in ${location} comes with several advantages. First, our thorough vetting process ensures you're only connected with qualified, trustworthy professionals. Second, our platform makes it easy to compare multiple options, read reviews, and make an informed decision. Third, we provide customer support throughout your entire experience. Finally, our professionals know that their reputation depends on your satisfaction, which means they're motivated to deliver excellent service every time.`,
        },
      ];
      
      // Assemble full content with additional sections
      const content = {
        title: this.generateTitle(service, location, variant, language),
        description: this.generateDescription(service, location, language),
        intro,
        sections: [
          { heading: headings[0], body: value },
          { heading: headings[1], body: process },
          ...additionalSections,
          { heading: headings[2], body: closing },
        ],
        faq,
        language,
        variant,
      };
      
      // Convert to text for fingerprint check
      const fullText = this.contentToText(content);
      
      // Check for duplication
      if (this.isDuplicate(fullText)) {
        logger.warn('Duplicate content detected, regenerating', { service, location, variant });
        // In production, implement retry logic here
        return null;
      }
      
      // Store fingerprint
      this.storeFingerprint(fullText);
      
      // Validate quality
      if (!this.validateQuality(fullText)) {
        logger.warn('Content failed quality check', { 
          service, 
          location, 
          variant,
          wordCount: this.countWords(fullText),
        });
        return null;
      }
      
      logger.info('Content generated successfully', { service, location, variant, language });
      
      return content;
      
    } catch (error) {
      logger.error('Content generation failed', { service, location, variant, error: error.message });
      return null;
    }
  }
  
  /**
   * Generate page title
   */
  generateTitle(service, location, variant, language) {
    if (language === 'es') {
      return `${service} en ${location} | Fixlo`;
    }
    
    if (variant.includes('emergency')) {
      return `Emergency ${service} in ${location} | 24/7 Service | Fixlo`;
    }
    
    if (variant.includes('near-me')) {
      return `${service} Near Me in ${location} | Find Local Experts | Fixlo`;
    }
    
    return `${service} in ${location} | Trusted Professionals | Fixlo`;
  }
  
  /**
   * Generate meta description
   */
  generateDescription(service, location, language) {
    if (language === 'es') {
      return `Conecte con profesionales verificados de ${service} en ${location}. Servicio rápido, confiable y asequible.`;
    }
    
    return `Find verified ${service} professionals in ${location}. Get matched with trusted local experts. Fast, reliable, and affordable service.`;
  }
  
  /**
   * Convert content object to plain text
   */
  contentToText(content) {
    let text = content.title + ' ' + content.description + ' ' + content.intro;
    
    for (const section of content.sections) {
      text += ' ' + section.heading + ' ' + section.body;
    }
    
    for (const item of content.faq) {
      text += ' ' + item.question + ' ' + item.answer;
    }
    
    return text;
  }
  
  /**
   * Count words in text
   */
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }
  
  /**
   * Validate content quality
   */
  validateQuality(text) {
    const wordCount = this.countWords(text);
    
    // Check word count
    if (wordCount < CONTENT_QUALITY.minWordCount) {
      return false;
    }
    
    if (wordCount > CONTENT_QUALITY.maxWordCount) {
      return false;
    }
    
    // Additional quality checks could be added here
    // - Readability score
    // - Keyword density
    // - Sentence variety
    
    return true;
  }
}

module.exports = new ContentGenerator();
