const axios = require('axios');

async function geocodeAddress(address) {
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

module.exports = { geocodeAddress };