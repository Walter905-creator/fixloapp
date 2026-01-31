/**
 * Centralized SMS Sender for Non-Referral Notifications
 * 
 * Implements the same reliability, safety, and observability as referral SMS:
 * - Idempotency (no duplicate sends)
 * - Opt-in enforcement
 * - Error handling and logging
 * - Compliance with TCPA/CTIA
 * 
 * CRITICAL: This handles ONLY non-referral SMS:
 * - Lead notifications to pros
 * - Homeowner confirmations
 * - Pro lead alerts
 * 
 * Referral SMS uses /server/services/referralNotification.js (DO NOT MODIFY)
 */

const { sendSms, sendWhatsAppMessage, isUSPhoneNumber } = require('./twilio');
const SmsNotification = require('../models/SmsNotification');

/**
 * SMS Templates for non-referral notifications
 * All include opt-out language for compliance
 */
const SMS_TEMPLATES = {
  // Homeowner confirmation after lead submission
  homeowner: {
    en: (data) => 
      `Fixlo: Your ${data.service} request in ${data.city} was received. ` +
      `We're matching you with verified pros who will contact you soon. Reply STOP to opt out.`,
    es: (data) =>
      `Fixlo: Recibimos tu solicitud de ${data.service} en ${data.city}. ` +
      `Te contactaremos con profesionales verificados pronto. Responde STOP para cancelar.`,
    pt: (data) =>
      `Fixlo: Recebemos seu pedido de ${data.service} em ${data.city}. ` +
      `Estamos conectando você com profissionais verificados. Responda STOP para cancelar.`
  },
  
  // Pro notification about new lead
  pro: {
    en: (data) => 
      `[${data.service}] ${data.location} – Contact: ${data.customerName} ${data.customerPhone}. Reply STOP to opt out.`,
    es: (data) =>
      `[${data.service}] ${data.location} – Contacto: ${data.customerName} ${data.customerPhone}. Responde STOP para cancelar.`,
    pt: (data) =>
      `[${data.service}] ${data.location} – Contato: ${data.customerName} ${data.customerPhone}. Responda STOP para cancelar.`
  },
  
  // Lead alert (generic lead notification)
  lead: {
    en: (data) =>
      `New lead for ${data.service} in ${data.city}. Check your Fixlo dashboard. Reply STOP to opt out.`,
    es: (data) =>
      `Nuevo cliente para ${data.service} en ${data.city}. Revisa tu panel de Fixlo. Responde STOP para cancelar.`,
    pt: (data) =>
      `Novo cliente para ${data.service} em ${data.city}. Verifique seu painel Fixlo. Responda STOP para cancelar.`
  }
};

/**
 * Detect language based on country code (matches referral logic)
 * @param {string} country - ISO country code
 * @returns {string} - Language code (en, es, pt)
 */
function detectLanguage(country) {
  const countryUpper = (country || 'US').toUpperCase();
  
  // Spanish-speaking countries
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(countryUpper)) {
    return 'es';
  }
  
  // Portuguese-speaking countries
  if (['BR', 'PT', 'AO', 'MZ'].includes(countryUpper)) {
    return 'pt';
  }
  
  // Default to English
  return 'en';
}

/**
 * Send non-referral SMS with idempotency and compliance checks
 * 
 * @param {object} options - SMS options
 * @param {string} options.phone - Recipient phone (E.164 format)
 * @param {string} options.notificationType - Type: 'lead', 'homeowner', 'pro'
 * @param {object} options.templateData - Data for SMS template
 * @param {string} options.leadId - Lead/JobRequest ID for idempotency
 * @param {string} options.userId - Recipient user ID (Pro ID or JobRequest ID)
 * @param {string} options.userModel - 'Pro' or 'JobRequest'
 * @param {boolean} options.smsConsent - User has consented to SMS
 * @param {boolean} options.smsOptOut - User has opted out
 * @param {boolean} options.whatsappOptIn - User opted in to WhatsApp (for non-US)
 * @param {string} options.country - Country code for language detection
 * 
 * @returns {Promise<object>} - Result with success status and details
 */
async function sendNonReferralSms(options) {
  const {
    phone,
    notificationType,
    templateData,
    leadId,
    userId,
    userModel,
    smsConsent,
    smsOptOut = false,
    whatsappOptIn = false,
    country = 'US'
  } = options;
  
  // Validate required fields
  if (!phone || !notificationType || !leadId || !userId) {
    console.error('❌ SMS sender: Missing required fields');
    return {
      success: false,
      reason: 'Missing required fields (phone, notificationType, leadId, or userId)'
    };
  }
  
  // Validate notification type
  if (!['lead', 'homeowner', 'pro'].includes(notificationType)) {
    console.error(`❌ Invalid notification type: ${notificationType}`);
    return {
      success: false,
      reason: `Invalid notificationType. Must be: lead, homeowner, or pro`
    };
  }
  
  try {
    // STEP 1: Check idempotency - prevent duplicate sends
    const alreadySent = await SmsNotification.wasAlreadySent(leadId, userId, notificationType);
    if (alreadySent) {
      console.log(`⏭️ SMS already sent: ${notificationType} to ${SmsNotification.maskPhoneNumber(phone)}`);
      return {
        success: false,
        reason: 'Duplicate notification prevented by idempotency check',
        idempotent: true
      };
    }
    
    // STEP 2: Compliance checks (same as referral SMS)
    const isUSA = country.toUpperCase() === 'US' || isUSPhoneNumber(phone);
    
    if (isUSA) {
      // USA: Require SMS consent
      if (!smsConsent || smsOptOut) {
        console.log(`📱 SMS not sent to ${SmsNotification.maskPhoneNumber(phone)}: consent=${smsConsent}, optOut=${smsOptOut}`);
        
        // Record the skipped notification
        await SmsNotification.recordNotification({
          notificationType,
          leadId,
          userId,
          userModel,
          phoneNumberMasked: SmsNotification.maskPhoneNumber(phone),
          status: 'failed',
          errorCode: 'NO_CONSENT',
          errorMessage: smsOptOut ? 'User opted out' : 'No SMS consent'
        });
        
        return {
          success: false,
          reason: smsOptOut ? 'User has opted out of SMS' : 'User has not consented to SMS'
        };
      }
    } else {
      // Non-USA: Require WhatsApp opt-in
      if (!whatsappOptIn) {
        console.log(`💬 WhatsApp not sent to ${SmsNotification.maskPhoneNumber(phone)}: No opt-in`);
        
        await SmsNotification.recordNotification({
          notificationType,
          leadId,
          userId,
          userModel,
          phoneNumberMasked: SmsNotification.maskPhoneNumber(phone),
          status: 'failed',
          errorCode: 'NO_WHATSAPP_OPTIN',
          errorMessage: 'User has not opted in to WhatsApp'
        });
        
        return {
          success: false,
          reason: 'User has not opted in to WhatsApp notifications'
        };
      }
    }
    
    // STEP 3: Generate message from template
    const language = detectLanguage(country);
    const template = SMS_TEMPLATES[notificationType]?.[language] || SMS_TEMPLATES[notificationType]?.en;
    
    if (!template) {
      console.error(`❌ No template found for ${notificationType}`);
      return {
        success: false,
        reason: `No SMS template found for notification type: ${notificationType}`
      };
    }
    
    const message = template(templateData);
    
    // STEP 4: Send SMS or WhatsApp based on country
    let result;
    let channelType;
    
    if (isUSA) {
      console.log(`📱 Sending ${notificationType} SMS to ${SmsNotification.maskPhoneNumber(phone)} (USA)`);
      result = await sendSms(phone, message);
      channelType = 'sms';
    } else {
      console.log(`💬 Sending ${notificationType} WhatsApp to ${SmsNotification.maskPhoneNumber(phone)} (${country})`);
      result = await sendWhatsAppMessage(phone, message);
      channelType = 'whatsapp';
    }
    
    // STEP 5: Record successful notification
    await SmsNotification.recordNotification({
      notificationType,
      leadId,
      userId,
      userModel,
      phoneNumberMasked: SmsNotification.maskPhoneNumber(phone),
      status: 'sent',
      twilioSid: result.sid,
      twilioStatus: result.status
    });
    
    console.log(`✅ ${notificationType} notification sent successfully`);
    console.log(`   Channel: ${channelType}`);
    console.log(`   Language: ${language}`);
    console.log(`   Twilio SID: ${result.sid}`);
    console.log(`   Masked Phone: ${SmsNotification.maskPhoneNumber(phone)}`);
    
    return {
      success: true,
      messageId: result.sid,
      channel: channelType,
      language: language,
      notificationType: notificationType
    };
    
  } catch (error) {
    console.error(`❌ Failed to send ${notificationType} SMS:`, error.message);
    
    // Record failed notification
    try {
      await SmsNotification.recordNotification({
        notificationType,
        leadId,
        userId,
        userModel,
        phoneNumberMasked: SmsNotification.maskPhoneNumber(phone),
        status: 'failed',
        errorCode: error.code || 'SEND_ERROR',
        errorMessage: error.message
      });
    } catch (recordError) {
      console.error('❌ Failed to record notification error:', recordError.message);
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}

/**
 * Send homeowner confirmation SMS after lead submission
 * Matches referral reliability pattern
 */
async function sendHomeownerConfirmation(lead) {
  if (!lead) {
    return { success: false, reason: 'No lead data provided' };
  }
  
  return sendNonReferralSms({
    phone: lead.phone,
    notificationType: 'homeowner',
    templateData: {
      service: lead.trade || lead.serviceType || 'service',
      city: lead.city || 'your area'
    },
    leadId: lead._id,
    userId: lead._id,
    userModel: 'JobRequest',
    smsConsent: lead.smsConsent,
    smsOptOut: lead.smsOptOut,
    country: lead.country || 'US'
  });
}

/**
 * Send pro alert about new lead
 * Matches referral reliability pattern
 */
async function sendProLeadAlert(pro, lead) {
  if (!pro || !lead) {
    return { success: false, reason: 'Missing pro or lead data' };
  }
  
  // Determine channel based on country
  const isUSA = pro.country === 'US' || isUSPhoneNumber(pro.phone);
  
  return sendNonReferralSms({
    phone: pro.phone,
    notificationType: 'pro',
    templateData: {
      service: lead.trade || lead.serviceType || 'Service Request',
      location: lead.city && lead.state 
        ? `${lead.city}, ${lead.state}` 
        : lead.address || 'Location provided',
      customerName: lead.name || 'Customer',
      customerPhone: lead.phone || 'N/A'
    },
    leadId: lead._id,
    userId: pro._id,
    userModel: 'Pro',
    smsConsent: pro.smsConsent,
    smsOptOut: false, // Pros don't have opt-out on Pro model
    whatsappOptIn: pro.whatsappOptIn,
    country: pro.country || 'US'
  });
}

/**
 * Send generic lead notification
 * For backward compatibility with existing code
 */
async function sendLeadNotification(pro, lead) {
  return sendProLeadAlert(pro, lead);
}

module.exports = {
  sendNonReferralSms,
  sendHomeownerConfirmation,
  sendProLeadAlert,
  sendLeadNotification,
  detectLanguage,
  SMS_TEMPLATES
};
