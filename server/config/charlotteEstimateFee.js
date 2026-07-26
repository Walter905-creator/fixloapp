const geocodingService = require('../utils/geocoding');

const CHARLOTTE_ESTIMATE_FEE_ENABLED = String(process.env.CHARLOTTE_ESTIMATE_FEE_ENABLED || 'true').toLowerCase() === 'true';
const CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS = Number(process.env.CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS || 7500);
const CHARLOTTE_SERVICE_RADIUS_MILES = Number(process.env.CHARLOTTE_SERVICE_RADIUS_MILES || 30);
const CHARLOTTE_SERVICE_CENTER_LAT = Number(process.env.CHARLOTTE_SERVICE_CENTER_LAT || 35.2271);
const CHARLOTTE_SERVICE_CENTER_LNG = Number(process.env.CHARLOTTE_SERVICE_CENTER_LNG || -80.8431);

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function buildLocationQuery({ address, city, state, zip }) {
  const parts = [address, city, state, zip, 'USA']
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

async function evaluateCharlotteEstimateFeeEligibility({ address, city, state, zip, coordinates } = {}) {
  if (!CHARLOTTE_ESTIMATE_FEE_ENABLED) {
    return { eligible: false, reason: 'disabled', amountCents: 0 };
  }

  const normalizedState = String(state || '').trim().toUpperCase();
  if (normalizedState && normalizedState !== 'NC') {
    return { eligible: false, reason: 'outside_state', amountCents: 0 };
  }

  let lat = Number(coordinates?.lat);
  let lng = Number(coordinates?.lng);
  let normalizedAddress = '';

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const query = buildLocationQuery({ address, city, state, zip });
    if (!query) {
      console.warn('[Charlotte] evaluateCharlotteEstimateFeeEligibility: insufficient address', { address, city, state, zip });
      return { eligible: false, reason: 'insufficient_address', amountCents: 0 };
    }

    console.log('[Charlotte] Geocoding query:', query);
    try {
      // geocodingService.geocodeLocation returns { coordinates: [lng, lat], address, confidence, ... }
      const geo = await geocodingService.geocodeLocation(query);
      lat = Number(geo?.coordinates?.[1]);
      lng = Number(geo?.coordinates?.[0]);
      normalizedAddress = String(geo?.address || query);
      console.log('[Charlotte] Geocode result:', { lat, lng, normalizedAddress, confidence: geo?.confidence });
    } catch (error) {
      console.error('[Charlotte] Geocoding error:', error.message, { query });
      return {
        eligible: false,
        reason: 'geocode_failed',
        amountCents: 0,
        error: String(error?.message || 'geocode_failed')
      };
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.warn('[Charlotte] Invalid coordinates after geocoding', { lat, lng });
    return { eligible: false, reason: 'invalid_coordinates', amountCents: 0 };
  }

  const miles = distanceMiles(
    CHARLOTTE_SERVICE_CENTER_LAT,
    CHARLOTTE_SERVICE_CENTER_LNG,
    lat,
    lng
  );

  const eligible = miles <= CHARLOTTE_SERVICE_RADIUS_MILES;
  const result = {
    eligible,
    reason: eligible ? 'in_radius' : 'outside_radius',
    amountCents: eligible ? CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS : 0,
    distanceMiles: Number(miles.toFixed(2)),
    location: { lat, lng },
    normalizedAddress
  };
  console.log('[Charlotte] Eligibility result:', result);
  return result;
}

module.exports = {
  CHARLOTTE_ESTIMATE_FEE_ENABLED,
  CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS,
  CHARLOTTE_SERVICE_RADIUS_MILES,
  CHARLOTTE_SERVICE_CENTER_LAT,
  CHARLOTTE_SERVICE_CENTER_LNG,
  evaluateCharlotteEstimateFeeEligibility
};
