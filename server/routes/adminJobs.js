const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const requireAuth = require('../middleware/requireAuth');
const smsService = require('../services/smsService');
const { sendNotificationWithFallback } = require('../services/emailService');
const { logPaymentAction, logAdminAction } = require('../services/auditLogger');

// Protect all routes with admin authentication
router.use(requireAuth);
router.use((req, res, next) => {
  // Check if user has admin role OR isAdmin flag (for owner)
  const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
  
  if (!hasAdminAccess) {
    console.log(`🚫 Admin jobs access denied: role=${req.user?.role}, isAdmin=${req.user?.isAdmin}`);
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  console.log(`✅ Admin jobs access granted: role=${req.user?.role}, isAdmin=${req.user?.isAdmin}`);
  next();
});

// GET /api/admin/jobs - List all jobs with filters
router.get('/jobs', async (req, res) => {
  try {
    const { status, city, trade, assignedTo, page = 1, limit = 50 } = req.query;
    
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        jobs: [] 
      });
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (city) query.city = new RegExp(city, 'i');
    if (trade) query.trade = trade;
    if (assignedTo) query.assignedTo = assignedTo;

    // Fetch jobs with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await JobRequest.find(query)
      .populate('assignedTo', 'name email phone trade')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobRequest.countDocuments(query);

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      message: error.message 
    });
  }
});

// GET /api/admin/jobs/:id - Get job details
router.get('/jobs/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id)
      .populate('assignedTo', 'name email phone trade businessName');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('❌ Error fetching job:', error);
    res.status(500).json({ 
      error: 'Failed to fetch job',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/schedule - Schedule a visit
router.post('/jobs/:id/schedule', async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    
    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ 
        error: 'scheduledDate and scheduledTime are required' 
      });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'scheduled',
        scheduledDate: new Date(scheduledDate),
        scheduledTime
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Send SMS notification with email fallback
    try {
      const dateStr = new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      await sendNotificationWithFallback(job, 'scheduled', { date: dateStr, time: scheduledTime });
    } catch (notificationError) {
      console.error('⚠️ Notification failed:', notificationError.message);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Visit scheduled successfully',
      job
    });
  } catch (error) {
    console.error('❌ Error scheduling visit:', error);
    res.status(500).json({ 
      error: 'Failed to schedule visit',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/assign - Assign job to technician
router.post('/jobs/:id/assign', async (req, res) => {
  try {
    const { proId } = req.body;
    
    if (!proId) {
      return res.status(400).json({ error: 'proId is required' });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Verify pro exists
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Update job
    const job = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'assigned',
        assignedTo: proId,
        assignedAt: new Date()
      },
      { new: true }
    ).populate('assignedTo', 'name email phone trade businessName');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Add job to pro's assigned jobs if contractor
    if (pro.isContractor) {
      await Pro.findByIdAndUpdate(proId, {
        $addToSet: { assignedJobs: job._id }
      });
    }

    // Send SMS notification with email fallback
    try {
      const technicianName = pro.businessName || pro.name;
      await sendNotificationWithFallback(job, 'assigned', { technicianName });
    } catch (notificationError) {
      console.error('⚠️ Notification failed:', notificationError.message);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Job assigned successfully',
      job
    });
  } catch (error) {
    console.error('❌ Error assigning job:', error);
    res.status(500).json({ 
      error: 'Failed to assign job',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/start - Start job (clock in)
router.post('/jobs/:id/start', async (req, res) => {
  try {
    const { location } = req.body; // { lat, lng }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const updateData = {
      status: 'in-progress',
      clockInTime: new Date()
    };

    if (location?.lat && location?.lng) {
      updateData.clockInLocation = {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      };
    }

    const job = await JobRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email phone trade businessName');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update pro's clock-in status if assigned
    if (job.assignedTo) {
      await Pro.findByIdAndUpdate(job.assignedTo._id, {
        isClockedIn: true,
        currentJobId: job._id
      });
    }

    // Send SMS notification with email fallback
    try {
      await sendNotificationWithFallback(job, 'arrived', {});
    } catch (notificationError) {
      console.error('⚠️ Notification failed:', notificationError.message);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Job started successfully',
      job
    });
  } catch (error) {
    console.error('❌ Error starting job:', error);
    res.status(500).json({ 
      error: 'Failed to start job',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/end - End job (clock out)
router.post('/jobs/:id/end', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.clockInTime) {
      return res.status(400).json({ error: 'Job was not started (no clock-in time)' });
    }

    const clockOutTime = new Date();
    const totalHours = (clockOutTime - job.clockInTime) / (1000 * 60 * 60);

    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        clockOutTime,
        totalHours: Math.round(totalHours * 100) / 100
      },
      { new: true }
    ).populate('assignedTo', 'name email phone trade businessName');

    // Update pro's clock-out status and hours if assigned
    if (updatedJob.assignedTo) {
      await Pro.findByIdAndUpdate(updatedJob.assignedTo._id, {
        isClockedIn: false,
        currentJobId: null,
        $inc: { totalHoursWorked: totalHours }
      });
    }

    res.json({
      success: true,
      message: 'Job ended successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('❌ Error ending job:', error);
    res.status(500).json({ 
      error: 'Failed to end job',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/materials - Add materials to job
router.post('/jobs/:id/materials', async (req, res) => {
  try {
    const { materials } = req.body; // [{ description, cost }]
    
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ error: 'materials array is required' });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate materials cost
    const materialsCost = materials.reduce((sum, m) => sum + (m.cost || 0), 0);

    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        $push: { materials: { $each: materials } },
        $inc: { materialsCost }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Materials added successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('❌ Error adding materials:', error);
    res.status(500).json({ 
      error: 'Failed to add materials',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/complete - Mark job as completed
router.post('/jobs/:id/complete', async (req, res) => {
  try {
    const { laborCost } = req.body;

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate total cost
    const visitFeeCost = job.visitFeeWaived ? 0 : job.visitFee;
    const totalCost = visitFeeCost + (laborCost || job.laborCost || 0) + (job.materialsCost || 0);

    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        laborCost: laborCost || job.laborCost || 0,
        totalCost
      },
      { new: true }
    ).populate('assignedTo', 'name email phone trade businessName');

    // Send SMS notification with email fallback
    try {
      await sendNotificationWithFallback(updatedJob, 'completed', {});
    } catch (notificationError) {
      console.error('⚠️ Notification failed:', notificationError.message);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Job completed successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('❌ Error completing job:', error);
    res.status(500).json({ 
      error: 'Failed to complete job',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/invoice - Generate invoice (charge separately)
router.post('/jobs/:id/invoice', async (req, res) => {
  try {
    const { chargeNow } = req.body; // Optional flag to charge immediately

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed before generating invoice' });
    }

    if (!job.stripeCustomerId || !job.stripePaymentMethodId) {
      return res.status(400).json({ error: 'Customer payment information not found' });
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Create invoice in Stripe
    const invoice = await stripe.invoices.create({
      customer: job.stripeCustomerId,
      auto_advance: false, // Don't automatically finalize
      description: `Fixlo Service - ${job.trade}`,
      metadata: {
        jobId: job._id.toString(),
        jobTrade: job.trade
      }
    });

    // Add line items
    if (!job.visitFeeWaived && job.visitFee > 0) {
      await stripe.invoiceItems.create({
        customer: job.stripeCustomerId,
        invoice: invoice.id,
        amount: Math.round(job.visitFee * 100),
        currency: 'usd',
        description: 'Visit Fee'
      });
    }

    if (job.laborCost > 0) {
      await stripe.invoiceItems.create({
        customer: job.stripeCustomerId,
        invoice: invoice.id,
        amount: Math.round(job.laborCost * 100),
        currency: 'usd',
        description: `Labor (${job.totalHours || 0} hours)`
      });
    }

    if (job.materialsCost > 0) {
      await stripe.invoiceItems.create({
        customer: job.stripeCustomerId,
        invoice: invoice.id,
        amount: Math.round(job.materialsCost * 100),
        currency: 'usd',
        description: 'Materials'
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    
    // Optionally charge the invoice
    let paidInvoice = finalizedInvoice;
    if (chargeNow) {
      paidInvoice = await stripe.invoices.pay(finalizedInvoice.id);
    }

    // Update job with invoice info
    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        invoiceId: paidInvoice.id,
        paidAt: chargeNow ? new Date() : null
      },
      { new: true }
    );

    res.json({
      success: true,
      message: chargeNow ? 'Invoice generated and charged successfully' : 'Invoice generated successfully',
      job: updatedJob,
      invoice: {
        id: paidInvoice.id,
        amount: paidInvoice.amount_due / 100,
        status: paidInvoice.status,
        hostedUrl: paidInvoice.hosted_invoice_url,
        charged: !!chargeNow
      }
    });
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/capture-payment - Capture authorized payment
router.post('/jobs/:id/capture-payment', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Validate payment can be captured
    if (job.paymentStatus !== 'authorized') {
      return res.status(400).json({ 
        error: 'Invalid payment status',
        message: `Payment status is "${job.paymentStatus}". Only "authorized" payments can be captured.`
      });
    }

    if (!job.stripePaymentIntentId) {
      return res.status(400).json({ 
        error: 'No payment intent found',
        message: 'This job does not have a Stripe payment intent'
      });
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Capture the payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.capture(job.stripePaymentIntentId);
      
      // Update job with captured payment info
      job.paymentStatus = 'captured';
      job.paymentCapturedAt = new Date();
      job.paymentCapturedBy = req.user.email;
      job.paidAt = new Date();
      await job.save();

      // Log the action
      await logPaymentAction({
        action: 'captured',
        jobId: job._id.toString(),
        stripePaymentIntentId: job.stripePaymentIntentId,
        amount: paymentIntent.amount / 100,
        actorEmail: req.user.email,
        actorType: 'admin',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Payment captured successfully',
        job,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status
        }
      });
    } catch (stripeError) {
      console.error('❌ Stripe capture error:', stripeError.message);
      
      // Log the failure
      await logPaymentAction({
        action: 'captured',
        jobId: job._id.toString(),
        stripePaymentIntentId: job.stripePaymentIntentId,
        actorEmail: req.user.email,
        actorType: 'admin',
        status: 'failure',
        errorMessage: stripeError.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(500).json({ 
        error: 'Failed to capture payment',
        message: stripeError.message 
      });
    }
  } catch (error) {
    console.error('❌ Error capturing payment:', error);
    res.status(500).json({ 
      error: 'Failed to capture payment',
      message: error.message 
    });
  }
});

// POST /api/admin/jobs/:id/release-authorization - Release payment authorization
router.post('/jobs/:id/release-authorization', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Validate payment can be released
    if (job.paymentStatus !== 'authorized') {
      return res.status(400).json({ 
        error: 'Invalid payment status',
        message: `Payment status is "${job.paymentStatus}". Only "authorized" payments can be released.`
      });
    }

    if (!job.stripePaymentIntentId) {
      return res.status(400).json({ 
        error: 'No payment intent found',
        message: 'This job does not have a Stripe payment intent'
      });
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Cancel the payment intent to release authorization
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(job.stripePaymentIntentId);
      
      // Update job with released payment info
      job.paymentStatus = 'released';
      job.paymentReleasedAt = new Date();
      job.paymentReleasedBy = req.user.email;
      await job.save();

      // Log the action
      await logPaymentAction({
        action: 'released',
        jobId: job._id.toString(),
        stripePaymentIntentId: job.stripePaymentIntentId,
        amount: paymentIntent.amount / 100,
        actorEmail: req.user.email,
        actorType: 'admin',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Payment authorization released successfully',
        job,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status
        }
      });
    } catch (stripeError) {
      console.error('❌ Stripe release error:', stripeError.message);
      
      // Log the failure
      await logPaymentAction({
        action: 'released',
        jobId: job._id.toString(),
        stripePaymentIntentId: job.stripePaymentIntentId,
        actorEmail: req.user.email,
        actorType: 'admin',
        status: 'failure',
        errorMessage: stripeError.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(500).json({ 
        error: 'Failed to release authorization',
        message: stripeError.message 
      });
    }
  } catch (error) {
    console.error('❌ Error releasing authorization:', error);
    res.status(500).json({ 
      error: 'Failed to release authorization',
      message: error.message 
    });
  }
});

// GET /api/admin/audit-logs - Get audit logs (admin-only)
router.get('/audit-logs', async (req, res) => {
  try {
    const { getAuditLogs } = require('../services/auditLogger');
    
    const {
      eventType,
      actorEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      limit,
      page
    } = req.query;

    const result = await getAuditLogs({
      eventType,
      actorEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
      page: page ? parseInt(page) : 1
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch audit logs',
      message: error.message 
    });
  }
});

module.exports = router;
