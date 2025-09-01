const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');

// GET /api/pro/jobs - Fetch jobs for professionals
router.get('/', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { status, trade, limit = 50, page = 1 } = req.query;
    
    // Build query filters
    const filters = {};
    
    // Map frontend status "open" to database status "pending"
    if (status) {
      if (status === 'open') {
        filters.status = 'pending';
      } else {
        filters.status = status;
      }
    }
    
    if (trade) {
      filters.trade = new RegExp(trade, 'i'); // case-insensitive match
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const jobs = await JobRequest.find(filters)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Transform data to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      _id: job._id,
      id: job._id,
      service: job.trade,
      type: job.trade,
      city: job.address, // Use address field for city display
      location: {
        city: job.address
      },
      description: job.description,
      desc: job.description,
      createdAt: job.createdAt,
      date: job.createdAt,
      status: job.status,
      // Include other fields that might be useful
      name: job.name,
      email: job.email,
      phone: job.phone,
      address: job.address
    }));

    console.log(`✅ Found ${transformedJobs.length} jobs for status: ${status || 'all'}`);

    res.json({
      success: true,
      data: transformedJobs
    });

  } catch (err) {
    console.error('❌ Error fetching pro jobs:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: err.message
    });
  }
});

// POST /api/pro/jobs/:id/:action - Handle professional job actions (accept/decline)
router.post('/:id/:action', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { id, action } = req.params;
    const validActions = ['accept', 'decline'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "decline"'
      });
    }

    // Map actions to status updates
    let newStatus;
    if (action === 'accept') {
      newStatus = 'assigned';
    } else if (action === 'decline') {
      newStatus = 'cancelled';
    }

    const job = await JobRequest.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log(`✅ Job ${id} ${action}ed - status updated to ${newStatus}`);

    res.json({
      success: true,
      message: `Job ${action}ed successfully`,
      data: job
    });

  } catch (err) {
    console.error('❌ Error handling job action:', err.message);
    return res.status(500).json({
      success: false,
      message: `Failed to ${req.params.action} job`,
      error: err.message
    });
  }
});

module.exports = router;