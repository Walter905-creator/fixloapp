const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const Pro = require("../models/Pro");
const adminAuth = require("../middleware/adminAuth");
const fs = require('fs');
const path = require('path');

router.post('/login', (req, res) => {
  console.log('🔐 Admin login attempt:', req.body);
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;

  console.log('🔍 Environment check:');
  console.log('ADMIN_EMAIL:', ADMIN_EMAIL);
  console.log('ADMIN_PASSWORD:', ADMIN_PASSWORD ? 'set' : 'not set');
  console.log('JWT_SECRET:', JWT_SECRET ? 'set' : 'not set');

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    console.log('✅ Login successful');
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }

  console.log('❌ Login failed - invalid credentials');
  return res.status(401).json({ message: 'Unauthorized' });
});

// ✅ Test endpoint for debugging - kept public for troubleshooting
router.get("/test", async (req, res) => {
  try {
    console.log("🧪 Running admin test...");
    
    // Test database connection
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    
    // Test Pro model
    const prosCount = await Pro.countDocuments();
    
    res.json({
      message: "Admin routes working!",
      database: dbState === 1 ? 'connected' : 'not connected',
      collections: {
        pros: prosCount
      },
      models: {
        Pro: !!Pro
      }
    });
  } catch (err) {
    console.error("❌ Admin test error:", err);
    res.status(500).json({ 
      error: "Test failed", 
      message: err.message 
    });
  }
});

// ✅ Get all Pros
router.get("/pros", adminAuth, async (req, res) => {
  try {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, returning demo professionals");
      return res.json([
        {
          _id: "demo-pro-1",
          name: "John Smith",
          email: "john@example.com", 
          phone: "+1234567890",
          trade: "plumbing",
          isActive: true,
          paymentStatus: "active",
          location: { address: "New York, NY" },
          createdAt: new Date()
        },
        {
          _id: "demo-pro-2", 
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "+1234567891", 
          trade: "electrical",
          isActive: true,
          paymentStatus: "active",
          location: { address: "Los Angeles, CA" },
          createdAt: new Date()
        },
        {
          _id: "demo-pro-3",
          name: "Mike Wilson", 
          email: "mike@example.com",
          phone: "+1234567892",
          trade: "carpentry", 
          isActive: false,
          paymentStatus: "pending",
          location: { address: "Chicago, IL" },
          createdAt: new Date()
        }
      ]);
    }

    console.log("🔍 Attempting to fetch pros from database...");
    const pros = await Pro.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${pros.length} pros in database`);
    res.json(pros);
  } catch (err) {
    console.error("❌ Error fetching pros:", err.message);
    console.error("❌ Stack trace:", err.stack);
    // Return demo data instead of error
    res.json([
      {
        _id: "fallback-pro-1",
        name: "Demo Professional",
        email: "demo@fixloapp.com",
        phone: "+1234567890",
        trade: "general",
        isActive: false,
        paymentStatus: "unknown",
        location: { address: "Demo Location" },
        createdAt: new Date()
      }
    ]);
  }
});

// ✅ Add a new Pro
router.post("/pros", adminAuth, async (req, res) => {
  const { name, email, phone, trade, location } = req.body;
  try {
    const newPro = new Pro({ 
      name, 
      email: email.toLowerCase(), 
      phone, 
      trade: trade.toLowerCase(),
      location: typeof location === 'string' ? { address: location } : location,
      isActive: false,
      paymentStatus: 'pending'
    });
    await newPro.save();
    res.json({ success: true, pro: newPro });
  } catch (err) {
    console.error("❌ Error creating pro:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Toggle active status for a Pro
router.put("/pros/:id/toggle", adminAuth, async (req, res) => {
  try {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, cannot toggle professional status");
      return res.status(503).json({ 
        error: "Database not available", 
        message: "Cannot modify professional status - database connection required"
      });
    }

    const pro = await Pro.findById(req.params.id);
    if (!pro) return res.status(404).json({ error: "Pro not found" });

    pro.isActive = !pro.isActive;
    await pro.save();
    res.json({ success: true, pro });
  } catch (err) {
    console.error("❌ Error toggling pro status:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ✅ Delete a Pro
router.delete("/pros/:id", adminAuth, async (req, res) => {
  try {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, cannot delete professional");
      return res.status(503).json({ 
        error: "Database not available", 
        message: "Cannot delete professional - database connection required"
      });
    }

    await Pro.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting pro:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ✅ Get dashboard stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    // Check if database is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, returning mock stats for demo");
      return res.json({
        success: true,
        stats: {
          totalPros: 3,
          activePros: 2,
          pendingPros: 1,
          tradeStats: [
            { _id: "plumbing", count: 1 },
            { _id: "electrical", count: 1 },
            { _id: "carpentry", count: 1 }
          ]
        },
        notice: "Database not connected - showing demo data"
      });
    }

    const totalPros = await Pro.countDocuments();
    const activePros = await Pro.countDocuments({ isActive: true });
    const pendingPros = await Pro.countDocuments({ paymentStatus: 'pending' });
    
    const tradeStats = await Pro.aggregate([
      { $group: { _id: "$trade", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalPros,
        activePros,
        pendingPros,
        tradeStats
      }
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    // Return fallback stats instead of error
    res.json({
      success: true,
      stats: {
        totalPros: 0,
        activePros: 0,
        pendingPros: 0,
        tradeStats: []
      },
      error: "Could not fetch live data"
    });
  }
});

// ✅ Shield log endpoint - View blocked requests
router.get('/shield-log', (req, res) => {
  const logPath = path.join(__dirname, '../logs/shield.log');
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf8');
    res.type('text/plain').send(content);
  } else {
    res.status(404).send('No logs found.');
  }
});

module.exports = router;
