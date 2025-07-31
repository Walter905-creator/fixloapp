// URL Redirects for SMS CTA Verification
// Creates trackable URLs that Twilio can verify

const express = require('express');
const router = express.Router();

// Redirect tracking for compliance
const redirectLog = [];

// Job-specific login redirect
router.get('/login', (req, res) => {
    const jobId = req.query.job;
    const source = req.query.source || 'sms';
    
    // Log for compliance tracking
    redirectLog.push({
        timestamp: new Date(),
        type: 'login',
        jobId,
        source,
        ip: req.ip
    });
    
    if (jobId) {
        // Redirect to job-specific login page
        res.redirect(`https://www.fixloapp.com/login?job=${jobId}&source=${source}`);
    } else {
        // General login redirect
        res.redirect(`https://www.fixloapp.com/login?source=${source}`);
    }
});

// Dashboard redirect with job context
router.get('/dashboard', (req, res) => {
    const jobId = req.query.job;
    const source = req.query.source || 'sms';
    
    redirectLog.push({
        timestamp: new Date(),
        type: 'dashboard',
        jobId,
        source,
        ip: req.ip
    });
    
    if (jobId) {
        res.redirect(`https://www.fixloapp.com/dashboard?job=${jobId}&source=${source}`);
    } else {
        res.redirect(`https://www.fixloapp.com/dashboard?source=${source}`);
    }
});

// Job-specific page redirect
router.get('/jobs/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const source = req.query.source || 'sms';
    
    redirectLog.push({
        timestamp: new Date(),
        type: 'job_view',
        jobId,
        source,
        ip: req.ip
    });
    
    res.redirect(`https://www.fixloapp.com/jobs/${jobId}?source=${source}`);
});

// Contract viewing redirect
router.get('/contracts/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const source = req.query.source || 'sms';
    
    redirectLog.push({
        timestamp: new Date(),
        type: 'contract_view',
        jobId,
        source,
        ip: req.ip
    });
    
    res.redirect(`https://www.fixloapp.com/contracts/${jobId}?source=${source}`);
});

// Profile completion redirect
router.get('/profile', (req, res) => {
    const source = req.query.source || 'sms';
    
    redirectLog.push({
        timestamp: new Date(),
        type: 'profile',
        source,
        ip: req.ip
    });
    
    res.redirect(`https://www.fixloapp.com/profile?source=${source}`);
});

// Short URL redirects (r/shortcode)
router.get('/r/:shortId', (req, res) => {
    const shortId = req.params.shortId;
    
    // In production, look up shortId in database
    // For now, redirect to main dashboard
    redirectLog.push({
        timestamp: new Date(),
        type: 'short_url',
        shortId,
        ip: req.ip
    });
    
    res.redirect(`https://www.fixloapp.com/dashboard?ref=${shortId}`);
});

// Compliance tracking endpoint
router.get('/redirect-stats', (req, res) => {
    const stats = {
        total_redirects: redirectLog.length,
        last_24_hours: redirectLog.filter(log => 
            Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000
        ).length,
        by_type: redirectLog.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
        }, {}),
        recent_activity: redirectLog.slice(-10)
    };
    
    res.json(stats);
});

module.exports = router;
