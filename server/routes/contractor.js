const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');

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

// POST /api/contractor/jobs/:id/clock-out - Clock out from job
router.post('/jobs/:id/clock-out', async (req, res) => {
  try {
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

    if (!job.clockInTime) {
      return res.status(400).json({ 
        error: 'Not clocked in to this job' 
      });
    }

    if (job.clockOutTime) {
      return res.status(400).json({ 
        error: 'Already clocked out from this job' 
      });
    }

    // Calculate hours worked
    const clockOutTime = new Date();
    const totalHours = (clockOutTime - job.clockInTime) / (1000 * 60 * 60);

    // Update job with clock-out
    const updatedJob = await JobRequest.findByIdAndUpdate(
      req.params.id,
      {
        clockOutTime,
        totalHours: Math.round(totalHours * 100) / 100
      },
      { new: true }
    );

    // Update pro's status and total hours
    await Pro.findByIdAndUpdate(req.proId, {
      isClockedIn: false,
      currentJobId: null,
      $inc: { totalHoursWorked: totalHours }
    });

    res.json({
      success: true,
      message: 'Clocked out successfully',
      job: updatedJob,
      hoursWorked: Math.round(totalHours * 100) / 100
    });
  } catch (error) {
    console.error('❌ Error clocking out:', error);
    res.status(500).json({ 
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
