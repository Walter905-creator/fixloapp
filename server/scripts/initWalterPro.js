// Initialize Walter Pro user on server startup
const Pro = require('../models/Pro');

/**
 * Create initial Pro user if doesn't exist
 * This creates the Walter Pro account with no password (requires reset)
 */
async function initializeWalterPro() {
  try {
    const email = 'pro4u.improvements@gmail.com';
    
    // Check if user already exists
    const existingPro = await Pro.findOne({ 
      email: email.toLowerCase(),
      role: 'pro'
    });
    
    if (existingPro) {
      console.log('✅ Walter Pro user already exists');
      return existingPro;
    }
    
    // Create new Pro user
    const walterPro = await Pro.create({
      name: 'Walter Arevalo',
      firstName: 'Walter',
      lastName: 'Arevalo',
      email: email.toLowerCase(),
      phone: '+19999999999', // Placeholder phone
      trade: 'handyman',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128], // NYC coordinates
        address: 'New York, NY'
      },
      city: 'New York',
      state: 'NY',
      dob: new Date('1990-01-01'),
      password: null, // No password set - requires reset
      isActive: true,
      isFreePro: true,
      paymentStatus: 'active',
      verificationStatus: 'verified',
      isVerified: true,
      backgroundCheckStatus: 'clear'
    });
    
    console.log('✅ Walter Pro user created successfully');
    console.log('📧 Email:', walterPro.email);
    console.log('🔑 Password: Not set - requires password reset');
    
    return walterPro;
  } catch (error) {
    console.error('❌ Failed to initialize Walter Pro user:', error);
    throw error;
  }
}

module.exports = { initializeWalterPro };
