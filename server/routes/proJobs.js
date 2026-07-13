// routes/proJobs.js - Professional Jobs API
const express = require("express");
const router = express.Router();
const JobRequest = require("../models/JobRequest");
const Pro = require("../models/Pro");
const LeadAssignment = require("../models/LeadAssignment");
const auth = require("../middleware/auth");
const { acceptLead, declineLead, processExpiredPremiumAssignments } = require('../services/leadAssignmentService');

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
    await processExpiredPremiumAssignments();
    
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

    const assignments = await LeadAssignment.find({
      proId: req.proId,
      ...(status === 'open'
        ? { status: 'pending' }
        : status && status !== 'all'
          ? { status }
          : {})
    })
      .populate('leadId')
      .sort({ assignedAt: -1 })
      .limit(50);

    const assignmentJobs = assignments
      .filter((assignment) => assignment.leadId)
      .map((assignment) => ({
        _id: assignment.leadId._id,
        id: assignment.leadId._id,
        assignmentId: assignment._id,
        assignmentType: assignment.assignmentType,
        assignmentStatus: assignment.status,
        exclusiveUntil: assignment.exclusiveUntil,
        service: assignment.leadId.trade?.toLowerCase() || 'service',
        type: assignment.leadId.trade?.toLowerCase() || 'service',
        city: assignment.leadId.city || assignment.leadId.address?.split(',').pop()?.trim() || 'Unknown',
        location: {
          city: assignment.leadId.city || assignment.leadId.address?.split(',').pop()?.trim() || 'Unknown',
          address: assignment.status === 'accepted' ? assignment.leadId.address : ''
        },
        description: assignment.leadId.description,
        desc: assignment.leadId.description,
        status: assignment.status === 'pending' ? 'open' : assignment.status,
        createdAt: assignment.leadId.createdAt,
        date: assignment.leadId.createdAt,
        customerName: assignment.status === 'accepted' ? assignment.leadId.name : '',
        phone: assignment.status === 'accepted' ? assignment.leadId.phone : '',
        secureLeadRequired: assignment.status !== 'accepted'
      }));

    const assignedJobs = await JobRequest.find({
      $or: [{ assignedProId: req.proId }, { assignedTo: req.proId }]
    }).sort({ createdAt: -1 }).limit(50);

    const transformedJobs = assignedJobs.map(job => ({
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

    const seen = new Set();
    const combinedJobs = [...assignmentJobs, ...transformedJobs].filter((job) => {
      const key = `${job._id}:${job.assignmentId || 'job'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`✅ Found ${combinedJobs.length} jobs`);
    res.json(combinedJobs);
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
        {
          const result = await acceptLead(jobId, proId);
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
          }
        }
        break;
      case 'decline':
        {
          const result = await declineLead(jobId, proId);
          if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
          }
        }
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
  }
});

module.exports = router;