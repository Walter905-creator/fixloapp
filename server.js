// Main Server for Fixlo Platform
// Handles service requests, professional signup, and SMS notifications

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Import routes
const smsHandler = require('./sms-handler');
const urlRedirects = require('./url-redirects');

// Use routes
app.use('/api', smsHandler);
app.use('/', urlRedirects);

// In-memory storage (replace with database in production)
const storage = {
    serviceRequests: new Map(),
    professionals: new Map(),
    jobMatches: new Map()
};

// Service request endpoint
app.post('/api/service-request', async (req, res) => {
    try {
        const {
            serviceType,
            name,
            phone,
            email,
            address,
            description,
            urgency,
            budget
        } = req.body;

        // Validate required fields
        if (!serviceType || !name || !phone || !email || !address || !description || !urgency) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Generate unique job ID
        const jobId = uuidv4();
        const timestamp = new Date().toISOString();

        // Store service request
        const serviceRequest = {
            id: jobId,
            serviceType,
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            serviceAddress: address,
            description,
            urgency,
            budget: budget || 'Not specified',
            status: 'open',
            createdAt: timestamp,
            responses: []
        };

        storage.serviceRequests.set(jobId, serviceRequest);

        // Find matching professionals
        const matchingPros = findMatchingProfessionals(serviceType, address);
        
        console.log(`📋 New Service Request: ${serviceType} in ${address}`);
        console.log(`🔍 Found ${matchingPros.length} matching professionals`);

        // Send SMS notifications to matching professionals
        if (matchingPros.length > 0) {
            await notifyProfessionals(serviceRequest, matchingPros);
        }

        // Log the request
        console.log(`✅ Service request created: ${jobId}`);
        console.log(`   Customer: ${name} (${phone})`);
        console.log(`   Service: ${serviceType}`);
        console.log(`   Location: ${address}`);
        console.log(`   Urgency: ${urgency}`);

        res.json({
            success: true,
            message: 'Service request submitted successfully!',
            jobId: jobId,
            matchingPros: matchingPros.length,
            estimatedResponse: urgency === 'emergency' ? '15-30 minutes' : 
                             urgency === 'urgent' ? '1-4 hours' : 
                             '4-24 hours'
        });

    } catch (error) {
        console.error('Service request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit service request. Please try again.'
        });
    }
});

// Professional signup endpoint
app.post('/api/pro-signup', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            trade,
            location,
            dob,
            experience,
            description,
            smsConsent
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !trade || !location || !dob || !smsConsent) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided and SMS consent is required'
            });
        }

        // Validate age (18+)
        const birthDate = new Date(dob);
        const today = new Date();
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (age < 18) {
            return res.status(400).json({
                success: false,
                message: 'You must be 18 or older to join as a professional'
            });
        }

        // Generate professional ID
        const proId = uuidv4();
        const timestamp = new Date().toISOString();

        // Store professional profile
        const professional = {
            id: proId,
            name,
            email,
            phone,
            primaryTrade: trade,
            serviceLocation: location,
            dateOfBirth: dob,
            yearsExperience: experience || 0,
            description: description || '',
            smsConsent: true,
            status: 'pending_payment',
            verificationStatus: 'pending',
            createdAt: timestamp,
            subscription: {
                plan: 'professional',
                price: 59.99,
                status: 'pending'
            }
        };

        storage.professionals.set(proId, professional);

        // Send welcome SMS
        const smsModule = require('./sms-handler');
        if (smsModule.sendWelcomeSMS) {
            await smsModule.sendWelcomeSMS(phone, name, email);
        }

        console.log(`👨‍🔧 New Professional Signup: ${name} (${trade})`);
        console.log(`   Location: ${location}`);
        console.log(`   Experience: ${experience} years`);
        console.log(`   Phone: ${phone}`);

        res.json({
            success: true,
            message: 'Professional profile created successfully!',
            proId: proId,
            redirectUrl: `/payment?pro=${proId}`,
            welcomeSMSSent: true
        });

    } catch (error) {
        console.error('Professional signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create professional profile. Please try again.'
        });
    }
});

// Job response endpoint
app.post('/api/job-response', async (req, res) => {
    try {
        const { jobId, proId, responseType, message } = req.body;

        const serviceRequest = storage.serviceRequests.get(jobId);
        const professional = storage.professionals.get(proId);

        if (!serviceRequest || !professional) {
            return res.status(404).json({
                success: false,
                message: 'Job or professional not found'
            });
        }

        // Add response to job
        const response = {
            proId,
            proName: professional.name,
            proPhone: professional.phone,
            responseType, // 'interested', 'accepted', 'declined'
            message: message || '',
            timestamp: new Date().toISOString()
        };

        serviceRequest.responses.push(response);

        // Update job status if accepted
        if (responseType === 'accepted') {
            serviceRequest.status = 'assigned';
            serviceRequest.assignedPro = proId;
        }

        console.log(`📞 Job Response: ${professional.name} ${responseType} job ${jobId}`);

        res.json({
            success: true,
            message: 'Response recorded successfully',
            jobStatus: serviceRequest.status
        });

    } catch (error) {
        console.error('Job response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record response'
        });
    }
});

// Get job details endpoint
app.get('/api/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const serviceRequest = storage.serviceRequests.get(jobId);

    if (!serviceRequest) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }

    res.json({
        success: true,
        job: serviceRequest
    });
});

// Professional dashboard endpoint
app.get('/api/dashboard/:proId', (req, res) => {
    const { proId } = req.params;
    const professional = storage.professionals.get(proId);

    if (!professional) {
        return res.status(404).json({
            success: false,
            message: 'Professional not found'
        });
    }

    // Get jobs for this professional's trade and location
    const availableJobs = Array.from(storage.serviceRequests.values())
        .filter(job => 
            job.status === 'open' && 
            job.serviceType === professional.primaryTrade
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        professional,
        availableJobs: availableJobs.slice(0, 10) // Latest 10 jobs
    });
});

// Helper functions
function findMatchingProfessionals(serviceType, location) {
    const matchingPros = Array.from(storage.professionals.values())
        .filter(pro => 
            pro.primaryTrade === serviceType && 
            pro.status === 'active' &&
            pro.smsConsent === true
        );

    // In a real implementation, you'd use geocoding to match locations
    // For now, we'll just return all matching trade professionals
    return matchingPros;
}

async function notifyProfessionals(serviceRequest, professionals) {
    const smsModule = require('./sms-handler');
    
    for (const pro of professionals) {
        try {
            if (smsModule.sendJobAlert) {
                await smsModule.sendJobAlert(
                    pro.phone,
                    serviceRequest.customerName,
                    serviceRequest.serviceType,
                    serviceRequest.serviceAddress,
                    serviceRequest.customerPhone,
                    serviceRequest.id
                );
                
                console.log(`📱 SMS sent to ${pro.name} (${pro.phone})`);
            }
        } catch (error) {
            console.error(`Failed to send SMS to ${pro.name}:`, error);
        }
    }
}

// Admin authentication
const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL || 'admin@fixloapp.com',
    password: process.env.ADMIN_PASSWORD || 'FixloAdmin2024!'
};

// Simple JWT-like token generation (use proper JWT in production)
function generateAdminToken(email) {
    const timestamp = Date.now();
    return Buffer.from(`${email}:${timestamp}`).toString('base64');
}

function verifyAdminToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [email, timestamp] = decoded.split(':');
        
        // Token expires after 24 hours
        const tokenAge = Date.now() - parseInt(timestamp);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (tokenAge > twentyFourHours) {
            return null;
        }
        
        return { email, timestamp };
    } catch (error) {
        return null;
    }
}

// Admin login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const token = generateAdminToken(email);
        res.json({
            success: true,
            token,
            admin: {
                email: email,
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});

// Admin middleware
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Authorization token required'
        });
    }
    
    const token = authHeader.substring(7);
    const admin = verifyAdminToken(token);
    
    if (!admin) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
    
    req.admin = admin;
    next();
}

// Admin stats endpoint
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    const serviceRequests = Array.from(storage.serviceRequests.values());
    const professionals = Array.from(storage.professionals.values());
    
    const activePros = professionals.filter(pro => pro.status === 'active' || pro.isActive).length;
    const pendingPros = professionals.filter(pro => pro.status === 'pending_payment' || pro.paymentStatus === 'pending').length;
    
    const stats = {
        totalPros: professionals.length,
        activePros: activePros,
        pendingPros: pendingPros,
        overview: {
            totalServiceRequests: serviceRequests.length,
            totalProfessionals: professionals.length,
            activeJobs: serviceRequests.filter(job => job.status === 'open').length,
            completedJobs: serviceRequests.filter(job => job.status === 'completed').length
        },
        recent: {
            serviceRequests: serviceRequests
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10),
            professionals: professionals
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)
        },
        analytics: {
            requestsByService: {},
            requestsByUrgency: {},
            professionalsByTrade: {}
        }
    };
    
    // Calculate analytics
    serviceRequests.forEach(req => {
        stats.analytics.requestsByService[req.serviceType] = 
            (stats.analytics.requestsByService[req.serviceType] || 0) + 1;
        stats.analytics.requestsByUrgency[req.urgency] = 
            (stats.analytics.requestsByUrgency[req.urgency] || 0) + 1;
    });
    
    professionals.forEach(pro => {
        stats.analytics.professionalsByTrade[pro.primaryTrade] = 
            (stats.analytics.professionalsByTrade[pro.primaryTrade] || 0) + 1;
    });
    
    res.json({
        success: true,
        stats
    });
});

// Admin service requests endpoint
app.get('/api/admin/service-requests', requireAdmin, (req, res) => {
    const requests = Array.from(storage.serviceRequests.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        success: true,
        requests
    });
});

// Admin professionals endpoint
app.get('/api/admin/professionals', requireAdmin, (req, res) => {
    const professionals = Array.from(storage.professionals.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        success: true,
        professionals
    });
});

// Admin pros endpoint (alias for compatibility with admin.html)
app.get('/api/admin/pros', requireAdmin, (req, res) => {
    const professionals = Array.from(storage.professionals.values())
        .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
    
    // Return the professionals array directly (admin.html expects an array)
    res.json(professionals);
});

// Admin pro toggle endpoint
app.post('/api/admin/pros/:id/toggle', requireAdmin, (req, res) => {
    const { id } = req.params;
    const professional = storage.professionals.get(id);
    
    if (!professional) {
        return res.status(404).json({
            success: false,
            error: 'Professional not found'
        });
    }
    
    // Toggle active status
    professional.isActive = !professional.isActive;
    professional.lastUpdated = new Date().toISOString();
    
    storage.professionals.set(id, professional);
    
    res.json({
        success: true,
        message: `Professional ${professional.isActive ? 'activated' : 'deactivated'}`,
        professional
    });
});

// Admin pro toggle endpoint (PUT method for compatibility with admin.html)
app.put('/api/admin/pros/:id/toggle', requireAdmin, (req, res) => {
    const { id } = req.params;
    const professional = storage.professionals.get(id);
    
    if (!professional) {
        return res.status(404).json({
            success: false,
            error: 'Professional not found'
        });
    }
    
    // Toggle active status
    professional.isActive = !professional.isActive;
    professional.lastUpdated = new Date().toISOString();
    
    storage.professionals.set(id, professional);
    
    res.json({
        success: true,
        message: `Professional ${professional.isActive ? 'activated' : 'deactivated'}`,
        professional
    });
});

// Admin delete pro endpoint
app.delete('/api/admin/pros/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const professional = storage.professionals.get(id);
    
    if (!professional) {
        return res.status(404).json({
            success: false,
            error: 'Professional not found'
        });
    }
    
    storage.professionals.delete(id);
    
    res.json({
        success: true,
        message: 'Professional deleted successfully'
    });
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        timestamp: new Date().toISOString(),
        stats: {
            totalServiceRequests: storage.serviceRequests.size,
            totalProfessionals: storage.professionals.size,
            activeJobs: Array.from(storage.serviceRequests.values())
                .filter(job => job.status === 'open').length
        }
    });
});

// Alternative status-api endpoint (for external services that might call this)
app.get('/status-api', (req, res) => {
    console.log(`🔍 Status API request from origin: ${req.headers.origin || 'unknown'}`);
    res.json({
        success: true,
        status: 'operational',
        message: 'Fixlo Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        stats: {
            totalServiceRequests: storage.serviceRequests.size,
            totalProfessionals: storage.professionals.size,
            activeJobs: Array.from(storage.serviceRequests.values())
                .filter(job => job.status === 'open').length
        }
    });
});

// Serve static files and handle routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/sms-optin', (req, res) => {
    res.sendFile(path.join(__dirname, 'sms-optin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fixlo Server running on port ${PORT}`);
    console.log(`📱 SMS notifications: ${process.env.TWILIO_ACCOUNT_SID ? 'Enabled' : 'Disabled (missing Twilio config)'}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    
    // Add some sample professionals for testing
    addSampleProfessionals();
});

// Add sample professionals for testing
function addSampleProfessionals() {
    const samplePros = [
        {
            _id: 'pro-1',
            id: 'pro-1',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+1234567890',
            trade: 'plumbing',
            primaryTrade: 'plumbing',
            serviceLocation: 'New York, NY',
            yearsExperience: 8,
            status: 'active',
            isActive: true,
            paymentStatus: 'active',
            smsConsent: true,
            verificationStatus: 'verified',
            createdAt: new Date().toISOString()
        },
        {
            _id: 'pro-2',
            id: 'pro-2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+1234567891',
            trade: 'electrical',
            primaryTrade: 'electrical',
            serviceLocation: 'New York, NY',
            yearsExperience: 5,
            status: 'active',
            isActive: true,
            paymentStatus: 'active',
            smsConsent: true,
            verificationStatus: 'verified',
            createdAt: new Date().toISOString()
        },
        {
            _id: 'pro-3',
            id: 'pro-3',
            name: 'Mike Wilson',
            email: 'mike@example.com',
            phone: '+1234567892',
            trade: 'carpentry',
            primaryTrade: 'carpentry',
            serviceLocation: 'New York, NY',
            yearsExperience: 12,
            status: 'pending_payment',
            isActive: false,
            paymentStatus: 'pending',
            smsConsent: true,
            verificationStatus: 'verified',
            createdAt: new Date().toISOString()
        }
    ];

    samplePros.forEach(pro => {
        storage.professionals.set(pro.id, pro);
    });

    console.log(`✅ Added ${samplePros.length} sample professionals for testing`);
}

module.exports = app;
