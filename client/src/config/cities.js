// Multi-city expansion configuration
// This file defines the cities where Fixlo operates

const SUPPORTED_CITIES = [
  {
    id: 'charlotte',
    name: 'Charlotte',
    state: 'NC',
    fullName: 'Charlotte, NC',
    slug: 'charlotte',
    coordinates: { lat: 35.2271, lng: -80.8431 },
    active: true
  },
  {
    id: 'raleigh',
    name: 'Raleigh',
    state: 'NC',
    fullName: 'Raleigh, NC',
    slug: 'raleigh',
    coordinates: { lat: 35.7796, lng: -78.6382 },
    active: true
  },
  {
    id: 'durham',
    name: 'Durham',
    state: 'NC',
    fullName: 'Durham, NC',
    slug: 'durham',
    coordinates: { lat: 35.9940, lng: -78.8986 },
    active: true
  },
  {
    id: 'greensboro',
    name: 'Greensboro',
    state: 'NC',
    fullName: 'Greensboro, NC',
    slug: 'greensboro',
    coordinates: { lat: 36.0726, lng: -79.7920 },
    active: true
  },
  {
    id: 'winston-salem',
    name: 'Winston-Salem',
    state: 'NC',
    fullName: 'Winston-Salem, NC',
    slug: 'winston-salem',
    coordinates: { lat: 36.0999, lng: -80.2442 },
    active: true
  }
];

// Get city by slug
function getCityBySlug(slug) {
  return SUPPORTED_CITIES.find(city => city.slug === slug.toLowerCase());
}

// Get all active cities
function getActiveCities() {
  return SUPPORTED_CITIES.filter(city => city.active);
}

// Check if city is supported
function isCitySupported(slug) {
  return SUPPORTED_CITIES.some(city => city.slug === slug.toLowerCase() && city.active);
}

module.exports = {
  SUPPORTED_CITIES,
  getCityBySlug,
  getActiveCities,
  isCitySupported
};
