// Enhanced SMS Handler for Twilio A2P 10DLC Compliance
// Addresses CTA verification issues and provides clear action paths

const express = require('express');
const twilio = require('twilio');
const router = express.Router();

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE;

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS client initialized');
} else {
    console.warn('⚠️ Twilio credentials missing - SMS disabled');
}

// Base URL for CTAs - update this with your actual domain
const BASE_URL = process.env.BASE_URL || 'https://fixlo.com';

// SMS Templates with Clear CTAs
const SMS_TEMPLATES = {
    // Job Lead Notification - Clear CTA to login and claim
    JOB_LEAD: (customerName, service, location, phone, jobId) => ({
        message: `🔧 New Job Alert: ${customerName} needs ${service} in ${location}. Contact: ${phone}. LOGIN to claim this job: ${BASE_URL}/login?job=${jobId}`,
        cta: 'LOGIN to claim job',
        action: 'login_and_claim'
    }),
    
    // Job Match Notification - Clear CTA to accept or view
    JOB_MATCH: (service, location, jobId) => ({
        message: `⚡ Fixlo Alert: You've been matched with a ${service} job in ${location}! REPLY "ACCEPT" to claim or LOGIN to view details: ${BASE_URL}/dashboard?job=${jobId}`,
        cta: 'REPLY "ACCEPT" or LOGIN to view',
        action: 'accept_or_view'
    }),
    
    // Job Reminder - Clear CTA with urgency
    JOB_REMINDER: (hoursLeft, jobId) => ({
        message: `⏰ Job Reminder: Unread job request expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}. LOGIN NOW to secure this lead: ${BASE_URL}/jobs/${jobId} - Reply STOP to opt out`,
        cta: 'LOGIN NOW to secure lead',
        action: 'login_urgent'
    }),
    
    // Job Confirmation - Clear CTA to view contract
    JOB_CONFIRMATION: (service, customerName, jobId) => ({
        message: `✅ Job Confirmation: You've been hired for ${service} work by ${customerName}! Customer will contact you soon. LOGIN to view contract: ${BASE_URL}/contracts/${jobId}`,
        cta: 'LOGIN to view contract',
        action: 'view_contract'
    }),
    
    // Welcome/Opt-in Confirmation - Clear CTA to complete profile
    WELCOME: (proName) => ({
        message: `Welcome to Fixlo, ${proName}! You're now subscribed to job alerts. COMPLETE your profile to start receiving leads: ${BASE_URL}/profile - Reply STOP to opt out`,
        cta: 'COMPLETE profile to start',
        action: 'complete_profile'
    }),
    
    // Help Response - Clear CTAs for all actions
    HELP: () => ({
        message: `Fixlo Help: Reply ACCEPT to claim jobs, LOGIN at ${BASE_URL}/login for dashboard, or STOP to unsubscribe. Need support? Email: pro4u.improvements@gmail.com`,
        cta: 'ACCEPT jobs, LOGIN, or STOP',
        action: 'help_menu'
    }),
    
    // Stop Confirmation - Clear confirmation of opt-out
    STOP_CONFIRMATION: () => ({
        message: `You have been unsubscribed from Fixlo job alerts. To resubscribe, visit ${BASE_URL}/sms-optin or reply START. Support: pro4u.improvements@gmail.com`,
        cta: 'Visit website or reply START',
        action: 'unsubscribed'
    })
};

// SMS Opt-in endpoint
router.post('/sms-optin', async (req, res) => {
    const { phone, proName, email } = req.body;
    
    if (!phone || !proName) {
        return res.status(400).json({ 
            success: false, 
            message: 'Phone number and name are required' 
        });
    }
    
    try {
        // Send welcome message with clear CTA
        const welcomeTemplate = SMS_TEMPLATES.WELCOME(proName);
        
        if (client) {
            await client.messages.create({
                body: welcomeTemplate.message,
                from: fromNumber,
                to: phone
            });
        }
        
        // Log the opt-in for compliance
        console.log(`SMS Opt-in: ${proName} (${phone}) - CTA: ${welcomeTemplate.cta}`);
        
        res.json({ 
            success: true, 
            message: 'SMS notifications enabled successfully',
            cta_provided: welcomeTemplate.cta
        });
        
    } catch (error) {
        console.error('SMS Opt-in Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to enable SMS notifications' 
        });
    }
});

// Job notification endpoint with clear CTAs
router.post('/send-job-notification', async (req, res) => {
    const { proPhone, customerName, service, location, phone, jobId, type = 'JOB_LEAD' } = req.body;
    
    if (!proPhone || !customerName || !service || !location || !jobId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields for job notification' 
        });
    }
    
    try {
        let template;
        
        switch(type) {
            case 'JOB_LEAD':
                template = SMS_TEMPLATES.JOB_LEAD(customerName, service, location, phone, jobId);
                break;
            case 'JOB_MATCH':
                template = SMS_TEMPLATES.JOB_MATCH(service, location, jobId);
                break;
            case 'JOB_REMINDER':
                template = SMS_TEMPLATES.JOB_REMINDER(req.body.hoursLeft || 1, jobId);
                break;
            case 'JOB_CONFIRMATION':
                template = SMS_TEMPLATES.JOB_CONFIRMATION(service, customerName, jobId);
                break;
            default:
                template = SMS_TEMPLATES.JOB_LEAD(customerName, service, location, phone, jobId);
        }
        
        if (client) {
            await client.messages.create({
                body: template.message,
                from: fromNumber,
                to: proPhone
            });
        }
        
        // Log for compliance tracking
        console.log(`Job SMS sent to ${proPhone} - Type: ${type} - CTA: ${template.cta}`);
        
        res.json({ 
            success: true, 
            message: 'Job notification sent successfully',
            cta_provided: template.cta,
            action_type: template.action
        });
        
    } catch (error) {
        console.error('Job Notification Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send job notification' 
        });
    }
});

// Handle incoming SMS responses (for ACCEPT, HELP, STOP)
router.post('/sms-webhook', async (req, res) => {
    const { Body, From } = req.body;
    const message = Body.toUpperCase().trim();
    const userPhone = From;
    
    let responseTemplate;
    
    switch(message) {
        case 'ACCEPT':
            // Handle priority pro job acceptance for Charlotte leads
            const PRIORITY_PRO_PHONE = '+15164449953';
            const normalizedPhone = userPhone.replace(/\D/g, '');
            const isPriorityPro = normalizedPhone.endsWith('5164449953');
            
            if (isPriorityPro) {
                try {
                    // Find the most recent pending Charlotte job that was priority notified
                    const mongoose = require('mongoose');
                    const JobRequest = require('./server/models/JobRequest');
                    
                    if (mongoose.connection.readyState === 1) {
                        const pendingJob = await JobRequest.findOne({
                            status: 'pending',
                            priorityNotified: true,
                            priorityPro: 'Walter Arevalo',
                            priorityAcceptedAt: null
                        }).sort({ priorityNotifiedAt: -1 });
                        
                        if (pendingJob) {
                            // Assign job to priority pro
                            await JobRequest.findByIdAndUpdate(pendingJob._id, {
                                status: 'assigned',
                                priorityAcceptedAt: new Date(),
                                assignedAt: new Date()
                            });
                            
                            // Send confirmation to priority pro
                            responseTemplate = {
                                message: `Fixlo: You have been assigned this Charlotte job. Customer will be notified.`,
                                cta: 'Job assigned',
                                action: 'priority_job_assigned'
                            };
                            
                            // Notify homeowner (if SMS consent given)
                            if (pendingJob.smsConsent && pendingJob.phone) {
                                try {
                                    await client.messages.create({
                                        body: 'Fixlo: Your job has been assigned and a technician is on the way.',
                                        from: fromNumber,
                                        to: pendingJob.phone
                                    });
                                    console.log(`📱 Homeowner notified of assignment for job ${pendingJob._id}`);
                                } catch (homeownerError) {
                                    console.error('Failed to notify homeowner:', homeownerError.message);
                                }
                            }
                            
                            console.log(`✅ Priority pro accepted Charlotte job ${pendingJob._id}`);
                        } else {
                            // No pending priority job found
                            responseTemplate = {
                                message: `No pending Charlotte jobs available at this time. You'll be notified of new opportunities.`,
                                cta: 'No jobs available',
                                action: 'no_priority_job'
                            };
                        }
                    } else {
                        throw new Error('Database not connected');
                    }
                } catch (acceptError) {
                    console.error('Error processing priority job acceptance:', acceptError.message);
                    responseTemplate = {
                        message: `Error processing your acceptance. Please contact support or try again later.`,
                        cta: 'Error occurred',
                        action: 'acceptance_error'
                    };
                }
            } else {
                // Standard job acceptance for non-priority pros
                responseTemplate = {
                    message: `✅ Job acceptance received! We'll notify the customer and send you their contact details. LOGIN to view job details: ${BASE_URL}/dashboard`,
                    cta: 'LOGIN to view job details',
                    action: 'job_accepted'
                };
            }
            break;
            
        case 'HELP':
            responseTemplate = SMS_TEMPLATES.HELP();
            break;
            
        case 'STOP':
        case 'UNSUBSCRIBE':
            responseTemplate = SMS_TEMPLATES.STOP_CONFIRMATION();
            // Update database to mark user as unsubscribed
            break;
            
        case 'START':
        case 'SUBSCRIBE':
            responseTemplate = {
                message: `Welcome back to Fixlo! You're now resubscribed to job alerts. COMPLETE your profile to receive leads: ${BASE_URL}/profile`,
                cta: 'COMPLETE profile',
                action: 'resubscribed'
            };
            break;
            
        default:
            responseTemplate = {
                message: `Thank you for your message. For job actions, reply ACCEPT. For help, reply HELP. To unsubscribe, reply STOP. LOGIN: ${BASE_URL}/login`,
                cta: 'ACCEPT, HELP, STOP, or LOGIN',
                action: 'unknown_command'
            };
    }
    
    try {
        if (client) {
            await client.messages.create({
                body: responseTemplate.message,
                from: fromNumber,
                to: userPhone
            });
        }
        
        // Log response for compliance
        console.log(`SMS Response sent to ${userPhone} - Command: ${message} - CTA: ${responseTemplate.cta}`);
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('SMS Webhook Error:', error);
        res.status(500).send('Error processing SMS');
    }
});

// URL shortener for CTAs (optional - helps with tracking)
router.post('/shorten-url', async (req, res) => {
    const { originalUrl, type, jobId } = req.body;
    
    // Simple URL shortener - in production, use bit.ly or similar
    const shortId = Math.random().toString(36).substr(2, 8);
    const shortUrl = `${BASE_URL}/r/${shortId}`;
    
    // Store mapping in database (not implemented here)
    console.log(`URL shortened: ${originalUrl} -> ${shortUrl} (Type: ${type}, Job: ${jobId})`);
    
    res.json({ 
        success: true, 
        shortUrl,
        originalUrl,
        trackingId: shortId
    });
});

// Compliance endpoint for Twilio verification
router.get('/sms-compliance', (req, res) => {
    res.json({
        service: 'Fixlo Professional Services',
        purpose: 'Job lead notifications and professional service alerts',
        opt_in_process: `${BASE_URL}/sms-optin`,
        opt_out_process: 'Reply STOP to any message',
        help_process: 'Reply HELP to any message',
        message_types: [
            'Job lead notifications with clear CTAs to login and claim',
            'Job match alerts with ACCEPT/VIEW options',
            'Job reminders with urgent login CTAs',
            'Job confirmations with contract viewing CTAs',
            'Welcome messages with profile completion CTAs',
            'Help responses with clear action options'
        ],
        cta_examples: [
            'LOGIN to claim job',
            'REPLY "ACCEPT" to claim',
            'LOGIN NOW to secure lead',
            'COMPLETE profile to start',
            'LOGIN to view contract'
        ],
        compliance_urls: [
            `${BASE_URL}/sms-optin`,
            `${BASE_URL}/login`,
            `${BASE_URL}/dashboard`,
            `${BASE_URL}/profile`,
            `${BASE_URL}/terms`,
            `${BASE_URL}/privacy`
        ]
    });
});

module.exports = router;
