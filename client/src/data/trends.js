// Trend types and configurations for SEO landing pages
// This file defines all supported trend categories and their metadata

export const TREND_TYPES = {
  // Seasonal & Holiday
  CHRISTMAS: {
    slug: 'christmas',
    name: 'Christmas',
    spanish: 'navidad',
    season: 'winter',
    priority: 'high',
    keywords: ['holiday', 'christmas', 'winter', 'seasonal'],
    active: true
  },
  NAVIDAD: {
    slug: 'navidad',
    name: 'Navidad',
    spanish: true,
    season: 'winter',
    priority: 'high',
    keywords: ['navidad', 'temporada navideña', 'fiestas'],
    active: true
  },
  NEW_YEAR: {
    slug: 'new-year',
    name: 'New Year',
    spanish: 'año-nuevo',
    season: 'winter',
    priority: 'medium',
    keywords: ['new year', 'fresh start', 'home refresh'],
    active: true
  },
  SPRING_CLEANING: {
    slug: 'spring-cleaning',
    name: 'Spring Cleaning',
    spanish: 'limpieza-de-primavera',
    season: 'spring',
    priority: 'high',
    keywords: ['spring', 'cleaning', 'refresh', 'renewal'],
    active: true
  },
  THANKSGIVING: {
    slug: 'thanksgiving',
    name: 'Thanksgiving',
    spanish: 'dia-de-accion-de-gracias',
    season: 'fall',
    priority: 'medium',
    keywords: ['thanksgiving', 'holiday prep', 'family gathering'],
    active: true
  },
  BLACK_FRIDAY: {
    slug: 'black-friday',
    name: 'Black Friday',
    spanish: 'viernes-negro',
    season: 'fall',
    priority: 'medium',
    keywords: ['black friday', 'deals', 'discounts', 'savings'],
    active: true
  },

  // Emergency & Weather
  STORM: {
    slug: 'storm',
    name: 'Storm Damage',
    spanish: 'daños-por-tormenta',
    category: 'emergency',
    priority: 'high',
    keywords: ['storm', 'damage', 'emergency repair', 'weather'],
    active: true
  },
  HURRICANE: {
    slug: 'hurricane',
    name: 'Hurricane Recovery',
    spanish: 'recuperacion-huracan',
    category: 'emergency',
    priority: 'high',
    keywords: ['hurricane', 'storm damage', 'emergency', 'disaster'],
    active: true
  },
  FLOOD: {
    slug: 'flood',
    name: 'Flood Cleanup',
    spanish: 'limpieza-inundacion',
    category: 'emergency',
    priority: 'high',
    keywords: ['flood', 'water damage', 'emergency', 'cleanup'],
    active: true
  },
  HEAT_WAVE: {
    slug: 'heat-wave',
    name: 'Heat Wave',
    spanish: 'ola-de-calor',
    category: 'emergency',
    priority: 'high',
    keywords: ['heat wave', 'cooling', 'hvac', 'air conditioning'],
    active: true
  },
  POWER_OUTAGE: {
    slug: 'power-outage',
    name: 'Power Outage',
    spanish: 'corte-de-luz',
    category: 'emergency',
    priority: 'high',
    keywords: ['power outage', 'electrical', 'emergency', 'generator'],
    active: true
  },
  FROZEN_PIPES: {
    slug: 'frozen-pipes',
    name: 'Frozen Pipes',
    spanish: 'tuberias-congeladas',
    category: 'emergency',
    priority: 'high',
    keywords: ['frozen pipes', 'winter', 'plumbing emergency', 'burst pipes'],
    active: true
  },

  // Urgency / Conversion
  SAME_DAY: {
    slug: 'same-day',
    name: 'Same Day Service',
    spanish: 'mismo-dia',
    category: 'urgency',
    priority: 'high',
    keywords: ['same day', 'fast', 'quick', 'immediate'],
    active: true
  },
  EMERGENCY: {
    slug: 'emergency',
    name: 'Emergency Service',
    spanish: 'emergencia',
    category: 'urgency',
    priority: 'high',
    keywords: ['emergency', '24/7', 'urgent', 'immediate'],
    active: true
  },
  TWENTY_FOUR_HOUR: {
    slug: '24-hour',
    name: '24 Hour Service',
    spanish: '24-horas',
    category: 'urgency',
    priority: 'high',
    keywords: ['24 hour', '24/7', 'all day', 'anytime'],
    active: true
  },
  LAST_MINUTE: {
    slug: 'last-minute',
    name: 'Last Minute',
    spanish: 'ultimo-minuto',
    category: 'urgency',
    priority: 'medium',
    keywords: ['last minute', 'quick', 'urgent', 'asap'],
    active: true
  },
  NEAR_ME: {
    slug: 'near-me',
    name: 'Near Me',
    spanish: 'cerca-de-mi',
    category: 'urgency',
    priority: 'high',
    keywords: ['near me', 'nearby', 'local', 'close'],
    active: true
  },

  // Life Events
  MOVE_OUT: {
    slug: 'move-out',
    name: 'Move Out Service',
    spanish: 'mudanza',
    category: 'life-event',
    priority: 'medium',
    keywords: ['move out', 'moving', 'relocation', 'cleaning'],
    active: true
  },
  RENTAL_TURNOVER: {
    slug: 'rental-turnover',
    name: 'Rental Turnover',
    spanish: 'cambio-de-inquilino',
    category: 'life-event',
    priority: 'medium',
    keywords: ['rental', 'turnover', 'property', 'cleaning'],
    active: true
  },
  AIRBNB_CLEANING: {
    slug: 'airbnb-cleaning',
    name: 'Airbnb Cleaning',
    spanish: 'limpieza-airbnb',
    category: 'life-event',
    priority: 'medium',
    keywords: ['airbnb', 'vacation rental', 'short term', 'cleaning'],
    active: true
  },
  RENOVATION: {
    slug: 'renovation',
    name: 'Home Renovation',
    spanish: 'renovacion',
    category: 'life-event',
    priority: 'medium',
    keywords: ['renovation', 'remodel', 'upgrade', 'improvement'],
    active: true
  },
  HOME_SALE: {
    slug: 'home-sale',
    name: 'Home Sale Prep',
    spanish: 'venta-de-casa',
    category: 'life-event',
    priority: 'medium',
    keywords: ['home sale', 'selling', 'staging', 'prep'],
    active: true
  }
};

// Service-specific benefits for each trend type
export const TREND_SERVICE_BENEFITS = {
  christmas: {
    'house-cleaning': 'Holiday deep cleaning to make your home sparkle for guests and celebrations',
    'cleaning': 'Professional holiday cleaning to prepare your home for Christmas festivities',
    'electrical': 'Expert Christmas light installation and holiday electrical safety checks',
    'landscaping': 'Professional holiday decoration setup and winter landscape preparation',
    'plumbing': 'Emergency winter plumbing repairs to prevent holiday disasters',
    'hvac': 'Keep your home warm and comfortable for holiday gatherings',
    'handyman': 'Complete those repairs before family arrives for the holidays',
    'carpentry': 'Home improvements ready for the holiday season',
    'painting': 'Fresh paint to make your home shine this Christmas',
    'roofing': 'Winter roof repairs and ice dam prevention',
    'junk-removal': 'Clear out clutter before holiday decorating begins'
  },
  emergency: {
    'plumbing': '24/7 emergency plumbing repairs - burst pipes, leaks, and clogs',
    'electrical': 'Emergency electrical service for power outages and safety issues',
    'hvac': 'Emergency heating and cooling repairs any time, day or night',
    'roofing': 'Emergency roof repairs for leaks and storm damage',
    'handyman': 'Emergency handyman service for urgent home repairs'
  },
  'same-day': {
    'plumbing': 'Same-day plumbing service - fast response for urgent repairs',
    'electrical': 'Same-day electrical repairs to get your home back to normal',
    'hvac': 'Same-day HVAC service for heating and cooling emergencies',
    'house-cleaning': 'Same-day cleaning service for last-minute needs',
    'cleaning': 'Same-day deep cleaning when you need it most',
    'junk-removal': 'Same-day junk removal - quick and efficient cleanup',
    'handyman': 'Same-day handyman service for urgent repairs and projects'
  }
};

// Get active trends
export function getActiveTrends() {
  return Object.values(TREND_TYPES).filter(trend => trend.active);
}

// Get trend by slug
export function getTrendBySlug(slug) {
  return Object.values(TREND_TYPES).find(trend => trend.slug === slug);
}

// Check if trend is active
export function isTrendActive(slug) {
  const trend = getTrendBySlug(slug);
  return trend && trend.active;
}

// Get trends by category
export function getTrendsByCategory(category) {
  return Object.values(TREND_TYPES).filter(
    trend => trend.category === category && trend.active
  );
}

// Get high priority trends
export function getHighPriorityTrends() {
  return Object.values(TREND_TYPES).filter(
    trend => trend.priority === 'high' && trend.active
  );
}
