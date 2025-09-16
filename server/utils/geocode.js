const axios = require('axios');

async function geocode({ address, zip, provider = process.env.GEOCODER_PROVIDER, key = process.env.GEOCODER_API_KEY }) {
  const q = address || zip;
  if (!q) return null;

  try {
    if (provider === 'opencage' && key) {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&key=${key}&limit=1`;
      const res = await axios.get(url);
      const data = res.data;
      const hit = data?.results?.[0];
      if (hit?.geometry) {
        return { lat: hit.geometry.lat, lng: hit.geometry.lng };
      }
    }
  } catch (e) {
    console.warn('Geocode error:', e.message);
  }
  // Fallback: noop (caller can decide), or add a ZIP→coords map if you have one
  return null;
}

// Legacy function for backward compatibility
async function geocodeAddress(address) {
  // Try new geocode function first
  const result = await geocode({ address });
  if (result) {
    return { lat: result.lat, lng: result.lng, formatted: address };
  }
  
  // Fallback to Google Maps if API key exists
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_MAPS_API_KEY');

  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, { params: { address, key } });

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Geocoding failed: ${data.status}`);
  }

  const loc = data.results[0].geometry.location; // { lat, lng }
  return { lat: loc.lat, lng: loc.lng, formatted: data.results[0].formatted_address };
}

module.exports = { geocode, geocodeAddress };