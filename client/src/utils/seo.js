import { IS_HOLIDAY_SEASON } from './config';

export const BASE_URL =
  typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://www.fixloapp.com';
export function normalizePath(pathname = '/') { const url = pathname.split('?')[0].split('#')[0]; const trimmed = url !== '/' ? url.replace(/\/+$/,'') : '/'; return trimmed.toLowerCase(); }
export function buildCanonical(pathname = '/') { const norm = normalizePath(pathname); return `${BASE_URL}${norm.startsWith('/')?norm:'/'.concat(norm)}`; }
export function slugify(s = ''){return String(s).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
export function titleCase(s=''){return s.replace(/\b\w/g,c=>c.toUpperCase());}

// Holiday keyword variations for different services
const holidayKeywordMap = {
  'house-cleaning': 'Holiday Deep Cleaning',
  'cleaning': 'Holiday Deep Cleaning',
  'electrical': 'Christmas Light Installation',
  'landscaping': 'Holiday Decoration Setup',
  'plumbing': 'Winter Emergency Repairs',
  'hvac': 'Winter Heating Services',
  'handyman': 'Holiday Handyman Services',
  'carpentry': 'Holiday Home Repairs',
  'painting': 'Holiday Home Refresh',
  'roofing': 'Winter Roof Repairs',
  'junk-removal': 'Post-Holiday Cleanup'
};

// City to state mapping for major US cities
const cityStateMap = {
  'miami': 'FL',
  'new-york': 'NY',
  'los-angeles': 'CA',
  'chicago': 'IL',
  'houston': 'TX',
  'phoenix': 'AZ',
  'philadelphia': 'PA',
  'san-antonio': 'TX',
  'san-diego': 'CA',
  'dallas': 'TX',
  'austin': 'TX',
  'seattle': 'WA',
  'denver': 'CO',
  'boston': 'MA',
  'atlanta': 'GA',
  'san-francisco': 'CA'
};

// Country display names
const countryDisplayNames = {
  'us': 'United States',
  'ca': 'Canada',
  'uk': 'United Kingdom',
  'au': 'Australia',
  'ar': 'Argentina'
};

export function makeTitle({ service, city, state, country = 'us' }){ 
  const baseService = titleCase(service || '');
  const cityDisplay = city ? titleCase(city) : '';
  const stateDisplay = state || (city && cityStateMap[city]) || '';
  
  // Build location string with city, state for US or city, country for international
  let location = '';
  if (cityDisplay && stateDisplay && country === 'us') {
    location = `${cityDisplay}, ${stateDisplay}`;
  } else if (cityDisplay && country !== 'us') {
    location = `${cityDisplay}, ${countryDisplayNames[country] || country.toUpperCase()}`;
  } else if (cityDisplay) {
    location = cityDisplay;
  } else if (stateDisplay) {
    location = stateDisplay;
  }
  
  if (IS_HOLIDAY_SEASON && service) {
    const holidayService = holidayKeywordMap[service];
    if (location) {
      return holidayService 
        ? `${holidayService} in ${location} | Fixlo`
        : `${baseService} in ${location} | Holiday Services | Fixlo`;
    }
    return holidayService 
      ? `${holidayService} Near You | Fixlo`
      : `${baseService} | Holiday Services | Fixlo`;
  }
  
  if(service && location) return `${baseService} in ${location} | Fixlo`; 
  if(service) return `${baseService} Near You | Fixlo`; 
  return 'Fixlo – Book Trusted Home Services'; 
}

export function makeDescription({ service, city, state, country = 'us' }){ 
  const cityDisplay = city ? titleCase(city) : '';
  const stateDisplay = state || (city && cityStateMap[city]) || '';
  
  // Build location string
  let where = 'your area';
  if (cityDisplay && stateDisplay && country === 'us') {
    where = `${cityDisplay}, ${stateDisplay}`;
  } else if (cityDisplay && country !== 'us') {
    where = `${cityDisplay}, ${countryDisplayNames[country] || country.toUpperCase()}`;
  } else if (cityDisplay) {
    where = cityDisplay;
  } else if (stateDisplay) {
    where = stateDisplay;
  }
  
  const what = service ? titleCase(service) : 'Home Services'; 
  
  if (IS_HOLIDAY_SEASON) {
    const holidayService = service && holidayKeywordMap[service];
    if (holidayService) {
      return `Get holiday-ready! ${holidayService} & ${what.toLowerCase()} pros in ${where}. Fast quotes, background-checked, easy scheduling. Servicios para Navidad.`;
    }
    return `Christmas home services in ${where}. Vetted ${what.toLowerCase()} professionals for holiday repairs, seasonal maintenance & winter emergencies.`;
  }
  
  return `Book vetted pros for ${what} in ${where}. Fast quotes, background-checked contractors, easy scheduling.`; 
}

// Spanish holiday translations for bilingual support
export const spanishHolidayKeywords = {
  'christmas': 'Navidad',
  'holiday': 'temporada navideña',
  'seasonal': 'estacional',
  'winter': 'invierno',
  'cleaning': 'limpieza navideña',
  'repairs': 'reparaciones para las fiestas',
  'services': 'servicios navideños',
  'emergency': 'reparaciones urgentes en Navidad'
};
