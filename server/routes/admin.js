const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const Pro = require("../models/Pro");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const fs = require('fs');
const path = require('path');
const { sendOwnerNotification } = require('../utils/smsSender');
const { sendSms } = require('../utils/twilio');
const { getPriorityConfig } = require('../config/priorityRouting');
const MetaLead = require('../models/MetaLead');
const { recoverManualMetaLead } = require('../services/metaLeadAutomationService');

// Protect all admin routes with JWT + admin role
router.use(requireAuth);
router.use(requireAdmin);

// ✅ Send a test Charlotte owner-notification SMS
router.post("/test-charlotte-sms", async (req, res) => {
  try {
    const priorityConfig = getPriorityConfig('charlotte');
    if (!priorityConfig) {
      return res.status(404).json({ ok: false, error: 'No priority config found for Charlotte' });
    }

    const testLead = {
      _id: 'test-sms-charlotte-' + Date.now(),
      trade: req.body.serviceType || 'Plumbing',
      city: 'Charlotte',
      state: 'NC',
      address: req.body.address || '100 N Tryon St, Charlotte, NC 28202',
      name: req.body.fullName || 'Test Customer',
      phone: req.body.phone || '+17045550000',
      description: 'TEST: Sample job request to verify SMS notifications.'
    };

    console.log(`🧪 Admin triggered test Charlotte SMS → ${priorityConfig.phone}`);
    const result = await sendOwnerNotification(priorityConfig.phone, testLead);

    return res.json({
      ok: result.success,
      sentTo: priorityConfig.phone,
      ownerName: priorityConfig.name,
      messageId: result.messageId || null,
      reason: result.reason || result.error || null,
      testLead
    });
  } catch (err) {
    console.error('❌ test-charlotte-sms error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Trigger a full sample Charlotte job request to test the complete notification workflow
// Sends both the priority SMS and the owner notification SMS
router.post("/trigger-charlotte-test-job", async (req, res) => {
  try {
    const priorityConfig = getPriorityConfig('charlotte');
    if (!priorityConfig) {
      return res.status(404).json({ ok: false, error: 'No priority config found for Charlotte' });
    }

    const serviceType = req.body.serviceType || 'Plumbing';
    const address = req.body.address || '100 N Tryon St, Charlotte, NC 28202';
    const fullName = req.body.fullName || 'Test Homeowner';
    const customerPhone = req.body.phone || '+17045550000';

    const errors = [];

    const testLead = {
      _id: 'test-job-charlotte-' + Date.now(),
      trade: serviceType,
      city: 'Charlotte',
      state: 'NC',
      address,
      name: fullName,
      phone: customerPhone,
      description: 'TEST: Sample job request to verify the full notification workflow.',
      smsConsent: true
    };

    console.log(`🧪 Admin triggered full Charlotte test job notification → ${priorityConfig.phone}`);

    // Step 1: Send priority SMS (same as leads.js priority routing)
    let prioritySmsResult = { success: false, error: null };
    try {
      const priorityMessage = `Fixlo Priority Lead (Charlotte):
New homeowner service request received.
Service: ${serviceType}
Location: ${address}
Reply ACCEPT to take this job first.`;
      await sendSms(priorityConfig.phone, priorityMessage);
      prioritySmsResult = { success: true };
      console.log(`✅ Priority SMS sent to ${priorityConfig.name} (${priorityConfig.phone})`);
    } catch (smsErr) {
      prioritySmsResult = { success: false, error: smsErr.message };
      errors.push(`Priority SMS: ${smsErr.message}`);
      console.error('❌ Priority SMS failed:', smsErr.message);
    }

    // Step 2: Send owner notification SMS
    let ownerNotifyResult = { success: false, error: null };
    try {
      ownerNotifyResult = await sendOwnerNotification(priorityConfig.phone, testLead);
      if (ownerNotifyResult.success) {
        console.log(`✅ Owner notification sent (SID: ${ownerNotifyResult.messageId})`);
      } else {
        const reason = ownerNotifyResult.reason || ownerNotifyResult.error || 'skipped';
        console.warn(`⚠️ Owner notification skipped: ${reason}`);
        errors.push(`Owner notification: ${reason}`);
      }
    } catch (notifyErr) {
      ownerNotifyResult = { success: false, error: notifyErr.message };
      errors.push(`Owner notification: ${notifyErr.message}`);
      console.error('❌ Owner notification error:', notifyErr.message);
    }

    return res.json({
      ok: prioritySmsResult.success || ownerNotifyResult.success,
      // Enhanced fields per Part 5
      jobCreated: true,
      jobId: testLead._id,
      assignedPro: { name: priorityConfig.name, phone: priorityConfig.phone },
      prioritySmsSent: prioritySmsResult.success,
      ownerNotificationSent: ownerNotifyResult.success,
      errors,
      // Legacy fields (preserved for backward compat)
      ownerName: priorityConfig.name,
      sentTo: priorityConfig.phone,
      testLead,
      notifications: {
        prioritySms: prioritySmsResult,
        ownerNotification: {
          success: ownerNotifyResult.success,
          messageId: ownerNotifyResult.messageId || null,
          reason: ownerNotifyResult.reason || ownerNotifyResult.error || null
        }
      }
    });
  } catch (err) {
    console.error('❌ trigger-charlotte-test-job error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
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
router.get("/pros", async (req, res) => {
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
router.post("/pros", async (req, res) => {
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
router.put("/pros/:id/toggle", async (req, res) => {
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
router.delete("/pros/:id", async (req, res) => {
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
router.get("/stats", async (req, res) => {
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

// ✅ Alias route for professionals (for backward compatibility)
// Client expects /api/admin/professionals but server has /api/admin/pros
router.get("/professionals", async (req, res) => {
  try {
    console.log("🔄 Redirecting /professionals to /pros for compatibility");
    // Re-use the existing /pros logic
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
    console.error("❌ Error fetching professionals:", err.message);
    console.error("❌ Stack trace:", err.stack);
    // Return demo data instead of error
    res.json([
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
      }
    ]);
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

// ✅ Privacy Audit Log endpoint - View privacy-related actions (GDPR/CCPA compliance)
router.get('/privacy-audit-log', async (req, res) => {
  try {
    const { getPrivacyAuditLogs } = require('../middleware/privacyAudit');
    const limit = parseInt(req.query.limit) || 100;
    const logs = await getPrivacyAuditLogs(limit);
    
    res.json({
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    console.error('Error fetching privacy audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch privacy audit logs' });
  }
});

// ✅ Clean up old privacy logs endpoint
router.post('/privacy-audit-cleanup', async (req, res) => {
  try {
    const { cleanupOldPrivacyLogs } = require('../middleware/privacyAudit');
    const retentionDays = parseInt(req.body.retentionDays) || 365;
    const result = await cleanupOldPrivacyLogs(retentionDays);
    
    res.json({
      message: 'Privacy audit logs cleaned up',
      ...result
    });
  } catch (error) {
    console.error('Error cleaning up privacy logs:', error);
    res.status(500).json({ error: 'Failed to clean up privacy logs' });
  }
});

// ✅ Data retention statistics endpoint
router.get('/data-retention-stats', async (req, res) => {
  try {
    const { getRetentionStatistics } = require('../services/dataRetention');
    const stats = await getRetentionStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching retention statistics:', error);
    res.status(500).json({ error: 'Failed to fetch retention statistics' });
  }
});

// ✅ Run data retention tasks manually
router.post('/run-data-retention', async (req, res) => {
  try {
    const { runDataRetentionTasks } = require('../services/dataRetention');
    const result = await runDataRetentionTasks();
    res.json(result);
  } catch (error) {
    console.error('Error running data retention tasks:', error);
    res.status(500).json({ error: 'Failed to run data retention tasks' });
  }
});

// ✅ Get scheduled tasks status
router.get('/scheduled-tasks', async (req, res) => {
  try {
    const { getTasksStatus } = require('../services/scheduledTasks');
    const tasks = getTasksStatus();
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tasks' });
  }
});

// ✅ Manually trigger a scheduled task
router.post('/scheduled-tasks/:taskName/trigger', async (req, res) => {
  try {
    const { triggerTask } = require('../services/scheduledTasks');
    const { taskName } = req.params;
    
    console.log(`🚀 Manually triggering task: ${taskName}`);
    const result = await triggerTask(taskName);
    
    res.json({
      success: true,
      task: taskName,
      result
    });
  } catch (error) {
    console.error(`Error triggering task ${req.params.taskName}:`, error);
    res.status(500).json({ 
      error: 'Failed to trigger task',
      message: error.message 
    });
  }
});

// ── TEMPORARY: Meta-lead manual recovery (remove after successful execution) ──
// POST /api/admin/meta-leads/run-20260719-recovery
// Protected by requireAuth + requireAdmin (JWT ****** admin role).
// Idempotency: skips any lead whose normalized email or E.164 phone already
// exists in metaleads. Invoke once; remove this route after verification.
const _RECOVERY_20260719_SOURCE = 'recovered_meta_lead';
const _RECOVERY_20260719_LEADS = [
  {
    fullName: 'Booker Jones',
    email: 'devettajones@yahoo.com',
    phone: '+12294493677',
    trade: 'Painting',
    formId: '1913273286015217',
    submittedAt: '2026-07-19T23:51:00.000Z'
  },
  {
    fullName: 'Josh Larsen',
    email: 'jlarsen2@ymail.com',
    phone: '+19493754801',
    trade: 'General construction all trades',
    formId: '1913273286015217',
    submittedAt: '2026-07-19T22:41:00.000Z'
  },
  {
    fullName: 'John Adams',
    email: 'j47989121@gmail.com',
    phone: '+12832243704',
    trade: 'Contractor',
    formId: '1913273286015217',
    note: 'Original submission time unavailable.'
  }
];

async function _recovery20260719ProcessLead(leadInput) {
  const name = String(leadInput.fullName || '').trim() || 'Unknown lead';
  console.log(`[MANUAL_META_LEAD] Recovery started for ${name}`);

  const emailVal = String(leadInput.email || '').trim().toLowerCase();
  const phoneVal = String(leadInput.phone || '').trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  const phoneOk = /^\+\d{10,15}$/.test(phoneVal);
  const required = Boolean(leadInput.fullName && emailVal && phoneVal && leadInput.trade && leadInput.formId);

  if (!required || !emailOk || !phoneOk) {
    console.error(`[MANUAL_META_LEAD] Validation failed for ${name}`);
    return {
      name,
      collection: MetaLead.collection.name,
      source: _RECOVERY_20260719_SOURCE,
      success: false,
      status: 'FAILED',
      errorReason: 'Validation failed for required fields / email / phone format',
      mongoDocumentId: null,
      inviteCode: null,
      smsAttempted: false,
      twilioMessageSid: null,
      emailAttempted: false,
      sendGridMessageId: null,
      followUpScheduled: false,
      nextFollowUpDate: null
    };
  }

  console.log(`[MANUAL_META_LEAD] Validation passed for ${name}`);

  const result = await recoverManualMetaLead({
    ...leadInput,
    source: _RECOVERY_20260719_SOURCE
  });

  if (result.skipped) {
    return {
      name,
      mongoDocumentId: result.existingId ? String(result.existingId) : null,
      collection: MetaLead.collection.name,
      source: _RECOVERY_20260719_SOURCE,
      inviteCode: null,
      smsAttempted: false,
      twilioMessageSid: null,
      emailAttempted: false,
      sendGridMessageId: null,
      followUpScheduled: false,
      nextFollowUpDate: null,
      success: true,
      status: 'SKIPPED_DUPLICATE',
      errorReason: result.skippedReason || null
    };
  }

  const { lead, invitationCode, smsResult, emailResult } = result;
  console.log(`[META_DATABASE] Lead inserted id=${lead._id}`);
  console.log(`[META_INVITE] Invite code created lead=${lead._id}`);
  console.log(`[META_SMS] Initial SMS sent ${smsResult.success ? `sid=${smsResult.sid || 'none'}` : 'failed'}`);
  console.log(`[META_EMAIL] Initial email sent ${emailResult.success ? `id=${emailResult.messageId || 'none'}` : 'failed'}`);
  console.log(`[META_FOLLOWUP] Sequence scheduled ${lead.followUp && lead.followUp.nextFollowUpAt ? `next=${lead.followUp.nextFollowUpAt.toISOString()}` : ''}`);
  console.log(`[MANUAL_META_LEAD] Recovery completed for ${name}`);

  return {
    name,
    mongoDocumentId: String(lead._id),
    collection: MetaLead.collection.name,
    source: lead.source,
    inviteCode: invitationCode || null,
    smsAttempted: true,
    twilioMessageSid: smsResult.sid || null,
    emailAttempted: true,
    sendGridMessageId: emailResult.messageId || null,
    followUpScheduled: lead.followUp && lead.followUp.status === 'active',
    nextFollowUpDate: lead.followUp && lead.followUp.nextFollowUpAt
      ? lead.followUp.nextFollowUpAt.toISOString()
      : null,
    success: Boolean(smsResult.success && emailResult.success),
    status: smsResult.success && emailResult.success ? 'IMPORTED' : 'PARTIAL',
    errorReason: smsResult.success && emailResult.success
      ? null
      : `SMS: ${smsResult.error || smsResult.reason || 'missing_sid'}; Email: ${emailResult.error || emailResult.reason || 'missing_message_id'}`
  };
}

router.post('/meta-leads/run-20260719-recovery', async (req, res) => {
  console.log('[MANUAL_META_LEAD] Recovery batch started');
  const report = [];

  for (const lead of _RECOVERY_20260719_LEADS) {
    const name = String(lead.fullName || '').trim() || 'Unknown lead';
    try {
      const result = await _recovery20260719ProcessLead(lead);
      report.push(result);
    } catch (err) {
      console.error(`[MANUAL_META_LEAD] Error processing ${name}:`, err.message);
      report.push({
        name,
        mongoDocumentId: null,
        collection: MetaLead.collection.name,
        source: _RECOVERY_20260719_SOURCE,
        inviteCode: null,
        smsAttempted: false,
        twilioMessageSid: null,
        emailAttempted: false,
        sendGridMessageId: null,
        followUpScheduled: false,
        nextFollowUpDate: null,
        success: false,
        status: 'FAILED',
        errorReason: err.message
      });
    }
  }

  console.log('[MANUAL_META_LEAD] Recovery batch completed');
  return res.json({ ok: true, recovered: report.length, report });
});
// ── END TEMPORARY recovery endpoint ───────────────────────────────────────────

module.exports = router;
