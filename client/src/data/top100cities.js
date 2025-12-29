// Top 100 US Cities for SEO landing pages
// Population-based ranking for maximum search volume coverage

export const TOP_100_CITIES = [
  // Top 10
  { name: 'New York', state: 'NY', slug: 'new-york', region: 'northeast', population: 8336817 },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles', region: 'west', population: 3979576 },
  { name: 'Chicago', state: 'IL', slug: 'chicago', region: 'midwest', population: 2693976 },
  { name: 'Houston', state: 'TX', slug: 'houston', region: 'south', population: 2320268 },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix', region: 'west', population: 1680992 },
  { name: 'Philadelphia', state: 'PA', slug: 'philadelphia', region: 'northeast', population: 1584064 },
  { name: 'San Antonio', state: 'TX', slug: 'san-antonio', region: 'south', population: 1547253 },
  { name: 'San Diego', state: 'CA', slug: 'san-diego', region: 'west', population: 1423851 },
  { name: 'Dallas', state: 'TX', slug: 'dallas', region: 'south', population: 1343573 },
  { name: 'San Jose', state: 'CA', slug: 'san-jose', region: 'west', population: 1021795 },
  
  // 11-20
  { name: 'Austin', state: 'TX', slug: 'austin', region: 'south', population: 978908 },
  { name: 'Jacksonville', state: 'FL', slug: 'jacksonville', region: 'south', population: 949611 },
  { name: 'Fort Worth', state: 'TX', slug: 'fort-worth', region: 'south', population: 918915 },
  { name: 'Columbus', state: 'OH', slug: 'columbus', region: 'midwest', population: 905748 },
  { name: 'Charlotte', state: 'NC', slug: 'charlotte', region: 'south', population: 885708 },
  { name: 'San Francisco', state: 'CA', slug: 'san-francisco', region: 'west', population: 873965 },
  { name: 'Indianapolis', state: 'IN', slug: 'indianapolis', region: 'midwest', population: 876384 },
  { name: 'Seattle', state: 'WA', slug: 'seattle', region: 'west', population: 753675 },
  { name: 'Denver', state: 'CO', slug: 'denver', region: 'west', population: 727211 },
  { name: 'Washington', state: 'DC', slug: 'washington-dc', region: 'northeast', population: 705749 },
  
  // 21-30
  { name: 'Boston', state: 'MA', slug: 'boston', region: 'northeast', population: 692600 },
  { name: 'Nashville', state: 'TN', slug: 'nashville', region: 'south', population: 689447 },
  { name: 'El Paso', state: 'TX', slug: 'el-paso', region: 'south', population: 678815 },
  { name: 'Detroit', state: 'MI', slug: 'detroit', region: 'midwest', population: 639111 },
  { name: 'Portland', state: 'OR', slug: 'portland', region: 'west', population: 652503 },
  { name: 'Las Vegas', state: 'NV', slug: 'las-vegas', region: 'west', population: 641903 },
  { name: 'Memphis', state: 'TN', slug: 'memphis', region: 'south', population: 633104 },
  { name: 'Louisville', state: 'KY', slug: 'louisville', region: 'south', population: 617638 },
  { name: 'Baltimore', state: 'MD', slug: 'baltimore', region: 'northeast', population: 585708 },
  { name: 'Milwaukee', state: 'WI', slug: 'milwaukee', region: 'midwest', population: 577222 },
  
  // 31-40
  { name: 'Albuquerque', state: 'NM', slug: 'albuquerque', region: 'west', population: 564559 },
  { name: 'Tucson', state: 'AZ', slug: 'tucson', region: 'west', population: 548073 },
  { name: 'Fresno', state: 'CA', slug: 'fresno', region: 'west', population: 542107 },
  { name: 'Mesa', state: 'AZ', slug: 'mesa', region: 'west', population: 518012 },
  { name: 'Sacramento', state: 'CA', slug: 'sacramento', region: 'west', population: 524943 },
  { name: 'Atlanta', state: 'GA', slug: 'atlanta', region: 'south', population: 498715 },
  { name: 'Kansas City', state: 'MO', slug: 'kansas-city', region: 'midwest', population: 508090 },
  { name: 'Colorado Springs', state: 'CO', slug: 'colorado-springs', region: 'west', population: 478961 },
  { name: 'Omaha', state: 'NE', slug: 'omaha', region: 'midwest', population: 486051 },
  { name: 'Raleigh', state: 'NC', slug: 'raleigh', region: 'south', population: 474069 },
  
  // 41-50
  { name: 'Miami', state: 'FL', slug: 'miami', region: 'south', population: 467963 },
  { name: 'Long Beach', state: 'CA', slug: 'long-beach', region: 'west', population: 466742 },
  { name: 'Virginia Beach', state: 'VA', slug: 'virginia-beach', region: 'south', population: 459470 },
  { name: 'Oakland', state: 'CA', slug: 'oakland', region: 'west', population: 440646 },
  { name: 'Minneapolis', state: 'MN', slug: 'minneapolis', region: 'midwest', population: 429954 },
  { name: 'Tulsa', state: 'OK', slug: 'tulsa', region: 'south', population: 413066 },
  { name: 'Tampa', state: 'FL', slug: 'tampa', region: 'south', population: 399700 },
  { name: 'Arlington', state: 'TX', slug: 'arlington', region: 'south', population: 398854 },
  { name: 'New Orleans', state: 'LA', slug: 'new-orleans', region: 'south', population: 383997 },
  { name: 'Wichita', state: 'KS', slug: 'wichita', region: 'midwest', population: 397532 },
  
  // 51-60
  { name: 'Cleveland', state: 'OH', slug: 'cleveland', region: 'midwest', population: 372624 },
  { name: 'Bakersfield', state: 'CA', slug: 'bakersfield', region: 'west', population: 403455 },
  { name: 'Aurora', state: 'CO', slug: 'aurora', region: 'west', population: 386261 },
  { name: 'Anaheim', state: 'CA', slug: 'anaheim', region: 'west', population: 346824 },
  { name: 'Honolulu', state: 'HI', slug: 'honolulu', region: 'west', population: 350964 },
  { name: 'Santa Ana', state: 'CA', slug: 'santa-ana', region: 'west', population: 310227 },
  { name: 'Riverside', state: 'CA', slug: 'riverside', region: 'west', population: 331360 },
  { name: 'Corpus Christi', state: 'TX', slug: 'corpus-christi', region: 'south', population: 326554 },
  { name: 'Lexington', state: 'KY', slug: 'lexington', region: 'south', population: 323152 },
  { name: 'Henderson', state: 'NV', slug: 'henderson', region: 'west', population: 320189 },
  
  // 61-70
  { name: 'Stockton', state: 'CA', slug: 'stockton', region: 'west', population: 320804 },
  { name: 'Saint Paul', state: 'MN', slug: 'saint-paul', region: 'midwest', population: 308096 },
  { name: 'Cincinnati', state: 'OH', slug: 'cincinnati', region: 'midwest', population: 309317 },
  { name: 'St. Louis', state: 'MO', slug: 'st-louis', region: 'midwest', population: 301578 },
  { name: 'Pittsburgh', state: 'PA', slug: 'pittsburgh', region: 'northeast', population: 302971 },
  { name: 'Greensboro', state: 'NC', slug: 'greensboro', region: 'south', population: 299035 },
  { name: 'Lincoln', state: 'NE', slug: 'lincoln', region: 'midwest', population: 289102 },
  { name: 'Anchorage', state: 'AK', slug: 'anchorage', region: 'west', population: 291247 },
  { name: 'Plano', state: 'TX', slug: 'plano', region: 'south', population: 288061 },
  { name: 'Orlando', state: 'FL', slug: 'orlando', region: 'south', population: 307573 },
  
  // 71-80
  { name: 'Irvine', state: 'CA', slug: 'irvine', region: 'west', population: 307670 },
  { name: 'Newark', state: 'NJ', slug: 'newark', region: 'northeast', population: 311549 },
  { name: 'Durham', state: 'NC', slug: 'durham', region: 'south', population: 283506 },
  { name: 'Chula Vista', state: 'CA', slug: 'chula-vista', region: 'west', population: 275487 },
  { name: 'Toledo', state: 'OH', slug: 'toledo', region: 'midwest', population: 270871 },
  { name: 'Fort Wayne', state: 'IN', slug: 'fort-wayne', region: 'midwest', population: 270402 },
  { name: 'St. Petersburg', state: 'FL', slug: 'st-petersburg', region: 'south', population: 265351 },
  { name: 'Laredo', state: 'TX', slug: 'laredo', region: 'south', population: 255205 },
  { name: 'Jersey City', state: 'NJ', slug: 'jersey-city', region: 'northeast', population: 292449 },
  { name: 'Chandler', state: 'AZ', slug: 'chandler', region: 'west', population: 275987 },
  
  // 81-90
  { name: 'Madison', state: 'WI', slug: 'madison', region: 'midwest', population: 269840 },
  { name: 'Lubbock', state: 'TX', slug: 'lubbock', region: 'south', population: 258862 },
  { name: 'Scottsdale', state: 'AZ', slug: 'scottsdale', region: 'west', population: 241361 },
  { name: 'Reno', state: 'NV', slug: 'reno', region: 'west', population: 264165 },
  { name: 'Buffalo', state: 'NY', slug: 'buffalo', region: 'northeast', population: 276807 },
  { name: 'Gilbert', state: 'AZ', slug: 'gilbert', region: 'west', population: 267918 },
  { name: 'Glendale', state: 'AZ', slug: 'glendale', region: 'west', population: 248325 },
  { name: 'North Las Vegas', state: 'NV', slug: 'north-las-vegas', region: 'west', population: 262527 },
  { name: 'Winston-Salem', state: 'NC', slug: 'winston-salem', region: 'south', population: 247945 },
  { name: 'Chesapeake', state: 'VA', slug: 'chesapeake', region: 'south', population: 249422 },
  
  // 91-100
  { name: 'Norfolk', state: 'VA', slug: 'norfolk', region: 'south', population: 238005 },
  { name: 'Fremont', state: 'CA', slug: 'fremont', region: 'west', population: 230504 },
  { name: 'Garland', state: 'TX', slug: 'garland', region: 'south', population: 239928 },
  { name: 'Irving', state: 'TX', slug: 'irving', region: 'south', population: 239798 },
  { name: 'Hialeah', state: 'FL', slug: 'hialeah', region: 'south', population: 223109 },
  { name: 'Richmond', state: 'VA', slug: 'richmond', region: 'south', population: 230436 },
  { name: 'Boise', state: 'ID', slug: 'boise', region: 'west', population: 235684 },
  { name: 'Spokane', state: 'WA', slug: 'spokane', region: 'west', population: 228989 },
  { name: 'Baton Rouge', state: 'LA', slug: 'baton-rouge', region: 'south', population: 227470 },
  { name: 'Des Moines', state: 'IA', slug: 'des-moines', region: 'midwest', population: 214133 }
];

// Get city by slug
export function getCityBySlug(slug) {
  return TOP_100_CITIES.find(city => city.slug === slug);
}

// Get cities by state
export function getCitiesByState(state) {
  return TOP_100_CITIES.filter(city => city.state === state);
}

// Get cities by region
export function getCitiesByRegion(region) {
  return TOP_100_CITIES.filter(city => city.region === region);
}

// Get top N cities
export function getTopCities(n = 10) {
  return TOP_100_CITIES.slice(0, n);
}

// Get all city slugs
export function getAllCitySlugs() {
  return TOP_100_CITIES.map(city => city.slug);
}

// Format city name for display
export function formatCityName(city) {
  if (typeof city === 'string') {
    const cityObj = getCityBySlug(city);
    return cityObj ? `${cityObj.name}, ${cityObj.state}` : city;
  }
  return `${city.name}, ${city.state}`;
}
