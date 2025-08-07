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
      console.error("❌ OpenAI API key not configured - providing fallback response");
      
      // Provide helpful fallback responses based on common keywords
      const lowerMessage = message.toLowerCase();
      let fallbackResponse = "Thank you for your question! While our AI assistant is temporarily unavailable, here's some general guidance:\n\n";
      
      if (lowerMessage.includes('plumbing') || lowerMessage.includes('leak') || lowerMessage.includes('pipe')) {
        fallbackResponse += "For plumbing issues:\n• Turn off water supply if there's a leak\n• For minor clogs, try a plunger first\n• Complex plumbing work should be done by licensed professionals\n• Contact our verified plumbers through Fixlo for reliable service";
      } else if (lowerMessage.includes('electrical') || lowerMessage.includes('wire') || lowerMessage.includes('outlet')) {
        fallbackResponse += "For electrical issues:\n• Never work on electrical systems without proper training\n• Turn off power at the breaker for safety\n• Hire a licensed electrician for all electrical work\n• Contact our verified electricians through Fixlo for safe, professional service";
      } else if (lowerMessage.includes('hvac') || lowerMessage.includes('heating') || lowerMessage.includes('cooling')) {
        fallbackResponse += "For HVAC issues:\n• Check and replace air filters regularly\n• Ensure vents are not blocked\n• For complex repairs, hire certified HVAC professionals\n• Contact our verified HVAC specialists through Fixlo";
      } else {
        fallbackResponse += "For any home improvement project:\n• Plan carefully and get multiple quotes\n• Check if permits are required\n• For safety-critical work (electrical, plumbing, structural), always hire licensed professionals\n• Browse our network of verified professionals on Fixlo for reliable service";
      }
      
      fallbackResponse += "\n\nFor personalized assistance, please contact our support team or browse our directory of verified professionals.";
      
      return res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        source: "fallback"
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
