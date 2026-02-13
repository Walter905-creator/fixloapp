require('dotenv').config();
const mongoose = require('mongoose');
const Pro = require('../models/Pro');
const { geocode } = require('../utils/geocode');

(async () => {
  try {
    // Connect to MongoDB - ONLY using MONGO_URI
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI environment variable is not set');
      console.error('❌ FATAL ERROR: Set MONGO_URI environment variable');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const pros = await Pro.find({ 'location.coordinates': [0,0] });
    console.log(`Found ${pros.length} pros with default coordinates`);
    
    for (const p of pros) {
      try {
        const coords = await geocode({ address: p.location?.address });
        if (coords) {
          p.location = { 
            type: 'Point', 
            coordinates: [coords.lng, coords.lat],
            address: p.location?.address || ''
          };
          await p.save();
          console.log(`Updated ${p._id} (${p.name})`);
        } else {
          console.log(`No coordinates found for ${p._id} (${p.name})`);
        }
      } catch (error) {
        console.error(`Error updating ${p._id}:`, error.message);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
})();