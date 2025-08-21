// server/routes/subscribe.js
const express = require("express");
const router = express.Router();

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.error("Stripe init error:", e.message);
}

/**
 * POST /api/subscribe/checkout
 * Body: { email, priceId }   // priceId optional if you set it in env
 * Returns: { url, sessionId }
 */
router.post("/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe is not configured" });
    }

    const { email, priceId } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });

    // Prefer explicit priceId from request; fall back to env
    const PRICE_ID =
      priceId ||
      process.env.STRIPE_FIRST_MONTH_PRICE_ID ||
      process.env.STRIPE_MONTHLY_PRICE_ID ||
      process.env.STRIPE_PRICE_ID;

    if (!PRICE_ID) {
      return res.status(500).json({ error: "No Stripe priceId configured" });
    }

    const clientUrl = process.env.CLIENT_URL || "https://www.fixloapp.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_email: email,
      success_url: `${clientUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel.html`,
      metadata: { source: "pro-signup", email, ts: new Date().toISOString() },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Checkout creation failed" });
  }
});

// Keep the legacy endpoint for backward compatibility
router.post('/', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  // Example: Store or forward to CRM/mailing list (stub only)
  console.log(`📩 New subscription: ${name} <${email}>`);

  res.json({ success: true, message: 'Subscription received successfully' });
});

module.exports = router;