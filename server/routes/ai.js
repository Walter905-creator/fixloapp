const express = require("express");
const axios = require("axios");
const router = express.Router();

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

🔌 **Always hire a licensed electrician for:**
• Installing new outlets, switches, or fixtures
• Upgrading electrical panels or wiring
• Any work involving breaker boxes
• Installing ceiling fans or chandeliers
• Troubleshooting electrical problems
• Any work requiring permits

⚡ **Safety first:**
• Never work on live electrical systems
• Turn off power at the breaker before any work
• If you smell burning or see sparks, call immediately
• Electrical work can be deadly - when in doubt, hire a pro

💡 **Simple DIY tasks:**
• Changing light bulbs and basic fixtures (with power off)
• Replacing outlet covers or switch plates
• Testing GFCI outlets with test/reset buttons

🔧 **Find verified electricians on Fixlo for safe, professional electrical work.**`
        },
        plumbing: {
          keywords: ['plumbing', 'plumber', 'leak', 'pipe', 'water', 'drain', 'toilet', 'faucet', 'sink', 'shower', 'bathtub', 'sewer', 'clog'],
          response: `**Plumbing guidance:**

🚰 **When to call a plumber:**
• Major leaks or burst pipes
• Sewer line problems
• Water heater issues
• Installing new fixtures
• Persistent clogs that won't clear
• No water pressure throughout house

🔧 **Emergency steps:**
• Turn off main water supply for major leaks
• Turn off water heater if no hot water
• Use toilet plunger for simple clogs
• Check water heater pilot light (gas models)

🛠️ **DIY-friendly tasks:**
• Unclogging minor drain blockages
• Replacing toilet flappers
• Fixing running toilets
• Changing faucet aerators

💧 **Find reliable plumbers on Fixlo for all your plumbing needs.**`
        },
        hvac: {
          keywords: ['hvac', 'heating', 'cooling', 'furnace', 'air conditioning', 'ac', 'heat pump', 'thermostat', 'ductwork', 'ventilation'],
          response: `**HVAC system guidance:**

🌡️ **When to call an HVAC professional:**
• No heating or cooling at all
• Strange noises or burning smells
• Installing new systems
• Ductwork repairs or installation
• Refrigerant leaks
• Annual maintenance and tune-ups

🔧 **Before calling a pro:**
• Check and replace air filters (monthly)
• Ensure vents aren't blocked
• Check thermostat settings and batteries
• Clear debris around outdoor units

❄️ **Seasonal maintenance:**
• Spring: AC tune-up before summer
• Fall: Furnace inspection before winter
• Keep outdoor units clean and clear

🏠 **Connect with certified HVAC specialists through Fixlo.**`
        },
        roofing: {
          keywords: ['roof', 'roofing', 'shingle', 'gutter', 'leak', 'attic', 'skylight', 'chimney'],
          response: `**Roofing guidance:**

🏠 **Always hire professionals for:**
• Any roof repairs or replacement
• Working on steep or high roofs
• Structural damage assessment
• Installing skylights or vents
• Major gutter work

⚠️ **Safety warning:**
• Roof work is extremely dangerous
• Falls can be fatal
• Leave it to insured professionals

🔍 **Signs you need a roofer:**
• Missing or damaged shingles
• Water stains on ceilings
• Granules in gutters
• Sagging roof areas

🛡️ **Find insured roofing contractors on Fixlo.**`
        },
        painting: {
          keywords: ['paint', 'painting', 'primer', 'brush', 'roller', 'color', 'wall', 'ceiling', 'exterior'],
          response: `**Painting project guidance:**

🎨 **DIY-friendly painting:**
• Interior walls and ceilings
• Small exterior touch-ups
• Furniture and cabinets
• Preparation and priming

🏠 **Consider hiring professionals for:**
• Exterior house painting
• High ceilings or hard-to-reach areas
• Lead paint removal (pre-1978 homes)
• Specialty finishes or textures

📋 **Preparation is key:**
• Clean and sand surfaces
• Use quality primer
• Protect floors and furniture
• Choose appropriate paint type

🖌️ **Find skilled painters on Fixlo for professional results.**`
        },
        carpentry: {
          keywords: ['carpentry', 'carpenter', 'wood', 'cabinet', 'deck', 'trim', 'molding', 'framing', 'handyman'],
          response: `**Carpentry and handyman guidance:**

🔨 **Professional carpentry projects:**
• Custom cabinets and built-ins
• Deck construction
• Structural framing
• Complex trim work
• Kitchen renovations

🛠️ **Handyman-friendly tasks:**
• Simple shelving installation
• Basic trim repairs
• Minor deck maintenance
• Furniture assembly

📏 **Planning tips:**
• Measure twice, cut once
• Use quality materials
• Check local building codes
• Plan for proper ventilation

🏗️ **Find skilled carpenters and handymen on Fixlo.**`
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

🏠 **Always hire professionals for:**
• Electrical work (safety hazard)
• Major plumbing (water damage risk)
• Structural work (building integrity)
• HVAC systems (complex systems)
• Roofing (safety + expertise needed)

🛠️ **DIY-friendly projects:**
• Painting interior walls
• Simple landscaping
• Minor repairs and maintenance
• Installing basic fixtures (with power off)
• Cleaning and organizing

💡 **Decision factors:**
• Safety requirements
• Tool/skill requirements
• Permit needs
• Insurance considerations
• Time and complexity

🔧 **Browse Fixlo's network of verified professionals for any project requiring expertise.**`;
        } else if (isHowQuestion) {
          fallbackResponse = `**Home improvement project planning:**

📋 **Before starting any project:**
• Research the scope and requirements
• Check if permits are needed
• Get multiple quotes for professional work
• Understand safety requirements
• Plan for unexpected issues

🔍 **Research steps:**
• Watch tutorials for DIY projects
• Read manufacturer instructions
• Understand local building codes
• Consider seasonal timing

💰 **Budgeting tips:**
• Add 20% buffer for unexpected costs
• Factor in tool rentals/purchases
• Compare DIY vs professional costs
• Consider time investment

🏠 **Find trusted professionals on Fixlo for guidance and quality work.**`;
        } else {
          fallbackResponse = `**Home improvement guidance:**

🏠 **Popular home projects:**
• Kitchen and bathroom updates
• Painting and decorating
• Flooring installation
• Electrical upgrades
• Plumbing improvements
• HVAC maintenance

🔧 **Getting started:**
• Define your project scope
• Set a realistic budget
• Research requirements and permits
• Decide DIY vs professional help
• Get multiple quotes

⚡ **Safety-critical work:**
Always hire licensed professionals for electrical, major plumbing, structural, and roofing work.

🎯 **Find the right professional:**
Browse Fixlo's verified network of home service professionals for reliable, quality work.`;
        }
      }
      
      fallbackResponse += "\n\n💬 **Need more specific help?** Contact our support team or browse our directory of verified professionals.";
      
      return res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        source: "enhanced_fallback"
      });
    }
    
    console.log(`🤖 AI Assistant query: "${message.substring(0, 100)}..."`);
    
    // Prepare system prompt for home improvement assistance
    const systemPrompt = `You are Fixlo's AI Assistant, a helpful expert in home improvement and maintenance. 

Your role:
- Provide practical, safe, and actionable home improvement advice
- Help users understand what type of professional they might need
- Explain common home maintenance tasks
- Suggest when DIY is appropriate vs when to hire a professional
- Always prioritize safety and recommend professionals for complex electrical, plumbing, or structural work

Guidelines:
- Keep responses concise but helpful (under 300 words)
- Use a friendly, professional tone
- Include safety warnings when appropriate
- Suggest Fixlo professionals when relevant
- If unsure about something, recommend consulting a professional`;

    const userPrompt = context ? 
      `Context: ${context}\n\nQuestion: ${message}` : 
      message;
    
    // Call OpenAI API
    const openaiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
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
    
    console.log(`✅ AI Assistant response generated (${aiResponse.length} characters)`);
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ AI Assistant error:", error.message);
    
    // Handle specific OpenAI API errors
    if (error.response && error.response.status === 401) {
      return res.status(503).json({
        success: false,
        error: "AI assistant authentication failed",
        fallback: "Please contact our support team for assistance."
      });
    }
    
    if (error.response && error.response.status === 429) {
      return res.status(503).json({
        success: false,
        error: "AI assistant is currently busy. Please try again in a moment.",
        fallback: "You can also browse our how-it-works page or contact support."
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      error: "AI assistant is temporarily unavailable",
      fallback: "Please contact our support team for assistance with your home improvement questions."
    });
  }
});

module.exports = router;
