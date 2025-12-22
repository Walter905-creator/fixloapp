const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');

// GET /api/customer/jobs - Get customer's jobs by phone or email
router.get('/jobs', async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.status(400).json({ 
        error: 'Phone or email is required' 
      });
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        jobs: [] 
      });
    }

    // Build query
    const query = {};
    if (phone) {
      // Normalize phone for safe comparison (remove non-digits)
      const normalizedPhone = phone.replace(/[^\d]/g, '');
      // Use exact match or prefix match for safety
      query.$or = [
        { phone: normalizedPhone },
        { phone: new RegExp('^' + normalizedPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }
      ];
    }
    if (email) {
      query.email = email.toLowerCase();
    }

    // Fetch customer's jobs
    const jobs = await JobRequest.find(query)
      .populate('assignedTo', 'name businessName trade')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('❌ Error fetching customer jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      message: error.message 
    });
  }
});

// GET /api/customer/jobs/:id - Get specific job details
router.get('/jobs/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id)
      .populate('assignedTo', 'name businessName trade phone email');

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

// GET /api/customer/jobs/:id/invoice - Get invoice details
router.get('/jobs/:id/invoice', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.invoiceId) {
      return res.status(404).json({ error: 'Invoice not yet generated' });
    }

    // Fetch invoice from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const invoice = await stripe.invoices.retrieve(job.invoiceId);

    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_due / 100,
        amountPaid: invoice.amount_paid / 100,
        currency: invoice.currency,
        created: invoice.created,
        dueDate: invoice.due_date,
        hostedUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
        lines: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount / 100,
          quantity: line.quantity
        }))
      },
      job: {
        id: job._id,
        trade: job.trade,
        visitFee: job.visitFee,
        visitFeeWaived: job.visitFeeWaived,
        laborCost: job.laborCost,
        materialsCost: job.materialsCost,
        totalCost: job.totalCost,
        totalHours: job.totalHours,
        materials: job.materials,
        paidAt: job.paidAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      message: error.message 
    });
  }
});

// GET /api/customer/jobs/:id/invoice/pdf - Download invoice PDF (redirect)
router.get('/jobs/:id/invoice/pdf', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const job = await JobRequest.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.invoiceId) {
      return res.status(404).json({ error: 'Invoice not yet generated' });
    }

    // Get PDF URL from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const invoice = await stripe.invoices.retrieve(job.invoiceId);

    if (!invoice.invoice_pdf) {
      return res.status(404).json({ error: 'Invoice PDF not available' });
    }

    // Redirect to Stripe's hosted PDF
    res.redirect(invoice.invoice_pdf);
  } catch (error) {
    console.error('❌ Error downloading invoice:', error);
    res.status(500).json({ 
      error: 'Failed to download invoice',
      message: error.message 
    });
  }
});

module.exports = router;
