// Initialize Walter Pro user on server startup
const Pro = require('../models/Pro');
const mongoose = require('mongoose');
const CHARLOTTE_COORDS = [-80.8431, 35.2271];
const CHARLOTTE_ADDRESS = 'Charlotte, NC, United States';

function getOwnerIdentifiers() {
  return {
    proId: String(process.env.FIXLO_OWNER_PRO_ID || '').trim(),
    email: String(process.env.FIXLO_OWNER_EMAIL || process.env.OWNER_EMAIL || '').trim().toLowerCase(),
    phone: String(process.env.FIXLO_OWNER_PHONE || process.env.OWNER_PHONE || '').trim()
  };
}

function buildOwnerQuery({ proId, email, phone }) {
  const or = [];
  if (proId && mongoose.Types.ObjectId.isValid(proId)) or.push({ _id: proId });
  if (email) or.push({ email });
  if (phone) or.push({ phone });
  return or.length ? { $or: or } : null;
}

async function initializeWalterPro() {
  try {
    const identifiers = getOwnerIdentifiers();
    const ownerQuery = buildOwnerQuery(identifiers);

    if (!ownerQuery) {
      console.error('[OWNER_PRO_SETUP] Missing owner identifiers. Configure FIXLO_OWNER_PRO_ID and/or FIXLO_OWNER_EMAIL and/or FIXLO_OWNER_PHONE.');
      console.error('[OWNER_PRO_SETUP] One-time admin operation: set owner env vars in Render, then restart the backend.');
      return null;
    }

    const ownerPro = await Pro.findOne(ownerQuery);
    if (!ownerPro) {
      console.error('[OWNER_PRO_SETUP] No existing owner professional account matched FIXLO_OWNER_PRO_ID/FIXLO_OWNER_EMAIL/FIXLO_OWNER_PHONE.');
      console.error('[OWNER_PRO_SETUP] One-time admin operation: set FIXLO_OWNER_PRO_ID to an existing Pro _id (or correct owner email/phone), then restart the backend.');
      return null;
    }

    ownerPro.isActive = true; // active: true
    ownerPro.subscriptionActive = ownerPro.subscriptionActive !== false;
    ownerPro.paymentStatus = ownerPro.paymentStatus === 'failed' ? 'active' : ownerPro.paymentStatus;
    ownerPro.subscriptionStatus = ownerPro.subscriptionStatus === 'paused' ? 'active' : ownerPro.subscriptionStatus;
    ownerPro.isVerified = true; // approved: true
    ownerPro.verificationStatus = 'verified'; // approved: true
    ownerPro.wantsNotifications = true; // leadNotificationsEnabled: true
    ownerPro.notificationSettings = {
      ...(ownerPro.notificationSettings || {}),
      sms: true,
      email: true
    };
    ownerPro.serviceRadiusMiles = 30;
    ownerPro.country = 'US';
    ownerPro.state = 'NC';
    ownerPro.city = 'Charlotte';
    ownerPro.location = {
      ...(ownerPro.location || {}),
      type: 'Point',
      coordinates: CHARLOTTE_COORDS,
      address: ownerPro.location?.address || CHARLOTTE_ADDRESS
    };

    if (identifiers.email) ownerPro.email = identifiers.email;
    if (identifiers.phone) ownerPro.phone = identifiers.phone;

    if (ownerPro.backgroundCheckStatus === 'suspended') {
      ownerPro.backgroundCheckStatus = 'clear'; // suspended: false
    }

    await ownerPro.save({ validateBeforeSave: true });

    console.log(`[OWNER_PRO_SETUP] ✅ Owner pro configured for Charlotte lead routing (${ownerPro._id})`);
    return ownerPro;
  } catch (error) {
    console.error('❌ Failed to configure owner professional account:', error);
    throw error;
  }
}

module.exports = { initializeWalterPro };
