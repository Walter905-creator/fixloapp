const mongoose = require('mongoose');

/**
 * PendingCheckout – Temporarily stores homeowner form data while the user
 * completes the $75 Charlotte Service Request Fee Stripe checkout.
 *
 * Documents expire automatically after 2 hours via the MongoDB TTL index.
 * Once the session is verified (paymentStatus === 'paid'), the document is
 * deleted and the real JobRequest is created.
 */
const PendingCheckoutSchema = new mongoose.Schema({
  stripeCheckoutSessionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Core request fields (mirrors the JobRequest shape we will eventually create)
  formData: {
    serviceType:  { type: String, trim: true },
    fullName:     { type: String, trim: true },
    phone:        { type: String, trim: true },
    email:        { type: String, trim: true },
    address:      { type: String, trim: true },
    city:         { type: String, trim: true },
    state:        { type: String, trim: true },
    zipCode:      { type: String, trim: true },
    details:      { type: String, trim: true },
    urgency:      { type: String, trim: true },
    smsConsent:   { type: Boolean, default: false }
  },
  // Track whether this session has already been used to create a JobRequest
  consumed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // TTL: 2 hours in seconds
  }
});

module.exports = mongoose.models.PendingCheckout ||
  mongoose.model('PendingCheckout', PendingCheckoutSchema);
