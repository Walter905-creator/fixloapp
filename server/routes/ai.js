const express = require("express");
const axios = require("axios");
const router = express.Router();

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
      console.error("❌ OpenAI API key not configured");
      return res.status(503).json({
        success: false,
        error: "AI assistant is temporarily unavailable",
        fallback: "Please contact our support team for assistance with your home improvement questions."
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
