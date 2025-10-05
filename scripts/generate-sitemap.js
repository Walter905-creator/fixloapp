const fs = require("fs");
const path = require("path");

const services = [
  "plumbing", "electrical", "carpentry", "painting", "hvac",
  "roofing", "landscaping", "house-cleaning", "junk-removal"
];

const cities = [
  // Major US Cities (Top 100+)
  "new-york", "los-angeles", "chicago", "houston", "phoenix", "philadelphia", 
  "san-antonio", "san-diego", "dallas", "san-jose", "austin", "jacksonville",
  "fort-worth", "columbus", "charlotte", "san-francisco", "indianapolis", 
  "seattle", "denver", "washington", "boston", "el-paso", "detroit", "nashville",
  "portland", "memphis", "oklahoma-city", "las-vegas", "louisville", "baltimore",
  "milwaukee", "albuquerque", "tucson", "fresno", "mesa", "sacramento", 
  "atlanta", "kansas-city", "colorado-springs", "miami", "raleigh", "omaha",
  "long-beach", "virginia-beach", "oakland", "minneapolis", "tulsa", "arlington",
  "tampa", "new-orleans", "wichita", "cleveland", "bakersfield", "aurora",
  "anaheim", "honolulu", "santa-ana", "corpus-christi", "riverside", "lexington",
  "stockton", "toledo", "saint-paul", "newark", "anchorage", "plano", "fort-wayne",
  "jersey-city", "st-petersburg", "chula-vista", "norfolk", "laredo", "madison",
  "chandler", "buffalo", "lubbock", "scottsdale", "reno", "glendale", "gilbert",
  "winston-salem", "north-las-vegas", "durham", "henderson", "fremont", "baton-rouge",
  "richmond", "boise", "san-bernardino", "birmingham", "spokane", "rochester",
  "des-moines", "modesto", "fayetteville", "tacoma", "oxnard", "fontana",
  "columbus-ga", "montgomery", "moreno-valley", "shreveport", "aurora-co", 
  "yonkers", "akron", "huntington-beach", "little-rock", "augusta", "amarillo",
  "glendale-az", "mobile", "grand-rapids", "salt-lake-city", "tallahassee",
  "huntsville", "grand-prairie", "knoxville", "worcester", "newport-news",
  "brownsville", "overland-park", "santa-clarita", "providence", "garden-grove",
  "chattanooga", "oceanside", "jackson", "fort-lauderdale", "santa-rosa",
  "rancho-cucamonga", "port-st-lucie", "tempe", "ontario", "vancouver",
  "cape-coral", "sioux-falls", "springfield", "peoria", "pembroke-pines",
  "elk-grove", "salem", "lancaster", "corona", "eugene", "palmdale", "salinas",
  "springfield-mo", "pasadena", "fort-collins", "hayward", "pomona", "cary",
  "rockford", "alexandria", "escondido", "mckinney", "kansas-city-ks", "joliet",
  "sunnyvale", "torrance", "bridgeport", "lakewood", "hollywood", "paterson",
  "naperville", "syracuse", "mesquite", "dayton", "savannah", "clarksville",
  "orange", "pasadena-tx", "fullerton", "killeen", "frisco", "hampton",
  "mcallen", "warren", "west-valley-city", "columbia", "olathe", "sterling-heights",
  "new-haven", "miramar", "waco", "thousand-oaks", "cedar-rapids", "charleston",
  "visalia", "topeka", "elizabeth", "gainesville", "thornton", "roseville",
  "carrollton", "coral-springs", "stamford", "simi-valley", "concord",
  "hartford", "kent", "lafayette", "midland", "surprise", "denton", "victorville",
  "evansville", "santa-clara", "abilene", "athens", "vallejo", "allentown",
  "norman", "beaumont", "independence", "murfreesboro", "ann-arbor", "fargo",
  "wilmington", "provo", "worcester-ma", "richardson", "arvada", "west-palm-beach",
  "carlsbad", "westminster", "pearland", "clearwater", "manchester", "davenport",
  "miami-gardens", "antioch", "high-point", "rochester-ny", "downey", "elgin",
  "inglewood", "pueblo", "broken-arrow", "miami-beach", "college-station",
  "burbank", "south-bend", "lowell", "rialto", "el-monte", "las-cruces",
  "league-city", "tyler", "boynton-beach", "gresham", "woodbridge", "clinton",
  "edison", "cicero", "san-mateo", "green-bay", "daly-city", "richardson-tx",
  "bend", "jurupa-valley", "renton", "vista", "davie", "quincy", "lynn",
  "norman-ok", "whittier", "centennial", "ventura", "lakeland", "sparks",
  "tuscaloosa", "kenosha", "apple-valley", "portsmouth", "livonia", "fall-river",
  "everett", "reading", "rio-rancho", "rochester-mn", "st-joseph", "mission-viejo",
  "brockton", "santa-monica", "sandy-springs", "longmont", "boca-raton", "san-leandro",
  "boulder", "melbourne", "virginia-beach-va", "danbury", "tuscaloosa-al", "lawrence",
  "santa-barbara", "norwalk", "waukegan", "new-bedford", "lynn-ma", "newton",
  "dearborn", "san-buenaventura", "nashua", "edmond", "roanoke", "gary",
  "westland", "farmington-hills", "bloomington", "north-charleston", "meridian",
  "goodyear", "hillsboro", "round-rock", "burlington", "billings", "albany",
  "columbia-sc", "cedar-falls", "st-petersburg-fl", "toms-river", "orem", "evanston",
  "bloomington-mn", "medford", "redwood-city", "flint", "spokane-valley", "hammond",
  "sandy", "sunrise", "troy", "wilmington-nc", "bristol", "citrus-heights",
  "redding", "santa-cruz", "edmonton", "dearborn-heights", "brooklyn-park",
  "mentor", "duluth", "college-park", "sugar-land", "lakewood-co", "champaign",
  "fort-smith", "danville", "beaverton", "lewisville", "south-gate", "taunton",
  "berkeley", "asheville", "miami-shores", "ann-arbor-mi", "flower-mound",
  "huntington", "alameda", "lakewood-wa", "st-cloud", "springdale", "muncie",
  "plantation", "westminster-co", "santa-maria", "quincy-ma", "lynn-haven",
  "rockville", "napa", "buena-park", "bloomington-il", "lakewood-oh", "gastonia",
  "redlands", "south-jordan", "fishers", "richardson-ca", "appleton", "rapid-city",
  "westminster-ca", "missoula", "clifton", "decatur", "bellingham", "paradise",
  "grand-forks", "missouri-city", "yorba-linda", "tigard", "pleasanton",
  "st-charles", "lake-charles", "hoover", "union-city", "roswell", "madera",
  "conroe", "auburn", "bowling-green", "kennewick", "westfield", "normal",
  "murrieta", "lynchburg", "clovis", "springfield-il", "fayetteville-nc",
  "st-petersburg", "johns-creek", "milford", "broomfield", "concord-nc",
  "cambridge", "carmel", "new-rochelle", "waterbury", "jackson-ms", "o-fallon",
  "west-covina", "cedar-park", "pearland-tx", "bryan", "deerfield-beach",
  "newport-beach", "allen", "roseville-ca", "plymouth", "bellflower", "gulfport",
  "woodland", "rochester-hills", "upland", "brookhaven", "white-plains",
  "rogers", "troy-mi", "santa-fe", "highlands-ranch", "coconut-creek",
  "burnsville", "lakeville", "urbana", "apple-valley-mn", "davis", "hillsboro-or",
  "st-louis-park", "lauderhill", "yuma", "towson", "downers-grove", "pittsfield",
  "leominster", "bismarck", "dothan", "bossier-city", "wilmington-de",
  "cedar-rapids-ia", "blacksburg", "eau-claire", "alpharetta", "jupiter",
  "lee-summit", "dubuque", "auburn-wa", "suffolk", "cheektowaga", "missouri-city-tx"
];

const baseUrl = "https://www.fixloapp.com";

// Get current date in ISO format for lastmod
const lastmod = new Date().toISOString().split('T')[0];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Add main pages
sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
sitemap += `  <url>\n    <loc>${baseUrl}/services</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

// Add service pages for each city
for (const service of services) {
  for (const city of cities) {
    sitemap += `  <url>\n    <loc>${baseUrl}/services/${service}/${city}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
}

sitemap += `</urlset>`;

const outputPath = path.join(__dirname, "../client/public/sitemap.xml");
fs.writeFileSync(outputPath, sitemap, "utf8");

console.log(`✅ sitemap.xml generated with ${services.length * cities.length + 2} URLs`);
console.log(`   - ${services.length} services`);
console.log(`   - ${cities.length} cities`);
console.log(`   - Total service-city combinations: ${services.length * cities.length}`);
console.log(`   - Output: ${outputPath}`);