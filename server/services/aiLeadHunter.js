const OpenAI = require('openai');
const crypto = require('crypto');
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { sendSMS } = require('./smsService');

/**
 * AI Lead Hunter Service
 * Automatically detects and classifies leads using OpenAI
 * Matches with pros and sends notifications
 */

// OpenAI configuration with timeout
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000 // 10 second timeout
    })
  : null;

// Track execution stats
let stats = {
  lastRun: null,
  leadsGenerated: 0,
  errors: 0,
  running: false
};

// In-memory duplicate detection (last 1000 leads)
const recentLeadHashes = new Set();
const MAX_HASH_CACHE = 1000;

/**
 * Generate hash for duplicate detection
 */
function generateLeadHash(source, text) {
  const combined = `${source}:${text}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Check if lead is duplicate
 */
function isDuplicate(source, text) {
  const hash = generateLeadHash(source, text);
  if (recentLeadHashes.has(hash)) {
    return true;
  }
  
  // Add to cache with size limit
  recentLeadHashes.add(hash);
  if (recentLeadHashes.size > MAX_HASH_CACHE) {
    // Remove oldest (first) item
    const firstItem = recentLeadHashes.values().next().value;
    recentLeadHashes.delete(firstItem);
  }
  
  return false;
}

/**
 * Classify lead using OpenAI
 * Returns: { service, city, urgency, confidence }
 */
async function classifyLead(text) {
  if (!openai) {
    console.warn('[LEAD_HUNTER] ⚠️ OpenAI not configured, using fallback');
    return {
      service: 'Other',
      city: null,
      urgency: 'Flexible',
      confidence: 30
    };
  }

  try {
    // Wrap in timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI request timeout')), 10000)
    );

    const classificationPromise = openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a home services classifier. Analyze the text and extract:
1. Service type (choose one: Plumbing, Electrical, HVAC, Roofing, Carpentry, Painting, Drywall, Flooring, House Cleaning, Junk Removal, General Repairs, Other)
2. City/location (if mentioned)
3. Urgency level (Same day, Within 48 hours, This week, Flexible)
4. Confidence score (0-100)

Respond in JSON format:
{
  "service": "service type",
  "city": "city name or null",
  "urgency": "urgency level",
  "confidence": 85
}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const completion = await Promise.race([classificationPromise, timeoutPromise]);
    const response = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(response);
    
    return {
      service: parsed.service || 'Other',
      city: parsed.city || null,
      urgency: parsed.urgency || 'Flexible',
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50))
    };
    
  } catch (error) {
    if (error.message === 'OpenAI request timeout') {
      console.error('[LEAD_HUNTER] ⏱️ OpenAI timeout (10s exceeded)');
    } else {
      console.error('[LEAD_HUNTER] ❌ OpenAI classification failed:', error.message);
    }
    stats.errors++;
    
    // Fallback: basic keyword matching
    return fallbackClassification(text);
  }
}

/**
 * Fallback classification using keywords
 */
function fallbackClassification(text) {
  const lowerText = text.toLowerCase();
  
  // Service detection
  const serviceKeywords = {
    'Plumbing': ['plumb', 'pipe', 'leak', 'drain', 'toilet', 'faucet', 'water heater'],
    'Electrical': ['electric', 'wire', 'outlet', 'breaker', 'light', 'fixture'],
    'HVAC': ['hvac', 'air condition', 'ac', 'heating', 'furnace', 'thermostat'],
    'Roofing': ['roof', 'shingle', 'gutter', 'leak'],
    'Carpentry': ['carpent', 'wood', 'cabinet', 'deck', 'fence'],
    'Painting': ['paint', 'drywall', 'wall'],
    'House Cleaning': ['clean', 'maid', 'housekeep'],
    'Junk Removal': ['junk', 'trash', 'haul', 'remove'],
  };
  
  let service = 'Other';
  let maxMatches = 0;
  
  for (const [svc, keywords] of Object.entries(serviceKeywords)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      service = svc;
    }
  }
  
  // Urgency detection
  let urgency = 'Flexible';
  if (lowerText.includes('emergency') || lowerText.includes('urgent') || lowerText.includes('asap')) {
    urgency = 'Same day';
  } else if (lowerText.includes('soon') || lowerText.includes('quickly')) {
    urgency = 'Within 48 hours';
  } else if (lowerText.includes('this week')) {
    urgency = 'This week';
  }
  
  return {
    service,
    city: null,
    urgency,
    confidence: maxMatches > 0 ? 40 : 20
  };
}

/**
 * Find matching pros within radius
 */
async function findMatchingPros(service, location, radiusMiles = 30) {
  try {
    if (!location || !location.coordinates || location.coordinates[0] === 0) {
      console.warn('[LEAD_HUNTER] ⚠️ No valid location for pro matching');
      return [];
    }

    const [lng, lat] = location.coordinates;
    
    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusMeters = radiusMiles * 1609.34;
    
    // Normalize service name for matching
    const normalizedService = service.toLowerCase().replace(/\s+/g, '');
    
    const pros = await Pro.find({
      isActive: true,
      paymentStatus: { $in: ['active', 'trial'] },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusMeters
        }
      },
      $or: [
        { trade: service },
        { trade: normalizedService },
        { trade: 'General Repairs' },
        { trade: 'general' }
      ]
    }).limit(10);
    
    return pros;
  } catch (error) {
    console.error('[LEAD_HUNTER] ❌ Error finding matching pros:', error.message);
    return [];
  }
}

/**
 * Send SMS notification to pro
 */
async function notifyPro(pro, lead) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[LEAD_HUNTER] ⚠️ Twilio not configured, skipping SMS');
    return false;
  }

  try {
    const message = `🔔 New Fixlo Lead!\n\nService: ${lead.trade}\nLocation: ${lead.city || lead.address}\nUrgency: ${lead.urgency}\n\nLog in to view details.`;
    
    // Wrap in timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Twilio SMS timeout')), 10000)
    );
    
    const smsPromise = sendSMS(pro.phone, message);
    await Promise.race([smsPromise, timeoutPromise]);
    
    console.log(`[LEAD_HUNTER] ✅ SMS sent to ${pro.name}`);
    return true;
  } catch (error) {
    if (error.message === 'Twilio SMS timeout') {
      console.error(`[LEAD_HUNTER] ⏱️ SMS timeout to ${pro.name}`);
    } else {
      console.error(`[LEAD_HUNTER] ❌ Failed to send SMS to ${pro.name}:`, error.message);
    }
    // Don't increment stats.errors for SMS failures - not critical
    return false;
  }
}

/**
 * Process and save AI-generated lead
 */
async function processLead(leadData) {
  const { source, text, location } = leadData;
  
  // Check for duplicates
  if (isDuplicate(source, text)) {
    console.log('[LEAD_HUNTER] ⏭️ Duplicate lead detected, skipping');
    return null;
  }
  
  // Classify with AI
  console.log('[LEAD_HUNTER] 🤖 Classifying lead with AI...');
  const classification = await classifyLead(text);
  
  // Skip low-confidence leads
  if (classification.confidence < 30) {
    console.log(`[LEAD_HUNTER] ⏭️ Low confidence (${classification.confidence}), skipping`);
    return null;
  }
  
  // Create lead in database
  const newLead = new JobRequest({
    trade: classification.service,
    description: text,
    urgency: classification.urgency,
    city: classification.city,
    location: location || { type: 'Point', coordinates: [0, 0] },
    source: 'AI_DIAGNOSED',
    aiQualified: true,
    priority: classification.urgency === 'Same day' ? 'HIGH' : 
              classification.urgency === 'Within 48 hours' ? 'MEDIUM' : 'LOW',
    // Placeholder contact info (would come from real source)
    name: 'AI Lead',
    email: 'lead@fixloapp.com',
    phone: '+10000000000',
    address: classification.city || 'Unknown',
    termsAccepted: true,
    smsConsent: true
  });
  
  await newLead.save();
  stats.leadsGenerated++;
  
  console.log(`[LEAD_HUNTER] ✅ Lead created: ${classification.service} in ${classification.city || 'Unknown'} (${classification.confidence}% confidence)`);
  
  // Find and notify matching pros
  const matchingPros = await findMatchingPros(classification.service, location);
  console.log(`[LEAD_HUNTER] 📍 Found ${matchingPros.length} matching pros`);
  
  for (const pro of matchingPros) {
    await notifyPro(pro, newLead);
  }
  
  return {
    leadId: newLead._id,
    service: classification.service,
    city: classification.city,
    confidence: classification.confidence,
    prosNotified: matchingPros.length
  };
}

/**
 * Main execution - hunt for leads
 * This would typically pull from external sources (scraping, APIs, etc.)
 * For now, it's a placeholder that can be extended
 */
async function huntLeads() {
  if (stats.running) {
    console.log('[LEAD_HUNTER] ⏳ Already running, skipping...');
    return {
      success: false,
      leadsProcessed: 0,
      message: 'Already running',
      skipped: true
    };
  }
  
  stats.running = true;
  stats.lastRun = new Date();
  let leadsProcessed = 0;
  
  try {
    // TODO: Implement actual lead source integration
    // Examples:
    // - Pull from external APIs (HomeAdvisor, Thumbtack, etc.)
    // - Scrape job boards
    // - Process email leads
    // - Social media monitoring
    
    // For now, just log that we're ready
    console.log('[LEAD_HUNTER] ℹ️ Lead source integration not yet configured');
    console.log('[LEAD_HUNTER] ℹ️ Service ready for external lead ingestion');
    
    return {
      success: true,
      leadsProcessed: leadsProcessed,
      message: 'Ready for lead sources',
      errors: 0
    };
    
  } catch (error) {
    console.error('[LEAD_HUNTER] ❌ Error:', error.message);
    stats.errors++;
    
    // Return error but don't throw - keep cron running
    return {
      success: false,
      leadsProcessed: 0,
      message: error.message,
      errors: 1
    };
  } finally {
    stats.running = false;
  }
}

/**
 * Get current health status
 */
function getHealth() {
  return {
    running: stats.running,
    lastRun: stats.lastRun,
    leadsGenerated: stats.leadsGenerated,
    errors: stats.errors,
    openaiConfigured: !!openai,
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  };
}

/**
 * Get recent AI-generated leads
 */
async function getRecentLeads(limit = 50) {
  try {
    const leads = await JobRequest.find({
      source: 'AI_DIAGNOSED',
      aiQualified: true
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('trade city description urgency priority createdAt aiDiagnosis');
    
    return leads;
  } catch (error) {
    console.error('[LEAD_HUNTER] ❌ Error fetching recent leads:', error.message);
    return [];
  }
}

/**
 * Reset stats (for testing)
 */
function resetStats() {
  stats.leadsGenerated = 0;
  stats.errors = 0;
  console.log('[LEAD_HUNTER] 📊 Stats reset');
}

module.exports = {
  huntLeads,
  processLead,
  classifyLead,
  getHealth,
  getRecentLeads,
  resetStats
};
