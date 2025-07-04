const mongoose = require("mongoose");

const JobRequestSchema = new mongoose.Schema({
  trade: {
    type: String,
    required: [true, 'Trade is required'],
    enum: {
      values: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Roofing'],
      message: 'Trade must be one of: Plumbing, Electrical, Carpentry, Painting, HVAC, Roofing'
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
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed', 'cancelled'],
    default: 'pending'
  },
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

module.exports = mongoose.model("JobRequest", JobRequestSchema);
