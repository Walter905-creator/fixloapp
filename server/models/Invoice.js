const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  jobRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  serviceAddress: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  // Labor Details
  laborHours: {
    type: Number,
    required: true,
    min: 2 // 2-hour minimum
  },
  laborRate: {
    type: Number,
    default: 150
  },
  laborCost: {
    type: Number,
    required: true
  },
  // Materials
  materials: [{
    description: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      required: true
    }
  }],
  materialsCost: {
    type: Number,
    default: 0
  },
  // Visit Fee
  visitFee: {
    type: Number,
    default: 150
  },
  visitFeeWaived: {
    type: Boolean,
    default: false
  },
  // Totals
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  // Payment
  stripeChargeId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Generate invoice number
InvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
