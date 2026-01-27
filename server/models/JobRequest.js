const mongoose = require("mongoose");

const JobRequestSchema = new mongoose.Schema({
  trade: {
    type: String,
    required: [true, 'Trade is required'],
    enum: {
      values: ['General Repairs', 'Electrical', 'Plumbing', 'Drywall', 'Painting', 'Flooring', 'Carpentry', 'HVAC', 'Roofing', 'House Cleaning', 'Junk Removal', 'Other'],
      message: 'Trade must be a valid service type'
    }
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxLength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zip: {
    type: String,
    trim: true
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minLength: [20, 'Description must be at least 20 characters'],
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  urgency: {
    type: String,
    enum: ['Same day', 'Within 48 hours', 'This week', 'Flexible'],
    default: 'Flexible'
  },
  photos: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Payment & Stripe
  paymentProvider: {
    type: String,
    enum: ['stripe', 'apple_pay'],
    default: 'stripe'
  },
  stripeCustomerId: {
    type: String,
    trim: true
  },
  stripePaymentMethodId: {
    type: String,
    trim: true
  },
  stripePaymentIntentId: {
    type: String,
    trim: true
  },
  applePayToken: {
    type: String,
    trim: true
  },
  applePayTransactionId: {
    type: String,
    trim: true
  },
  visitFeeAuthorized: {
    type: Boolean,
    default: false
  },
  visitFeeWaived: {
    type: Boolean,
    default: false
  },
  jobApproved: {
    type: Boolean,
    default: false
  },
  // Payment authorization tracking
  paymentStatus: {
    type: String,
    enum: ['none', 'authorized', 'captured', 'released', 'failed'],
    default: 'none'
  },
  paymentAuthorizedAt: {
    type: Date
  },
  paymentCapturedAt: {
    type: Date
  },
  paymentReleasedAt: {
    type: Date
  },
  paymentCapturedBy: {
    type: String, // Admin user email
    trim: true
  },
  paymentReleasedBy: {
    type: String, // Admin user email
    trim: true
  },
  // Clock in/out tracking
  clockInTime: {
    type: Date
  },
  clockInLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] } // [lng, lat]
  },
  clockOutTime: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0
  },
  // Billing
  laborCost: {
    type: Number,
    default: 0
  },
  materials: [{
    description: String,
    cost: Number
  }],
  materialsCost: {
    type: Number,
    default: 0
  },
  visitFee: {
    type: Number,
    default: 150
  },
  totalCost: {
    type: Number,
    default: 0
  },
  invoiceId: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  // Agreement
  termsAccepted: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: {
    type: Date
  },
  // SMS & Compliance
  smsConsent: {
    type: Boolean,
    default: false
  },
  smsConsentAt: {
    type: Date
  },
  smsOptOut: {
    type: Boolean,
    default: false
  },
  smsOptOutAt: {
    type: Date
  },
  pricingAcceptance: {
    type: Boolean,
    default: false
  },
  pricingAcceptanceAt: {
    type: Date
  },
  estimateFeeWaiverAcknowledged: {
    type: Boolean,
    default: false
  },
  estimateFeeWaiverAt: {
    type: Date
  },
  paymentAuthConsent: {
    type: Boolean,
    default: false
  },
  paymentAuthConsentAt: {
    type: Date
  },
  // Scheduling
  scheduledDate: {
    type: Date
  },
  scheduledTime: {
    type: String,
    trim: true
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro'
  },
  assignedAt: {
    type: Date
  },
  // Priority Pro Routing (Charlotte, NC)
  priorityNotified: {
    type: Boolean,
    default: false
  },
  priorityPro: {
    type: String,
    trim: true
  },
  priorityProPhone: {
    type: String,
    trim: true
  },
  priorityNotifiedAt: {
    type: Date
  },
  priorityAcceptedAt: {
    type: Date
  },
  // Customer reference
  customerId: {
    type: String,
    trim: true
  },
  // AI Diagnosis Metadata
  source: {
    type: String,
    enum: ['MANUAL', 'AI_DIAGNOSED'],
    default: 'MANUAL'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  aiQualified: {
    type: Boolean,
    default: false
  },
  aiDiagnosis: {
    issue: String,
    difficulty: Number,
    riskLevel: String,
    diyAllowed: Boolean,
    steps: [String],
    stopConditions: [String]
  },
  aiImages: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Create indexes for better performance
JobRequestSchema.index({ trade: 1, createdAt: -1 });
JobRequestSchema.index({ status: 1, createdAt: -1 });
JobRequestSchema.index({ assignedTo: 1, createdAt: -1 }); // For Pro leads query

// Create 2dsphere index for geospatial queries
JobRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("JobRequest", JobRequestSchema);
