// routes/proJobs.js - Professional Jobs API
const express = require("express");
const router = express.Router();
const JobRequest = require("../models/JobRequest");
const Pro = require("../models/Pro");
const auth = require("../middleware/auth");

// ✅ Test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Professional jobs routes are working!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Get jobs for professionals (with optional status filter)
router.get("/jobs", auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, returning demo jobs");
      const demoJobs = [
        {
          _id: "demo-job-1",
          service: "plumbing",
          type: "plumbing",
          city: "New York",
          location: { city: "New York", address: "123 Main St, New York, NY" },
          description: "Kitchen sink is leaking and needs immediate repair",
          desc: "Kitchen sink is leaking and needs immediate repair",
          status: "open",
          createdAt: new Date().toISOString(),
          date: new Date().toISOString()
        },
        {
          _id: "demo-job-2", 
          service: "electrical",
          type: "electrical",
          city: "Los Angeles",
          location: { city: "Los Angeles", address: "456 Oak Ave, Los Angeles, CA" },
          description: "Need to install new ceiling fan in living room",
          desc: "Need to install new ceiling fan in living room",
          status: "open",
          createdAt: new Date().toISOString(),
          date: new Date().toISOString()
        },
        {
          _id: "demo-job-3",
          service: "carpentry", 
          type: "carpentry",
          city: "Chicago",
          location: { city: "Chicago", address: "789 Pine St, Chicago, IL" },
          description: "Build custom kitchen cabinets",
          desc: "Build custom kitchen cabinets",
          status: "open",
          createdAt: new Date().toISOString(),
          date: new Date().toISOString()
        }
      ];
      
      // Filter by status if provided
      const filteredJobs = status ? demoJobs.filter(job => job.status === status) : demoJobs;
      return res.json(filteredJobs);
    }

    // Build query
    let query = {};
    if (status) {
      query.status = status === 'open' ? 'pending' : status; // Map 'open' to 'pending' in database
    }

    console.log("🔍 Fetching jobs from database with query:", query);
    const jobs = await JobRequest.find(query).sort({ createdAt: -1 }).limit(50);
    
    // Transform jobs to match client expectations
    const transformedJobs = jobs.map(job => ({
      _id: job._id,
      id: job._id,
      service: job.trade?.toLowerCase() || 'service',
      type: job.trade?.toLowerCase() || 'service', 
      city: job.address?.split(',').pop()?.trim() || 'Unknown',
      location: { 
        city: job.address?.split(',').pop()?.trim() || 'Unknown',
        address: job.address 
      },
      description: job.description,
      desc: job.description,
      status: job.status === 'pending' ? 'open' : job.status,
      createdAt: job.createdAt,
      date: job.createdAt
    }));

    console.log(`✅ Found ${transformedJobs.length} jobs`);
    res.json(transformedJobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ error: "Server error fetching jobs" });
  }
});

// ✅ Job action endpoints (accept, decline, etc.)
router.post("/jobs/:jobId/:action", auth, async (req, res) => {
  try {
    const { jobId, action } = req.params;
    const proId = req.proId;

    console.log(`🎯 Pro ${proId} attempting to ${action} job ${jobId}`);

    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, simulating action");
      return res.json({
        success: true,
        message: `Job ${action} successful (demo mode)`,
        jobId,
        action
      });
    }

    const job = await JobRequest.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({ error: "Professional not found" });
    }

    // Handle different actions
    switch (action) {
      case 'accept':
      case 'interested':
        job.status = 'assigned';
        job.assignedPro = proId;
        await job.save();
        break;
      case 'decline':
        // Job remains open for other pros
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    console.log(`✅ Job ${action} successful for pro ${pro.name}`);
    res.json({
      success: true,
      message: `Job ${action} successful`,
      jobId,
      action,
      jobStatus: job.status
    });
  } catch (err) {
    console.error("❌ Error processing job action:", err);
    res.status(500).json({ error: "Server error processing job action" });

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
 main
  }
});

module.exports = router;