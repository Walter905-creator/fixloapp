const ZIP_LOOKUP_URL = 'https://api.zippopotam.us/us';

export async function lookupZipCode(zip) {
  const normalizedZip = String(zip || '').trim();

  if (!/^\d{5}$/.test(normalizedZip)) {
    throw new Error('Please enter a valid 5-digit ZIP code.');
  }

  const response = await fetch(`${ZIP_LOOKUP_URL}/${normalizedZip}`);

  if (!response.ok) {
    throw new Error('We could not verify that ZIP code yet.');
  }

  const data = await response.json();
  const place = data?.places?.[0];

  if (!place) {
    throw new Error('We could not find a location for that ZIP code.');
  }

  return {
    zip: normalizedZip,
    city: place['place name'] || '',
    state: place['state abbreviation'] || place.state || ''
  };
}
