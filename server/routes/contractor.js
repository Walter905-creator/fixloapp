const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');
const { sendInvoiceEmail } = require('../services/emailService');

const HOURLY_RATE = 75;

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
}

// All routes require authentication
router.use(auth);

// GET /api/contractor/jobs - Get assigned jobs for contractor
router.get('/jobs', async (req, res) => {
  try {
    const { status } = req.query;
    
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        jobs: [] 
      });
    }

    // Verify pro is a contractor
    const pro = await Pro.findById(req.proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Build query for jobs assigned to this contractor
    const query = { assignedTo: req.proId };
    if (status) {
      query.status = status;
    }

    const jobs = await JobRequest.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs,
      contractor: {
        id: pro._id,
        name: pro.name,
        isClockedIn: pro.isClockedIn,
        currentJobId: pro.currentJobId,
        totalHoursWorked: pro.totalHoursWorked
      }
    });
  } catch (error) {
    console.error('❌ Error fetching contractor jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      message: error.message 
    });
  }
});

// POST /api/contractor/jobs/:id/clock-in - Clock in to job with GPS verification
router.post('/jobs/:id/clock-in', async (req, res) => {
  try {
    const { location } = req.body; // { lat, lng }
    
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ 
        error: 'GPS location (lat, lng) is required for clock-in' 
      });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Verify job is assigned to this contractor
    const job = await JobRequest.findOne({
      _id: req.params.id,
      assignedTo: req.proId
    });

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found or not assigned to you' 
      });
    }

    if (job.clockInTime) {
      return res.status(400).json({ 
        error: 'Already clocked in to this job' 
      });
    }

    // Update job with clock-in
    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'in-progress',
        clockInTime: new Date(),
        clockInLocation: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        }
      },
      { new: true }
    );

    // Update pro's status
    await Pro.findByIdAndUpdate(req.proId, {
      isClockedIn: true,
      currentJobId: job._id
    });

    // Send SMS notification to customer
    try {
      await smsService.notifyTechnicianArrived(updatedJob);
    } catch (smsError) {
      console.error('⚠️ SMS notification failed:', smsError.message);
    }

    res.json({
      success: true,
      message: 'Clocked in successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('❌ Error clocking in:', error);
    res.status(500).json({ 
      error: 'Failed to clock in',
      message: error.message 
    });
  }
});

// POST /api/contractor/jobs/:id/clock-out - Clock out, calculate billing, charge saved card, and email invoice
router.post('/jobs/:id/clock-out', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findOne({
      _id: req.params.id,
      assignedTo: req.proId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not assigned to you' });
    }
    if (!job.clockInTime) {
      return res.status(400).json({ error: 'Not clocked in to this job' });
    }
    if (job.clockOutTime) {
      return res.status(400).json({ error: 'Already clocked out from this job' });
    }

    const clockOutTime = new Date();
    const elapsedHours = Math.max((clockOutTime - job.clockInTime) / (1000 * 60 * 60), 0);
    const totalHours = Math.round(elapsedHours * 100) / 100;
    const billableHours = Math.max(elapsedHours, 1);
    const hourlyRate = Number(job.hourlyRate || HOURLY_RATE);
    const laborCost = Math.round(billableHours * hourlyRate * 100) / 100;

    const materials = Array.isArray(req.body?.materials)
      ? req.body.materials
          .map((item) => ({
            description: String(item?.description || 'Material').trim().slice(0, 200),
            cost: Math.max(Number(item?.cost || 0), 0)
          }))
          .filter((item) => item.cost > 0)
      : (Array.isArray(job.materials) ? job.materials : []);
    const materialsCost = Math.round(materials.reduce((sum, item) => sum + Number(item.cost || 0), 0) * 100) / 100;
    const totalCost = Math.round((laborCost + materialsCost) * 100) / 100;
    const prepaidAmount = Math.min(Math.max(Number(job.prepaidAmount || 0), 0), totalCost);
    const amountDue = Math.round(Math.max(totalCost - prepaidAmount, 0) * 100) / 100;

    let completionPaymentIntentId = '';
    let amountChargedAtCompletion = 0;
    let paymentSucceeded = amountDue === 0;

    if (amountDue > 0 && stripe && job.stripeCustomerId && job.stripePaymentMethodId && job.paymentAuthConsent) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amountDue * 100),
          currency: 'usd',
          customer: job.stripeCustomerId,
          payment_method: job.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Fixlo final charge for ${job.trade || 'home service'}`,
          metadata: {
            jobId: String(job._id),
            hours: totalHours.toFixed(2),
            hourlyRate: hourlyRate.toFixed(2),
            materialsCost: materialsCost.toFixed(2),
            prepaidAmount: prepaidAmount.toFixed(2)
          }
        });
        completionPaymentIntentId = paymentIntent.id;
        amountChargedAtCompletion = amountDue;
        paymentSucceeded = paymentIntent.status === 'succeeded';
      } catch (paymentError) {
        console.error('❌ Automatic clock-out charge failed:', paymentError.message);
        paymentSucceeded = false;
      }
    }

    job.clockOutTime = clockOutTime;
    job.totalHours = totalHours;
    job.hourlyRate = hourlyRate;
    job.laborCost = laborCost;
    job.materials = materials;
    job.materialsCost = materialsCost;
    job.totalCost = totalCost;
    job.prepaidAmount = prepaidAmount;
    job.amountChargedAtCompletion = amountChargedAtCompletion;
    job.completionPaymentIntentId = completionPaymentIntentId;
    job.status = 'completed';

    if (paymentSucceeded) {
      job.paymentStatus = 'captured';
      job.paidAt = new Date();
    } else if (amountDue > 0) {
      job.paymentStatus = 'failed';
    }
    await job.save();

    await Pro.findByIdAndUpdate(req.proId, {
      isClockedIn: false,
      currentJobId: null,
      $inc: { totalHoursWorked: elapsedHours }
    });

    let invoice = null;
    if (job.email) {
      invoice = await Invoice.create({
        jobRequestId: job._id,
        customerName: job.name,
        customerEmail: job.email,
        customerPhone: job.phone,
        serviceAddress: job.address,
        serviceType: job.trade,
        laborHours: totalHours,
        laborRate: hourlyRate,
        laborCost,
        materials,
        materialsCost,
        visitFee: 0,
        visitFeeWaived: true,
        subtotal: totalCost,
        tax: 0,
        taxRate: 0,
        total: totalCost,
        prepaidAmount,
        amountChargedAtCompletion,
        stripeChargeId: completionPaymentIntentId || job.stripePaymentIntentId || '',
        paidAt: paymentSucceeded ? new Date() : null,
        status: paymentSucceeded ? 'paid' : 'sent'
      });

      job.invoiceId = invoice.invoiceNumber;
      try {
        await sendInvoiceEmail(job.email, invoice, job);
        job.invoiceEmailSentAt = new Date();
      } catch (emailError) {
        console.error('⚠️ Invoice email failed:', emailError.message);
      }
      await job.save();
    }

    return res.json({
      success: true,
      message: paymentSucceeded
        ? 'Clocked out, payment processed, and invoice emailed.'
        : 'Clocked out. Invoice created; payment needs attention.',
      job,
      hoursWorked: totalHours,
      billableHours: Math.round(billableHours * 100) / 100,
      hourlyRate,
      laborCost,
      materialsCost,
      totalCost,
      prepaidAmount,
      amountChargedAtCompletion,
      paymentSucceeded,
      invoiceNumber: invoice?.invoiceNumber || null
    });
  } catch (error) {
    console.error('❌ Error clocking out:', error);
    return res.status(500).json({
      error: 'Failed to clock out',
      message: error.message
    });
  }
});

// GET /api/contractor/hours - Get hours worked summary
router.get('/hours', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const pro = await Pro.findById(req.proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Get all completed jobs for this contractor
    const jobs = await JobRequest.find({
      assignedTo: req.proId,
      clockInTime: { $exists: true },
      clockOutTime: { $exists: true }
    }).select('trade clockInTime clockOutTime totalHours createdAt');

    const totalHours = jobs.reduce((sum, job) => sum + (job.totalHours || 0), 0);

    res.json({
      success: true,
      summary: {
        totalHoursWorked: Math.round(totalHours * 100) / 100,
        jobsCompleted: jobs.length,
        currentStatus: pro.isClockedIn ? 'clocked-in' : 'available'
      },
      jobs: jobs.map(job => ({
        id: job._id,
        trade: job.trade,
        clockIn: job.clockInTime,
        clockOut: job.clockOutTime,
        hours: job.totalHours,
        date: job.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching hours:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hours',
      message: error.message 
    });
  }
});

// GET /api/contractor/payout - Get payout summary
router.get('/payout', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const pro = await Pro.findById(req.proId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Get all completed jobs for this contractor
    const jobs = await JobRequest.find({
      assignedTo: req.proId,
      status: 'completed',
      totalHours: { $gt: 0 }
    }).select('trade totalHours laborCost createdAt');

    // Calculate earnings (simplified - in production, this would have more complex logic)
    const hourlyRate = 40; // Default rate per hour
    const totalEarned = jobs.reduce((sum, job) => {
      return sum + (job.totalHours * hourlyRate);
    }, 0);

    res.json({
      success: true,
      payout: {
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalPaid: pro.payoutSummary?.totalPaid || 0,
        pendingPayout: Math.round((totalEarned - (pro.payoutSummary?.totalPaid || 0)) * 100) / 100,
        hourlyRate,
        jobsCompleted: jobs.length,
        totalHoursWorked: pro.totalHoursWorked || 0
      },
      jobs: jobs.map(job => ({
        id: job._id,
        trade: job.trade,
        hours: job.totalHours,
        earned: Math.round(job.totalHours * hourlyRate * 100) / 100,
        date: job.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching payout:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payout',
      message: error.message 
    });
  }
});

module.exports = router;
