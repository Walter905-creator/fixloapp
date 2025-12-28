// server/services/referralNotification.js
const { sendSms, sendWhatsApp } = require('../utils/twilio');

/**
 * COMPLIANCE: Referral reward notifications
 * 
 * CRITICAL RULES:
 * - SMS for USA only
 * - WhatsApp for non-USA countries
 * - Respect opt-in preferences
 * - Multilingual support (English, Spanish, Portuguese)
 * - Transactional messages only
 */

/**
 * Multilingual notification templates
 */
const NOTIFICATION_TEMPLATES = {
  en: {
    subject: '🎉 You earned a FREE month on Fixlo!',
    body: (promoCode) => 
      `🎉 You earned a FREE month on Fixlo!\n\n` +
      `Your referral just joined and activated their membership.\n\n` +
      `Use this promo code on your next billing cycle:\n${promoCode}\n\n` +
      `Reply STOP to opt out.`
  },
  es: {
    subject: '🎉 ¡Ganaste un mes GRATIS en Fixlo!',
    body: (promoCode) => 
      `🎉 ¡Ganaste un mes GRATIS en Fixlo!\n\n` +
      `Tu referido se unió y activó su membresía.\n\n` +
      `Usa este código en tu próximo pago:\n${promoCode}\n\n` +
      `Responde STOP para cancelar.`
  },
  pt: {
    subject: '🎉 Você ganhou um mês GRÁTIS no Fixlo!',
    body: (promoCode) => 
      `🎉 Você ganhou um mês GRÁTIS no Fixlo!\n\n` +
      `Seu indicado entrou e ativou a assinatura.\n\n` +
      `Use este código no próximo pagamento:\n${promoCode}\n\n` +
      `Responda STOP para cancelar.`
  }
};

/**
 * Detect language based on country code
 * @param {string} country - ISO country code (US, MX, BR, etc.)
 * @returns {string} - Language code (en, es, pt)
 */
function detectLanguage(country) {
  const countryUpper = (country || 'US').toUpperCase();
  
  // Spanish-speaking countries
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(countryUpper)) {
    return 'es';
  }
  
  // Portuguese-speaking countries (primarily Brazil)
  if (['BR', 'PT', 'AO', 'MZ'].includes(countryUpper)) {
    return 'pt';
  }
  
  // Default to English
  return 'en';
}

/**
 * Send referral reward notification
 * @param {object} referrer - Pro who made the referral
 * @param {string} promoCode - Generated promo code
 * @param {string} country - Country code for language detection
 * @returns {Promise<object>} - Notification result
 */
async function sendReferralRewardNotification(referrer, promoCode, country = 'US') {
  try {
    // Check if user has SMS consent
    if (!referrer.smsConsent) {
      console.log(`📱 Notification disabled for pro ${referrer._id}: No SMS consent`);
      return {
        success: false,
        reason: 'User has not consented to SMS'
      };
    }
    
    // Detect language
    const language = detectLanguage(country);
    const template = NOTIFICATION_TEMPLATES[language] || NOTIFICATION_TEMPLATES.en;
    
    // Generate message
    const message = template.body(promoCode);
    
    // Determine notification method based on country
    const isUSA = country.toUpperCase() === 'US';
    const phone = referrer.phone;
    
    if (!phone) {
      console.error(`❌ No phone number for pro ${referrer._id}`);
      return {
        success: false,
        reason: 'No phone number available'
      };
    }
    
    let result;
    let notificationType;
    
    if (isUSA) {
      // Send SMS for USA
      console.log(`📱 Sending SMS referral reward to ${phone} (USA)`);
      result = await sendSms(phone, message);
      notificationType = 'sms';
    } else {
      // Send WhatsApp for non-USA
      console.log(`💬 Sending WhatsApp referral reward to ${phone} (${country})`);
      result = await sendWhatsApp(phone, message);
      notificationType = 'whatsapp';
    }
    
    if (result.disabled) {
      return {
        success: false,
        reason: 'Notification service disabled',
        notificationType: notificationType
      };
    }
    
    console.log(`✅ Referral reward notification sent to pro ${referrer._id}`);
    console.log(`   Method: ${notificationType}`);
    console.log(`   Language: ${language}`);
    console.log(`   Promo Code: ${promoCode}`);
    
    return {
      success: true,
      messageId: result.sid,
      notificationType: notificationType,
      language: language,
      phone: phone
    };
    
  } catch (error) {
    console.error('❌ Error sending referral reward notification:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test notification function (for development/testing)
 * @param {string} phone - Test phone number
 * @param {string} country - Country code
 * @returns {Promise<object>} - Test result
 */
async function testReferralNotification(phone, country = 'US') {
  const testPromoCode = 'FIXLO-REF-TEST01';
  const language = detectLanguage(country);
  const template = NOTIFICATION_TEMPLATES[language] || NOTIFICATION_TEMPLATES.en;
  const message = template.body(testPromoCode);
  
  console.log(`🧪 Testing referral notification:`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Country: ${country}`);
  console.log(`   Language: ${language}`);
  console.log(`   Message:\n${message}`);
  
  const isUSA = country.toUpperCase() === 'US';
  
  try {
    let result;
    if (isUSA) {
      result = await sendSms(phone, message);
    } else {
      result = await sendWhatsApp(phone, message);
    }
    
    return {
      success: true,
      result: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendReferralRewardNotification,
  testReferralNotification,
  detectLanguage,
  NOTIFICATION_TEMPLATES
};
