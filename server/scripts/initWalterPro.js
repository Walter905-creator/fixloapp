// Initialize Walter Pro user on server startup
const Pro = require('../models/Pro');

const PLACEHOLDER_PHONE = '+19999999999';

/**
 * Create initial Pro user if doesn't exist.
 * Uses OWNER_PHONE env variable for the phone number so the account
 * can receive SMS reset codes and log in with the real phone.
 * If the account already exists with the placeholder phone and OWNER_PHONE
 * is now configured, it updates the phone automatically.
 */
async function initializeWalterPro() {
  try {
    const email = 'pro4u.improvements@gmail.com';
    const ownerPhone = process.env.OWNER_PHONE || PLACEHOLDER_PHONE;
    
    // Check if user already exists
    const existingPro = await Pro.findOne({ 
      email: email.toLowerCase(),
      role: 'pro'
    });
    
    if (existingPro) {
      // If phone is still the placeholder and we now have a real number, update it
      if (existingPro.phone === PLACEHOLDER_PHONE && ownerPhone !== PLACEHOLDER_PHONE) {
        existingPro.phone = ownerPhone;
        await existingPro.save({ validateBeforeSave: true });
        console.log('✅ Walter Pro phone updated to real number');
      } else {
        console.log('✅ Walter Pro user already exists');
      }
      return existingPro;
    }
    
    // Create new Pro user
    const walterPro = await Pro.create({
      name: 'Walter Arevalo',
      firstName: 'Walter',
      lastName: 'Arevalo',
      email: email.toLowerCase(),
      phone: ownerPhone,
      trade: 'handyman',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128], // NYC coordinates
        address: 'New York, NY'
      },
      city: 'New York',
      state: 'NY',
      dob: new Date('1990-01-01'),
      password: null, // No password set - requires reset via SMS
      isActive: true,
      isFreePro: true,
      paymentStatus: 'active',
      verificationStatus: 'verified',
      isVerified: true,
      backgroundCheckStatus: 'clear'
    });
    
    console.log('✅ Walter Pro user created successfully');
    console.log('📧 Email:', walterPro.email);
    console.log('📱 Phone:', ownerPhone === PLACEHOLDER_PHONE ? 'placeholder (set OWNER_PHONE env var)' : 'configured');
    console.log('🔑 Password: Not set - requires password reset via SMS');
    
    return walterPro;
  } catch (error) {
    console.error('❌ Failed to initialize Walter Pro user:', error);
    throw error;
  }
}

module.exports = { initializeWalterPro };
