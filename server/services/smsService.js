const { sendSms } = require('../utils/twilio');

// Compliant SMS templates with opt-out disclosure
const SMS_TEMPLATES = {
  REQUEST_SUBMITTED: (name) => 
    `Fixlo: Your home service request has been received. We'll contact you shortly to confirm your visit. Reply STOP to opt out.`,
  
  VISIT_SCHEDULED: (date, time) => 
    `Fixlo: Your Fixlo service visit is scheduled for ${date} at ${time}. Reply STOP to opt out.`,
  
  TECHNICIAN_ARRIVED: () => 
    `Fixlo: Your Fixlo technician has arrived and started work at your location. Reply STOP to opt out.`,
  
  JOB_COMPLETED: () => 
    `Fixlo: Your service is complete. Your invoice has been sent. Thank you for choosing Fixlo. Reply STOP to opt out.`,
  
  JOB_ASSIGNED: (technicianName) => 
    `Fixlo: Your job has been assigned to ${technicianName}. They will contact you soon. Reply STOP to opt out.`
};

/**
 * Send SMS notification for job event
 * @param {string} phone - Customer phone number (E.164 format)
 * @param {string} eventType - Type of event (submitted, scheduled, arrived, completed, assigned)
 * @param {object} data - Additional data for template (date, time, technicianName, etc.)
 * @param {boolean} smsConsent - Whether customer has opted in to SMS
 * @param {boolean} smsOptOut - Whether customer has opted out
 * @returns {Promise<object>} - Twilio message result
 */
async function sendJobNotification(phone, eventType, data = {}, smsConsent = false, smsOptOut = false) {
  // Check if SMS is enabled and customer has consented
  if (!smsConsent || smsOptOut) {
    console.log(`📱 SMS not sent to ${phone}: consent=${smsConsent}, optOut=${smsOptOut}`);
    return { disabled: true, reason: 'No consent or opted out' };
  }

  let message = '';
  
  switch (eventType) {
    case 'submitted':
      message = SMS_TEMPLATES.REQUEST_SUBMITTED(data.name);
      break;
    case 'scheduled':
      message = SMS_TEMPLATES.VISIT_SCHEDULED(data.date, data.time);
      break;
    case 'arrived':
    case 'clock-in':
      message = SMS_TEMPLATES.TECHNICIAN_ARRIVED();
      break;
    case 'completed':
      message = SMS_TEMPLATES.JOB_COMPLETED();
      break;
    case 'assigned':
      message = SMS_TEMPLATES.JOB_ASSIGNED(data.technicianName || 'a technician');
      break;
    default:
      console.warn(`⚠️ Unknown SMS event type: ${eventType}`);
      return { disabled: true, reason: 'Unknown event type' };
  }

  try {
    const result = await sendSms(phone, message);
    console.log(`✅ SMS sent to ${phone} for event: ${eventType}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
    throw error;
  }
}

/**
 * Handle STOP request from customer
 * @param {string} jobId - Job request ID
 * @returns {Promise<object>} - Updated job with opt-out flag
 */
async function handleSmsOptOut(jobId) {
  const JobRequest = require('../models/JobRequest');
  
  try {
    const job = await JobRequest.findByIdAndUpdate(
      jobId,
      {
        smsOptOut: true,
        smsOptOutAt: new Date()
      },
      { new: true }
    );
    
    console.log(`✅ SMS opt-out processed for job: ${jobId}`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to process opt-out for job ${jobId}:`, error.message);
    throw error;
  }
}

/**
 * Send notification when job request is submitted
 */
async function notifyRequestSubmitted(job) {
  if (!job.phone || !job.smsConsent) {
    return { disabled: true };
  }
  
  return sendJobNotification(
    job.phone, 
    'submitted', 
    { name: job.name }, 
    job.smsConsent, 
    job.smsOptOut
  );
}

/**
 * Send notification when visit is scheduled
 */
async function notifyVisitScheduled(job, scheduledDate, scheduledTime) {
  if (!job.phone || !job.smsConsent) {
    return { disabled: true };
  }
  
  const dateStr = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  return sendJobNotification(
    job.phone, 
    'scheduled', 
    { date: dateStr, time: scheduledTime }, 
    job.smsConsent, 
    job.smsOptOut
  );
}

/**
 * Send notification when technician clocks in
 */
async function notifyTechnicianArrived(job) {
  if (!job.phone || !job.smsConsent) {
    return { disabled: true };
  }
  
  return sendJobNotification(
    job.phone, 
    'arrived', 
    {}, 
    job.smsConsent, 
    job.smsOptOut
  );
}

/**
 * Send notification when job is completed
 */
async function notifyJobCompleted(job) {
  if (!job.phone || !job.smsConsent) {
    return { disabled: true };
  }
  
  return sendJobNotification(
    job.phone, 
    'completed', 
    {}, 
    job.smsConsent, 
    job.smsOptOut
  );
}

/**
 * Send notification when job is assigned to a technician
 */
async function notifyJobAssigned(job, technicianName) {
  if (!job.phone || !job.smsConsent) {
    return { disabled: true };
  }
  
  return sendJobNotification(
    job.phone, 
    'assigned', 
    { technicianName }, 
    job.smsConsent, 
    job.smsOptOut
  );
}

module.exports = {
  sendJobNotification,
  handleSmsOptOut,
  notifyRequestSubmitted,
  notifyVisitScheduled,
  notifyTechnicianArrived,
  notifyJobCompleted,
  notifyJobAssigned
};
