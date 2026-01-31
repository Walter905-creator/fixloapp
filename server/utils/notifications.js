/**
 * Notification Service for Fixlo
 * Handles SMS, WhatsApp, and Email notifications to professionals
 * 
 * UPDATED: Now uses centralized SMS sender with idempotency protection
 * 
 * COMPLIANCE RULES:
 * 1. USA professionals: SMS + Email only (existing behavior)
 * 2. Non-US professionals with WhatsApp opt-in: WhatsApp + Email
 * 3. Non-US professionals without opt-in: Email only
 * 4. All WhatsApp messages are transactional only (job leads)
 * 5. WhatsApp requires explicit user opt-in
 * 6. Idempotency: No duplicate SMS per lead-pro pair
 */

const { sendProLeadAlert } = require('./smsSender');
const { sendLeadNotificationEmail, isEmailEnabled } = require('./email');
const { isUSPhoneNumber } = require('./twilio');

/**
 * Notify a professional about a new lead
 * Routes notification based on country and opt-in preferences
 * 
 * @param {object} pro - Professional object from database
 * @param {object} lead - Lead/JobRequest object
 * @returns {Promise<object>} Notification results
 */
async function notifyProOfLead(pro, lead) {
  const results = {
    sms: { attempted: false, success: false, error: null },
    whatsapp: { attempted: false, success: false, error: null },
    email: { attempted: false, success: false, error: null }
  };

  // Validate inputs
  if (!pro || !lead) {
    console.error('❌ notifyProOfLead: Missing pro or lead data');
    return results;
  }

  if (!pro.wantsNotifications) {
    console.log(`⏭️ Pro ${pro._id} has notifications disabled`);
    return results;
  }

  // Prepare notification data
  const leadData = {
    service: lead.trade || lead.serviceType || 'Service Request',
    location: lead.city && lead.state 
      ? `${lead.city}, ${lead.state}` 
      : lead.address || 'Location provided',
    budget: lead.budget || 'Contact for details',
    customerName: lead.name || 'Customer',
    customerPhone: lead.phone || 'N/A'
  };

  // Determine if pro is in USA based on country field or phone number
  const isUSPro = (pro.country === 'US') || isUSPhoneNumber(pro.phone);

  console.log(`📞 Notifying Pro ${pro._id} (${pro.name}) - Country: ${isUSPro ? 'USA' : 'International'}`);

  // CHANNEL ROUTING LOGIC
  if (isUSPro) {
    // USA: SMS + Email (existing behavior - DO NOT BREAK)
    console.log('🇺🇸 USA Pro - Using SMS + Email');
    
    // Send SMS if pro has SMS consent using centralized sender with idempotency
    if (pro.smsConsent) {
      results.sms.attempted = true;
      try {
        console.log(`📲 Sending job SMS to pro via centralized sender`);
        const smsResult = await sendProLeadAlert(pro, lead);
        
        if (smsResult.success) {
          results.sms.success = true;
          console.log(`✅ SMS notification sent successfully (SID: ${smsResult.messageId})`);
        } else {
          results.sms.error = smsResult.reason || smsResult.error;
          // Don't log as error if it's idempotent skip
          if (smsResult.idempotent) {
            console.log(`⏭️ SMS already sent - idempotency check prevented duplicate`);
          } else {
            console.error(`❌ SMS notification failed: ${results.sms.error}`);
          }
        }
      } catch (error) {
        results.sms.error = error.message;
        console.error(`❌ SMS notification error:`, error.message);
      }
    } else {
      console.log(`⏭️ Pro ${pro._id} has not consented to SMS`);
    }

    // Always send email as fallback
    if (isEmailEnabled() && pro.email) {
      results.email.attempted = true;
      try {
        await sendLeadNotificationEmail(pro.email, leadData);
        results.email.success = true;
        console.log(`✅ Email notification sent to ${pro.email}`);
      } catch (error) {
        results.email.error = error.message;
        console.error(`❌ Email notification failed for ${pro.email}:`, error.message);
      }
    }

  } else {
    // NON-US: WhatsApp (if opted-in) + Email
    console.log('🌍 International Pro - Using WhatsApp + Email');

    // Send WhatsApp if pro has opted in using centralized sender with idempotency
    if (pro.whatsappOptIn) {
      results.whatsapp.attempted = true;
      try {
        console.log(`💬 Sending WhatsApp via centralized sender`);
        const whatsappResult = await sendProLeadAlert(pro, lead);
        
        if (whatsappResult.success) {
          results.whatsapp.success = true;
          console.log(`✅ WhatsApp notification sent successfully (SID: ${whatsappResult.messageId})`);
        } else {
          results.whatsapp.error = whatsappResult.reason || whatsappResult.error;
          // Don't log as error if it's idempotent skip
          if (whatsappResult.idempotent) {
            console.log(`⏭️ WhatsApp already sent - idempotency check prevented duplicate`);
          } else {
            console.error(`❌ WhatsApp notification failed: ${results.whatsapp.error}`);
          }
        }
      } catch (error) {
        results.whatsapp.error = error.message;
        console.error(`❌ WhatsApp notification error:`, error.message);
        // Continue to email fallback
      }
    } else {
      console.log(`⏭️ Pro ${pro._id} has not opted in to WhatsApp notifications`);
    }

    // Always send email as fallback for international pros
    if (isEmailEnabled() && pro.email) {
      results.email.attempted = true;
      try {
        await sendLeadNotificationEmail(pro.email, leadData);
        results.email.success = true;
        console.log(`✅ Email notification sent to ${pro.email}`);
      } catch (error) {
        results.email.error = error.message;
        console.error(`❌ Email notification failed for ${pro.email}:`, error.message);
      }
    }
  }

  // Log summary
  const successCount = [results.sms.success, results.whatsapp.success, results.email.success].filter(Boolean).length;
  console.log(`📊 Notification summary for Pro ${pro._id}: ${successCount} successful delivery(s)`);

  return results;
}

/**
 * Notify multiple professionals about a new lead
 * @param {Array<object>} pros - Array of professional objects
 * @param {object} lead - Lead/JobRequest object
 * @returns {Promise<Array<object>>} Array of notification results
 */
async function notifyProsOfLead(pros, lead) {
  console.log(`📢 Notifying ${pros.length} professionals about new lead`);
  
  const results = await Promise.allSettled(
    pros.map(pro => notifyProOfLead(pro, lead))
  );

  const successfulNotifications = results.filter(r => r.status === 'fulfilled').length;
  console.log(`📊 Successfully notified ${successfulNotifications}/${pros.length} professionals`);

  return results;
}

module.exports = {
  notifyProOfLead,
  notifyProsOfLead
};
