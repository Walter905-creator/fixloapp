const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Invoice = require('../models/Invoice');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Initialize Stripe with validation
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Enforce Live Mode in production
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
      console.error("❌ SECURITY ERROR: Stripe LIVE secret key required in production");
      throw new Error("Stripe LIVE secret key required in production. Use sk_live_ keys only.");
    }
    
    // Validate test mode in non-production
    if (process.env.NODE_ENV !== "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
      console.error("❌ SECURITY ERROR: Live Stripe key detected in non-production environment");
      throw new Error("Stripe live key detected in non-production environment. Use sk_test_ keys only.");
    }
    
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    console.log('✅ Stripe initialized for service intake in', process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "TEST MODE" : "LIVE MODE");
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not found');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error.message);
  throw error;
}

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure multer for photo uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fixlo-service-requests',
    allowed_formats: ['jpg', 'jpeg', 'png', 'heic'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create Stripe Payment Intent (authorization only)
router.post('/payment-intent', async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured'
      });
    }

    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: name,
        phone: phone,
        metadata: {
          source: 'fixlo-service-intake'
        }
      });
    }

    // Create a Setup Intent to save payment method for later
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        type: 'service-visit-authorization',
        visit_fee: '150',
        email: email,
        source: 'fixlo-service-intake',
        timestamp: new Date().toISOString()
      }
    });

    // Audit log
    console.log(`✅ Setup intent created: ${setupIntent.id} for customer ${customer.id}`);

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customer.id
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    
    // Enhanced error handling for 401 and authentication issues
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Stripe API key. Ensure you are using the correct test mode key (sk_test_).',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error setting up payment authorization',
      error: error.message
    });
  }
});

// Submit service intake request
router.post('/submit', upload.array('photos', 5), async (req, res) => {
  try {
    const {
      serviceType,
      description,
      address,
      city,
      state,
      zip,
      urgency,
      name,
      email,
      phone,
      stripeCustomerId,
      stripePaymentMethodId,
      termsAccepted
    } = req.body;

    // Validate required fields
    if (!serviceType || !description || !address || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate Charlotte, NC area
    if (!city || !state || state.toUpperCase() !== 'NC' || !city.toLowerCase().includes('charlotte')) {
      return res.status(400).json({
        success: false,
        message: 'Service is only available in Charlotte, NC area'
      });
    }

    // Validate description length
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters'
      });
    }

    // Validate terms acceptance
    if (termsAccepted !== 'true' && termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the pricing terms to continue'
      });
    }

    // Get photo URLs from uploaded files
    const photoUrls = req.files ? req.files.map(file => file.path) : [];

    // Create job request
    const jobRequest = new JobRequest({
      trade: serviceType,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      description,
      urgency,
      photos: photoUrls,
      stripeCustomerId,
      stripePaymentMethodId,
      visitFeeAuthorized: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      status: 'pending'
    });

    await jobRequest.save();

    console.log(`✅ Service intake request created: ${jobRequest._id}`);

    res.json({
      success: true,
      message: 'Service request submitted successfully',
      jobId: jobRequest._id
    });

  } catch (error) {
    console.error('❌ Error submitting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting service request',
      error: error.message
    });
  }
});

// Clock in to a job (requires GPS location)
router.post('/clock-in/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { latitude, longitude, staffId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'GPS location is required for clock-in'
      });
    }

    const job = await JobRequest.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.clockInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in to this job'
      });
    }

    // TODO: Validate GPS location is near job address
    // For now, just save the location

    job.clockInTime = new Date();
    job.clockInLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    job.status = 'in-progress';
    await job.save();

    console.log(`✅ Clocked in to job ${jobId} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Clocked in successfully',
      clockInTime: job.clockInTime
    });

  } catch (error) {
    console.error('❌ Error clocking in:', error);
    res.status(500).json({
      success: false,
      message: 'Error clocking in',
      error: error.message
    });
  }
});

// Clock out and auto-bill
router.post('/clock-out/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { materials, jobApproved } = req.body;

    const job = await JobRequest.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (!job.clockInTime) {
      return res.status(400).json({
        success: false,
        message: 'Must clock in before clocking out'
      });
    }

    if (job.clockOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out of this job'
      });
    }

    // Calculate hours worked
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime - job.clockInTime) / (1000 * 60 * 60);
    
    // Enforce 2-hour minimum
    const billableHours = Math.max(hoursWorked, 2);
    const laborCost = billableHours * 150;

    // Calculate materials cost
    let materialsCost = 0;
    let materialsArray = [];
    if (materials && Array.isArray(materials)) {
      materialsArray = materials;
      materialsCost = materials.reduce((sum, item) => sum + (item.cost || 0), 0);
    }

    // Determine if visit fee is waived
    const visitFeeWaived = jobApproved === true || jobApproved === 'true';
    const visitFee = visitFeeWaived ? 0 : 150;

    // Calculate total
    const subtotal = laborCost + materialsCost + visitFee;
    const totalCost = subtotal;

    // Update job
    job.clockOutTime = clockOutTime;
    job.totalHours = billableHours;
    job.laborCost = laborCost;
    job.materials = materialsArray;
    job.materialsCost = materialsCost;
    job.visitFeeWaived = visitFeeWaived;
    job.jobApproved = visitFeeWaived;
    job.totalCost = totalCost;
    job.status = 'completed';

    await job.save();

    // Charge the customer via Stripe
    let chargeId = null;
    if (stripe && job.stripePaymentMethodId && job.stripeCustomerId) {
      // Prevent duplicate charges
      if (job.stripePaymentIntentId && job.paidAt) {
        console.log(`⚠️ Job ${jobId} already charged: ${job.stripePaymentIntentId}`);
        return res.status(400).json({
          success: false,
          message: 'This job has already been charged',
          invoiceNumber: job.invoiceId
        });
      }
      
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalCost * 100), // Convert to cents
          currency: 'usd',
          customer: job.stripeCustomerId,
          payment_method: job.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Fixlo service: ${job.trade} at ${job.address}`,
          metadata: {
            jobId: job._id.toString(),
            laborHours: billableHours.toFixed(2),
            laborCost: laborCost.toFixed(2),
            materialsCost: materialsCost.toFixed(2),
            visitFee: visitFee.toFixed(2),
            timestamp: new Date().toISOString()
          }
        });

        chargeId = paymentIntent.id;
        job.stripePaymentIntentId = chargeId;
        job.paidAt = new Date();
        
        // Lock job after successful payment
        job.status = 'completed';
        await job.save();

        // Audit log
        console.log(`✅ Payment charged: $${totalCost.toFixed(2)} | PaymentIntent: ${chargeId} | Customer: ${job.stripeCustomerId} | Job: ${jobId} | Time: ${new Date().toISOString()}`);
      } catch (stripeError) {
        console.error('❌ Stripe charge failed:', stripeError);
        // Audit log failure
        console.log(`📝 Audit: Payment failed for Job ${jobId} | Customer: ${job.stripeCustomerId} | Error: ${stripeError.message} | Time: ${new Date().toISOString()}`);
        // Continue to create invoice even if charge fails
      }
    }

    // Create invoice
    const invoice = new Invoice({
      jobRequestId: job._id,
      customerName: job.name,
      customerEmail: job.email,
      customerPhone: job.phone,
      serviceAddress: job.address,
      serviceType: job.trade,
      laborHours: billableHours,
      laborRate: 150,
      laborCost: laborCost,
      materials: materialsArray,
      materialsCost: materialsCost,
      visitFee: 150,
      visitFeeWaived: visitFeeWaived,
      subtotal: subtotal,
      tax: 0,
      taxRate: 0,
      total: totalCost,
      stripeChargeId: chargeId,
      paidAt: chargeId ? new Date() : null,
      status: chargeId ? 'paid' : 'sent'
    });

    await invoice.save();

    job.invoiceId = invoice.invoiceNumber;
    await job.save();

    console.log(`✅ Invoice created: ${invoice.invoiceNumber} for job ${jobId}`);

    // TODO: Send invoice email to customer

    res.json({
      success: true,
      message: 'Clocked out and billing completed',
      clockOutTime: job.clockOutTime,
      totalHours: billableHours,
      totalCost: totalCost,
      invoiceNumber: invoice.invoiceNumber,
      charged: !!chargeId
    });

  } catch (error) {
    console.error('❌ Error clocking out:', error);
    res.status(500).json({
      success: false,
      message: 'Error clocking out',
      error: error.message
    });
  }
});

// Get invoice by ID
router.get('/invoice/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({ invoiceNumber }).populate('jobRequestId');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
});

// Get job details
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobRequest.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('❌ Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
});

module.exports = router;
