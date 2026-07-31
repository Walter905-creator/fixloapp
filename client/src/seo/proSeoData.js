export const PRO_TRADES = {
  handyman: {
    label: 'Handyman',
    plural: 'handyman professionals',
    services: ['general repairs', 'door and trim work', 'drywall patches', 'fixture installation'],
    keywords: ['handyman jobs', 'local handyman leads', 'home repair opportunities']
  },
  plumbing: {
    label: 'Plumbing',
    plural: 'plumbing professionals',
    services: ['leak repairs', 'fixture replacement', 'drain work', 'water heater projects'],
    keywords: ['plumbing jobs', 'local plumbing leads', 'plumber opportunities']
  },
  electrical: {
    label: 'Electrical',
    plural: 'electrical professionals',
    services: ['lighting installation', 'outlet and switch work', 'panel upgrades', 'troubleshooting'],
    keywords: ['electrical jobs', 'local electrician leads', 'electrical contractor opportunities']
  },
  painting: {
    label: 'Painting',
    plural: 'painting professionals',
    services: ['interior painting', 'exterior painting', 'cabinet painting', 'touch-up work'],
    keywords: ['painting jobs', 'local painting leads', 'painter opportunities']
  },
  carpentry: {
    label: 'Carpentry',
    plural: 'carpentry professionals',
    services: ['trim carpentry', 'door installation', 'deck repairs', 'custom woodwork'],
    keywords: ['carpentry jobs', 'local carpenter leads', 'carpenter opportunities']
  },
  roofing: {
    label: 'Roofing',
    plural: 'roofing professionals',
    services: ['roof repairs', 'roof replacement', 'storm damage', 'leak inspections'],
    keywords: ['roofing jobs', 'local roofing leads', 'roofer opportunities']
  },
  hvac: {
    label: 'HVAC',
    plural: 'HVAC professionals',
    services: ['system repair', 'maintenance', 'replacement estimates', 'thermostat installation'],
    keywords: ['HVAC jobs', 'local HVAC leads', 'HVAC contractor opportunities']
  },
  landscaping: {
    label: 'Landscaping',
    plural: 'landscaping professionals',
    services: ['yard cleanup', 'lawn care', 'planting', 'hardscape projects'],
    keywords: ['landscaping jobs', 'local landscaping leads', 'landscaper opportunities']
  },
  flooring: {
    label: 'Flooring',
    plural: 'flooring professionals',
    services: ['floor installation', 'floor repair', 'tile work', 'floor replacement'],
    keywords: ['flooring jobs', 'local flooring leads', 'floor installer opportunities']
  },
  cleaning: {
    label: 'House Cleaning',
    plural: 'house-cleaning professionals',
    services: ['recurring cleaning', 'deep cleaning', 'move-out cleaning', 'post-project cleanup'],
    keywords: ['house cleaning jobs', 'local cleaning leads', 'cleaner opportunities']
  },
  'junk-removal': {
    label: 'Junk Removal',
    plural: 'junk-removal professionals',
    services: ['furniture removal', 'garage cleanouts', 'construction debris', 'property cleanups'],
    keywords: ['junk removal jobs', 'local junk removal leads', 'hauling opportunities']
  },
  remodeling: {
    label: 'Remodeling',
    plural: 'remodeling professionals',
    services: ['kitchen remodeling', 'bathroom remodeling', 'basement projects', 'whole-home renovations'],
    keywords: ['remodeling jobs', 'local remodeling leads', 'general contractor opportunities']
  }
};

export const PRO_CITIES = {
  'charlotte-nc': { city: 'Charlotte', state: 'NC', region: 'Charlotte metro' },
  'raleigh-nc': { city: 'Raleigh', state: 'NC', region: 'Triangle area' },
  'greensboro-nc': { city: 'Greensboro', state: 'NC', region: 'Piedmont Triad' },
  'atlanta-ga': { city: 'Atlanta', state: 'GA', region: 'Atlanta metro' },
  'miami-fl': { city: 'Miami', state: 'FL', region: 'South Florida' },
  'orlando-fl': { city: 'Orlando', state: 'FL', region: 'Central Florida' },
  'tampa-fl': { city: 'Tampa', state: 'FL', region: 'Tampa Bay' },
  'houston-tx': { city: 'Houston', state: 'TX', region: 'Greater Houston' },
  'dallas-tx': { city: 'Dallas', state: 'TX', region: 'Dallas–Fort Worth' },
  'phoenix-az': { city: 'Phoenix', state: 'AZ', region: 'Phoenix metro' },
  'los-angeles-ca': { city: 'Los Angeles', state: 'CA', region: 'Los Angeles County' },
  'chicago-il': { city: 'Chicago', state: 'IL', region: 'Chicagoland' }
};

export const PRO_TRADE_SLUGS = Object.keys(PRO_TRADES);
export const PRO_CITY_SLUGS = Object.keys(PRO_CITIES);
