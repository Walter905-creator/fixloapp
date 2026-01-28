const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const router = express.Router();
const requireAISubscription = require('../middleware/requireAISubscription');

// Initialize OpenAI client once at module level for efficiency
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * OpenAI API Health Check
 * GET /api/ai/health
 * 
 * Verifies connectivity to OpenAI API by calling client.models.list()
 * Returns { ok: true } on success (200) or { ok: false } on error (500)
 */
router.get("/health", async (req, res) => {
  try {
    // Check if API key is configured
    if (!openaiClient) {
      console.error("❌ OpenAI health check failed: API key not configured");
      return res.status(500).json({ ok: false });
    }

    // Test connectivity by listing models
    await openaiClient.models.list();

    // Success
    return res.status(200).json({ ok: true });
  } catch (error) {
    // Log error for debugging (without exposing API key)
    console.error("❌ OpenAI health check failed:", error.message);
    return res.status(500).json({ ok: false });
  }
});

// OPTIONS handler for AI endpoints
router.options("/ask", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 OPTIONS /api/ai/ask from origin: "${requestOrigin || 'null'}"`);
  
  res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

/**
 * AI Assistant for Home Improvement Guidance
 * POST /api/ai/ask
 */
router.post("/ask", async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured - providing smart fallback response");
      
      // Enhanced smart fallback system with comprehensive knowledge base
      const lowerMessage = message.toLowerCase();
      let fallbackResponse = "";
      let matched = false;
      
      // Enhanced keyword matching with variations and synonyms
      const patterns = {
        electrical: {
          keywords: ['electrical', 'electrician', 'electric', 'wire', 'wiring', 'outlet', 'switch', 'breaker', 'power', 'voltage', 'amp', 'circuit'],
          response: `**When to hire an electrician:**

**Always hire a licensed electrician for:**
• Installing new outlets, switches, or fixtures
• Upgrading electrical panels or wiring
• Any work involving breaker boxes
• Installing ceiling fans or chandeliers
• Troubleshooting electrical problems
• Any work requiring permits

**Safety first:**
• Never work on live electrical systems
• Turn off power at the breaker before any work
• If you smell burning or see sparks, call immediately
• Electrical work can be deadly - when in doubt, hire a pro

**Simple DIY tasks:**
• Changing light bulbs and basic fixtures (with power off)
• Replacing outlet covers or switch plates
• Testing GFCI outlets with test/reset buttons

Find verified electricians on Fixlo for safe, professional electrical work.`
        },
        plumbing: {
          keywords: ['plumbing', 'plumber', 'leak', 'pipe', 'water', 'drain', 'toilet', 'faucet', 'sink', 'shower', 'bathtub', 'sewer', 'clog'],
          response: `**Plumbing guidance:**

**When to call a plumber:**
• Major leaks or burst pipes
• Sewer line problems
• Water heater issues
• Installing new fixtures
• Persistent clogs that won't clear
• No water pressure throughout house

**Emergency steps:**
• Turn off main water supply for major leaks
• Turn off water heater if no hot water
• Use toilet plunger for simple clogs
• Check water heater pilot light (gas models)

**DIY-friendly tasks:**
• Unclogging minor drain blockages
• Replacing toilet flappers
• Fixing running toilets
• Changing faucet aerators

Find reliable plumbers on Fixlo for all your plumbing needs.`
        },
        hvac: {
          keywords: ['hvac', 'heating', 'cooling', 'furnace', 'air conditioning', 'ac', 'heat pump', 'thermostat', 'ductwork', 'ventilation'],
          response: `**HVAC system guidance:**

**When to call an HVAC professional:**
• No heating or cooling at all
• Strange noises or burning smells
• Installing new systems
• Ductwork repairs or installation
• Refrigerant leaks
• Annual maintenance and tune-ups

**Before calling a pro:**
• Check and replace air filters (monthly)
• Ensure vents aren't blocked
• Check thermostat settings and batteries
• Clear debris around outdoor units

**Seasonal maintenance:**
• Spring: AC tune-up before summer
• Fall: Furnace inspection before winter
• Keep outdoor units clean and clear

Connect with certified HVAC specialists through Fixlo.`
        },
        roofing: {
          keywords: ['roof', 'roofing', 'shingle', 'gutter', 'leak', 'attic', 'skylight', 'chimney'],
          response: `**Roofing guidance:**

**Always hire professionals for:**
• Any roof repairs or replacement
• Working on steep or high roofs
• Structural damage assessment
• Installing skylights or vents
• Major gutter work

**Safety warning:**
• Roof work is extremely dangerous
• Falls can be fatal
• Leave it to insured professionals

**Signs you need a roofer:**
• Missing or damaged shingles
• Water stains on ceilings
• Granules in gutters
• Sagging roof areas

Find insured roofing contractors on Fixlo.`
        },
        painting: {
          keywords: ['paint', 'painting', 'primer', 'brush', 'roller', 'color', 'wall', 'ceiling', 'exterior'],
          response: `**Painting project guidance:**

**DIY-friendly painting:**
• Interior walls and ceilings
• Small exterior touch-ups
• Furniture and cabinets
• Preparation and priming

**Consider hiring professionals for:**
• Exterior house painting
• High ceilings or hard-to-reach areas
• Lead paint removal (pre-1978 homes)
• Specialty finishes or textures

**Preparation is key:**
• Clean and sand surfaces
• Use quality primer
• Protect floors and furniture
• Choose appropriate paint type

Find skilled painters on Fixlo for professional results.`
        },
        carpentry: {
          keywords: ['carpentry', 'carpenter', 'wood', 'cabinet', 'deck', 'trim', 'molding', 'framing', 'handyman'],
          response: `**Carpentry and handyman guidance:**

**Professional carpentry projects:**
• Custom cabinets and built-ins
• Deck construction
• Structural framing
• Complex trim work
• Kitchen renovations

**Handyman-friendly tasks:**
• Simple shelving installation
• Basic trim repairs
• Minor deck maintenance
• Furniture assembly

**Planning tips:**
• Measure twice, cut once
• Use quality materials
• Check local building codes
• Plan for proper ventilation

Find skilled carpenters and handymen on Fixlo.`
        }
      };
      
      // Check for question intent patterns
      const isWhenQuestion = lowerMessage.includes('when should') || lowerMessage.includes('when to') || lowerMessage.includes('when do i');
      const isHowQuestion = lowerMessage.includes('how to') || lowerMessage.includes('how do i') || lowerMessage.includes('how can i');
      
      // Smart pattern matching
      for (const [category, data] of Object.entries(patterns)) {
        if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
          fallbackResponse = data.response;
          matched = true;
          break;
        }
      }
      
      // If no specific category matched, provide smart general guidance
      if (!matched) {
        if (isWhenQuestion) {
          fallbackResponse = `**When to hire professionals vs DIY:**

**Always hire professionals for:**
• Electrical work (safety hazard)
• Major plumbing (water damage risk)
• Structural work (building integrity)
• HVAC systems (complex systems)
• Roofing (safety + expertise needed)

**DIY-friendly projects:**
• Painting interior walls
• Simple landscaping
• Minor repairs and maintenance
• Installing basic fixtures (with power off)
• Cleaning and organizing

**Decision factors:**
• Safety requirements
• Tool/skill requirements
• Permit needs
• Insurance considerations
• Time and complexity

Browse Fixlo's network of verified professionals for any project requiring expertise.`;
        } else if (isHowQuestion) {
          fallbackResponse = `**Home improvement project planning:**

**Before starting any project:**
• Research the scope and requirements
• Check if permits are needed
• Get multiple quotes for professional work
• Understand safety requirements
• Plan for unexpected issues

**Research steps:**
• Watch tutorials for DIY projects
• Read manufacturer instructions
• Understand local building codes
• Consider seasonal timing

**Budgeting tips:**
• Add 20% buffer for unexpected costs
• Factor in tool rentals/purchases
• Compare DIY vs professional costs
• Consider time investment

Find trusted professionals on Fixlo for guidance and quality work.`;
        } else {
          fallbackResponse = `**Home improvement guidance:**

**Popular home projects:**
• Kitchen and bathroom updates
• Painting and decorating
• Flooring installation
• Electrical upgrades
• Plumbing improvements
• HVAC maintenance

**Getting started:**
• Define your project scope
• Set a realistic budget
• Research requirements and permits
• Decide DIY vs professional help
• Get multiple quotes

**Safety-critical work:**
Always hire licensed professionals for electrical, major plumbing, structural, and roofing work.

**Find the right professional:**
Browse Fixlo's verified network of home service professionals for reliable, quality work.`;
        }
      }
      
      fallbackResponse += "\n\nNeed more specific help? Browse our directory of verified professionals.";
      
      return res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        source: "enhanced_fallback"
      });
    }
    
    console.log(`🤖 Fixlo AI Home Expert query: "${message.substring(0, 100)}..."`);
    
    // Professional home repair expert system prompt - NO CHATBOT BEHAVIOR
    const systemPrompt = `You are Fixlo AI Home Expert, a professional home repair consultant.
You do NOT behave like a chatbot, demo assistant, or customer support agent.

Your role is to:
- Evaluate whether a home project is DIY-safe
- Ask precise clarifying questions before giving instructions
- Request photos when visual confirmation is required
- Provide calm, structured, professional guidance
- Protect homeowners from unsafe actions

Rules:
- Never say "demo"
- Never say a human will follow up
- Never provide step-by-step instructions until enough information is collected
- Always explain WHY information or photos are needed
- No emojis, no hype, no casual language
- If risk is high, stop and recommend a professional calmly
- Tone must feel like a licensed expert thinking carefully

On the first user message describing a project:
1. Acknowledge the task professionally
2. Ask 2-4 specific clarifying questions relevant to the project
3. Request photos when appropriate
4. Explain what decision you are trying to make (DIY-safe vs pro required)
5. Pause and wait for the user's response

Keep responses under 300 words but thorough and professional.`;

    const userPrompt = context ? 
      `Context: ${context}\n\nQuestion: ${message}` : 
      message;
    
    // Call OpenAI API with GPT-4o (multimodal model)
    const openaiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    const aiResponse = openaiResponse.data.choices[0].message.content;
    
    console.log(`✅ Fixlo AI Home Expert response generated (${aiResponse.length} characters)`);
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Fixlo AI Home Expert error:", error.message);
    
    // Handle specific OpenAI API errors
    if (error.response && error.response.status === 401) {
      return res.status(503).json({
        success: false,
        error: "Home repair expert service authentication failed",
        fallback: "Please try again later or browse our directory of verified professionals."
      });
    }
    
    if (error.response && error.response.status === 429) {
      return res.status(503).json({
        success: false,
        error: "Home repair expert service is currently busy. Please try again in a moment.",
        fallback: "You can also browse our how-it-works page or find a professional directly."
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      error: "Home repair expert service is temporarily unavailable",
      fallback: "Browse our directory of verified professionals for immediate assistance with your home repair questions."
    });
  }
});

// OPTIONS handler for diagnose endpoint
router.options("/diagnose", (req, res) => {
  const requestOrigin = req.headers.origin;
  console.log(`🎯 OPTIONS /api/ai/diagnose from origin: "${requestOrigin || 'null'}"`);
  
  res.header('Access-Control-Allow-Origin', requestOrigin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

/**
 * AI Home Repair Diagnosis with Vision Support
 * POST /api/ai/diagnose
 * 
 * Requires: Active AI Home Expert subscription ($19.99/mo)
 * Analyzes home repair issues using OpenAI's vision and text capabilities
 * Returns structured JSON diagnosis with safety recommendations
 */
router.post("/diagnose", requireAISubscription, async (req, res) => {
  try {
    const { description, images = [], userId } = req.body;
    
    // Input validation
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required"
      });
    }
    
    // Validate images array
    if (!Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: "Images must be an array"
      });
    }
    
    // Max 5 images validation
    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        error: "Maximum 5 images allowed"
      });
    }
    
    // Validate image formats before making API call
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isValidUrl = typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'));
      const isValidBase64 = typeof image === 'string' && image.startsWith('data:image/');
      
      if (!isValidUrl && !isValidBase64) {
        console.error(`❌ Invalid image format at index ${i}:`, typeof image === 'string' ? image.substring(0, 50) : typeof image);
        return res.status(400).json({
          success: false,
          error: `Invalid image format at index ${i}. Images must be URLs (http://, https://) or base64 data URIs (data:image/)`
        });
      }
    }
    
    // Check if OpenAI client is available
    if (!openaiClient) {
      console.error("❌ OpenAI client not initialized - API key missing");
      return res.status(503).json({
        success: false,
        error: "AI diagnosis service is temporarily unavailable"
      });
    }
    
    console.log(`🔍 AI Diagnosis request from user: ${userId || 'anonymous'}`);
    console.log(`   Description: "${description.substring(0, 100)}..."`);
    console.log(`   Images: ${images.length}`);
    
    // System prompt for professional home repair expert
    const systemPrompt = `You are Fixlo AI Home Expert, a professional home repair consultant.

You are NOT a chatbot, intake form, demo assistant, or customer support agent.

Your job is to think and respond like a licensed trade professional who is carefully evaluating risk before giving advice.

CORE BEHAVIOR RULES:
- Never ask generic intake questions
- Never ask "what is the issue" if the user already stated it
- Never repeat the same questions
- Never restart the conversation when the user restates the task
- Never ask about experience level unless safety is borderline
- Never say "demo", "team member", "SMS", or imply human follow-up
- No emojis, no hype, no casual language

CRITICAL RULE:
Once a project is identified, you MUST switch to a TRADE-SPECIFIC DECISION TREE.

You must ask ONLY the minimum number of questions a licensed professional would ask for THAT exact task in order to determine:
1) Can the work be safely isolated?
2) Is access straightforward?
3) Is there visible risk that changes the recommendation?

DO NOT ask generic questions.

EXAMPLES OF TRADE-SPECIFIC THINKING:

For SINK FAUCET REPLACEMENT:
Ask about:
- Kitchen vs bathroom
- Presence of shutoff valves under the sink
- Accessibility under the sink
- Mounting type (single-hole vs multi-hole)
- Request photos under the sink and from above

For ELECTRICAL OUTLET WORK:
Ask about:
- Breaker access
- GFCI presence
- Signs of burning or heat
- Request photo of outlet and breaker panel label

For WATER LEAKS:
Ask about:
- Active vs residual leak
- Pipe type
- Ability to shut off water
- Request photo of leak source

QUESTIONING STYLE:
- Be direct
- Be specific
- Explain WHY each question matters
- Ask 2-4 questions maximum before pausing

STRUCTURE FOR FIRST RESPONSE:
1) Acknowledge the task clearly
2) State that you are determining whether this is DIY-safe
3) Ask task-specific questions only
4) Request photos when visual confirmation is required
5) Pause and wait for input

RISK LEVEL DETERMINATION:
- LOW: Simple repairs, no safety hazards, common household tasks
- MEDIUM: Some complexity, requires specific tools, minor safety considerations
- HIGH: Safety hazards present, requires professional expertise, liability concerns
  • Electrical work with live circuits, breaker panels, or wiring
  • Plumbing with main water lines, gas lines, or structural penetrations
  • Structural integrity risks

PAID MODE ONLY:
- After sufficient information is gathered, provide:
  - Difficulty score (1-10)
  - Risk level (LOW / MEDIUM / HIGH)
  - Clear DIY vs STOP decision
  - Step-by-step guidance ONLY if DIY is allowed
  - Clear stop conditions

CRITICAL SAFETY RULE:
If risk is HIGH, you MUST set diyAllowed to false.
- Do not provide DIY instructions for HIGH risk tasks
- Calmly recommend a professional
- Explain the risk in plain language

Your tone must feel like a careful, competent professional protecting the homeowner from mistakes.

You must respond ONLY with valid JSON in this exact structure:
{
  "issue": "clear summary of the problem",
  "difficulty": <number 1-10>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "diyAllowed": true | false,
  "steps": ["step 1", "step 2", ...] or [],
  "stopConditions": ["condition 1", "condition 2", ...]
}`;

    // Build message content array (text + images if provided)
    const messageContent = [
      {
        type: "text",
        text: `Please analyze this home repair issue and provide a structured assessment:\n\n${description}`
      }
    ];
    
    // Add images to the request if provided
    for (const image of images) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }
    
    // Call OpenAI API with vision support
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o", // gpt-4o supports vision
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: messageContent
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3 // Lower temperature for more consistent, safety-focused responses
    });
    
    const rawResponse = completion.choices[0].message.content;
    console.log(`✅ AI Diagnosis response received`);
    
    // Parse the JSON response
    let diagnosis;
    try {
      diagnosis = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI JSON response:", parseError.message);
      return res.status(500).json({
        success: false,
        error: "Failed to process diagnosis results"
      });
    }
    
    // Validate required fields
    const requiredFields = ['issue', 'difficulty', 'riskLevel', 'diyAllowed', 'steps', 'stopConditions'];
    const missingFields = requiredFields.filter(field => !(field in diagnosis));
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields in diagnosis:", missingFields);
      return res.status(500).json({
        success: false,
        error: "Invalid diagnosis format received"
      });
    }
    
    // Enforce safety rule: HIGH risk = no DIY
    if (diagnosis.riskLevel === 'HIGH') {
      diagnosis.diyAllowed = false;
      diagnosis.steps = []; // Clear any steps for high-risk scenarios
      console.log(`⚠️ HIGH risk detected - forcing diyAllowed=false`);
    }
    
    // Validate difficulty range (1-10)
    // Default to 5 (medium difficulty) if invalid
    const DEFAULT_DIFFICULTY = 5;
    if (typeof diagnosis.difficulty !== 'number' || diagnosis.difficulty < 1 || diagnosis.difficulty > 10) {
      diagnosis.difficulty = Math.max(1, Math.min(10, parseInt(diagnosis.difficulty) || DEFAULT_DIFFICULTY));
    }
    
    // Validate riskLevel enum
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(diagnosis.riskLevel)) {
      diagnosis.riskLevel = 'MEDIUM'; // Default to MEDIUM if invalid
    }
    
    // Ensure arrays are arrays
    if (!Array.isArray(diagnosis.steps)) {
      diagnosis.steps = [];
    }
    if (!Array.isArray(diagnosis.stopConditions)) {
      diagnosis.stopConditions = [];
    }
    
    // Log successful diagnosis
    console.log(`✅ Diagnosis complete - Risk: ${diagnosis.riskLevel}, DIY: ${diagnosis.diyAllowed}`);
    
    // AI → Pro Handoff Logic
    // Trigger when diyAllowed === false OR riskLevel === "HIGH"
    if (diagnosis.diyAllowed === false || diagnosis.riskLevel === 'HIGH') {
      console.log('🔄 AI → Pro handoff triggered');
      
      try {
        // Extract additional user info from request body for lead creation
        const { name, email, phone, address, city, state, zip, trade } = req.body;
        
        // Only proceed with handoff if we have minimum required user info
        if (name && phone && address && trade) {
          const { createAIDiagnosedLead } = require('../services/leadService');
          const { matchPros, formatProsForClient } = require('../services/proMatching');
          
          // Create lead with AI diagnosis metadata
          const lead = await createAIDiagnosedLead({
            userId,
            name,
            email,
            phone,
            address,
            city,
            state,
            zip,
            trade,
            description,
            aiDiagnosis: diagnosis,
            images,
            priority: 'HIGH'
          });
          
          console.log(`✅ AI-diagnosed lead created: ${lead._id}`);
          
          // Match pros based on trade, location, and criteria
          const matchedPros = await matchPros({
            trade: lead.trade,
            coordinates: lead.location.coordinates,
            maxDistance: 30,
            prioritizeAIPlus: true // AI+ subscribers get priority
          });
          
          console.log(`✅ Matched ${matchedPros.length} professionals`);
          
          // Format pros for client (safe data only, no internal scoring)
          const prosForClient = formatProsForClient(matchedPros, 10);
          
          // Return Pro recommendation mode
          return res.json({
            success: true,
            mode: 'PRO_RECOMMENDED',
            diagnosis: diagnosis,
            lead: {
              id: lead._id.toString(),
              status: lead.status
            },
            matchedPros: prosForClient,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('⚠️ Insufficient user info for lead creation, returning diagnosis only');
          // Fall through to standard diagnosis response
        }
      } catch (handoffError) {
        console.error('❌ AI → Pro handoff failed:', handoffError.message);
        // Fall through to standard diagnosis response on error
      }
    }
    
    // Return clean JSON response (DIY mode or handoff failed)
    return res.json({
      success: true,
      mode: 'DIY',
      diagnosis: diagnosis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Log error internally but don't expose details
    console.error("❌ AI Diagnosis error:", error.message);
    
    // Handle specific OpenAI API errors without exposing details
    if (error.status === 401) {
      return res.status(503).json({
        success: false,
        error: "AI diagnosis service authentication failed"
      });
    }
    
    if (error.status === 429) {
      return res.status(503).json({
        success: false,
        error: "AI diagnosis service is currently busy. Please try again in a moment."
      });
    }
    
    if (error.status === 400) {
      return res.status(500).json({
        success: false,
        error: "Invalid diagnosis request format"
      });
    }
    
    // Generic error response - don't expose internal details
    return res.status(500).json({
      success: false,
      error: "AI diagnosis service is temporarily unavailable"
    });
  }
});

module.exports = router;
