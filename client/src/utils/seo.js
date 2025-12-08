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

export function makeTitle({ service, city, state }){ 
  const baseService = titleCase(service || '');
  const location = city ? titleCase(city) : state ? titleCase(state) : '';
  
  if (IS_HOLIDAY_SEASON && service) {
    const holidayService = holidayKeywordMap[service];
    if (city) {
      return holidayService 
        ? `${holidayService} in ${location} | Fixlo`
        : `${baseService} in ${location} | Holiday Services | Fixlo`;
    }
    if (state) {
      return holidayService 
        ? `${holidayService} in ${location} | Fixlo`
        : `${baseService} in ${location} | Holiday Services | Fixlo`;
    }
    return holidayService 
      ? `${holidayService} Near You | Fixlo`
      : `${baseService} | Holiday Services | Fixlo`;
  }
  
  if(service && city) return `${baseService} in ${location} | Fixlo`; 
  if(service && state) return `${baseService} in ${location} | Fixlo`; 
  if(service) return `${baseService} Near You | Fixlo`; 
  return 'Fixlo – Book Trusted Home Services'; 
}

export function makeDescription({ service, city, state }){ 
  const where = city ? titleCase(city) : state ? titleCase(state) : 'your area'; 
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
