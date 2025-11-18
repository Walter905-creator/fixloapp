#!/usr/bin/env node

/**
 * SEO Landing Page Generator for Fixlo
 * Generates bilingual (English + Spanish) SEO pages for every service/city combination
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data files
const services = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf-8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf-8'));
const slang = JSON.parse(fs.readFileSync(path.join(__dirname, 'slang.json'), 'utf-8'));

// Output directory for generated pages
const OUTPUT_DIR = path.join(__dirname, '../client/src/pages/services');

/**
 * Format text into URL-safe slug
 */
function formatSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate meta tags for a page
 */
function generateMeta(service, city, lang = 'en') {
  const serviceName = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  if (lang === 'es') {
    // Spanish meta
    const serviceES = translateService(serviceName);
    return {
      title: `${serviceES} en ${cityName} — Rápido y Confiable — Sin Mentiras | Fixlo`,
      description: `Encuentra profesionales verificados de ${serviceES.toLowerCase()} en ${cityName}. Reserva en 6-7 minutos. El GOAT del servicio del hogar. ¡De una! 🏠✨`,
      canonical: `/services/${service}/${city}/es`
    };
  }
  
  // English meta
  return {
    title: `${serviceName} in ${cityName} — Fast & Trusted — No Cap | Fixlo`,
    description: `Find verified ${serviceName.toLowerCase()} pros in ${cityName}. Book in 6-7 minutes. The GOAT of home services. No cap! 🏠✨`,
    canonical: `/services/${service}/${city}`
  };
}

/**
 * Generate JSON-LD schema for local business
 */
function generateSchema(service, city, lang = 'en') {
  const serviceName = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Fixlo ${serviceName} - ${cityName}`,
    "description": lang === 'es' 
      ? `Servicios profesionales de ${translateService(serviceName).toLowerCase()} en ${cityName}`
      : `Professional ${serviceName.toLowerCase()} services in ${cityName}`,
    "url": `https://fixloapp.com/services/${service}/${city}${lang === 'es' ? '/es' : ''}`,
    "telephone": "+1-855-FIXLO-GO",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "2847"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName
    }
  };
}

/**
 * Simple service name translation (basic mapping)
 */
function translateService(serviceName) {
  const translations = {
    'Handyman': 'Manitas',
    'Plumbing': 'Plomería',
    'Electrical': 'Electricidad',
    'HVAC': 'HVAC',
    'Carpentry': 'Carpintería',
    'Painting': 'Pintura',
    'Roofing': 'Techado',
    'House Cleaning': 'Limpieza del Hogar',
    'Junk Removal': 'Eliminación de Basura',
    'Landscaping': 'Paisajismo',
    'Lawn Care': 'Cuidado del Césped',
    'Tree Service': 'Servicio de Árboles',
    'Fence Installation': 'Instalación de Cercas',
    'Deck Building': 'Construcción de Terrazas',
    'Kitchen Remodeling': 'Remodelación de Cocinas',
    'Bathroom Remodeling': 'Remodelación de Baños',
    'Flooring': 'Pisos',
    'Tile Installation': 'Instalación de Azulejos',
    'Drywall Repair': 'Reparación de Paneles de Yeso',
    'Window Installation': 'Instalación de Ventanas',
    'Door Installation': 'Instalación de Puertas',
    'Garage Door Repair': 'Reparación de Puertas de Garaje',
    'Appliance Repair': 'Reparación de Electrodomésticos',
    'AC Repair': 'Reparación de Aire Acondicionado',
    'Heating Repair': 'Reparación de Calefacción',
    'Water Heater Repair': 'Reparación de Calentadores de Agua',
    'Sewer Repair': 'Reparación de Alcantarillado',
    'Gutter Cleaning': 'Limpieza de Canalones',
    'Pressure Washing': 'Lavado a Presión',
    'Pest Control': 'Control de Plagas',
    'Mold Removal': 'Eliminación de Moho',
    'Asbestos Removal': 'Eliminación de Asbesto',
    'Locksmith': 'Cerrajería',
    'Security System Installation': 'Instalación de Sistemas de Seguridad',
    'Home Theater Installation': 'Instalación de Cine en Casa',
    'Smart Home Installation': 'Instalación de Casa Inteligente',
    'Solar Panel Installation': 'Instalación de Paneles Solares',
    'Insulation Installation': 'Instalación de Aislamiento',
    'Concrete Work': 'Trabajo de Concreto',
    'Masonry': 'Albañilería',
    'Chimney Repair': 'Reparación de Chimeneas',
    'Foundation Repair': 'Reparación de Cimientos',
    'Waterproofing': 'Impermeabilización',
    'Basement Finishing': 'Acabado de Sótanos',
    'Attic Conversion': 'Conversión de Áticos',
    'Home Addition': 'Adición de Hogar',
    'General Contracting': 'Contratista General',
    'Pool Installation': 'Instalación de Piscinas',
    'Pool Cleaning': 'Limpieza de Piscinas',
    'Spa Repair': 'Reparación de Spa'
  };
  return translations[serviceName] || serviceName;
}

/**
 * Generate services list items
 */
function generateServicesList(serviceName) {
  const items = [
    `Emergency ${serviceName}`,
    `Residential ${serviceName}`,
    `Commercial ${serviceName}`,
    `${serviceName} Repair`,
    `${serviceName} Installation`,
    `${serviceName} Maintenance`,
    `24/7 ${serviceName}`,
    `Licensed ${serviceName}`,
    `Affordable ${serviceName}`
  ];
  
  return items.map(item => 
    `<div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">${item}</span>
              </div>`
  ).join('\n              ');
}

/**
 * Render English page template
 */
function renderEnglishPageTemplate(service, city, cityState) {
  const serviceName = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const meta = generateMeta(service, city, 'en');
  const schema = generateSchema(service, city, 'en');
  
  return `import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function ${serviceName.replace(/\s+/g, '')}${cityName.replace(/\s+/g, '')}Page() {
  return (
    <>
      <Helmet>
        <title>${meta.title}</title>
        <meta name="description" content="${meta.description}" />
        <link rel="canonical" href="https://fixloapp.com${meta.canonical}" />
        <script type="application/ld+json">
          {${JSON.stringify(schema)}}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero Section */}
        <div className="container-xl py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            ${serviceName} in ${cityName}, ${cityState} — Fast & Trusted — No Cap
          </h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-xl text-slate-700 leading-relaxed">
              Looking for ${serviceName.toLowerCase()} pros in ${cityName} who bring that <span className="font-semibold">main character</span> energy? 
              We've got you covered. Fixlo connects you with verified professionals — no <span className="font-semibold">mid</span> pros here, 
              just the <span className="font-semibold">GOAT</span> of home services. Book in <span className="font-semibold">6-7 minutes</span> flat, 
              and trust us when we say: <span className="font-semibold">it's giving</span> reliable, fast, and professional.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-4 mb-12">
            <a 
              href="#request-service" 
              className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold"
            >
              Get Matched with Top Pros
            </a>
            <a 
              href="/how-it-works" 
              className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Trusted Pros Section */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Trusted ${serviceName} Professionals in ${cityName}
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-700 mb-4">
                Our ${serviceName.toLowerCase()} pros in ${cityName}? They <span className="font-semibold">ate and left no crumbs</span>. 
                Seriously. Every contractor in our network is background-checked, verified, and ready to handle your project 
                with <span className="font-semibold">aesthetic</span>-level craftsmanship.
              </p>
              
              <ul className="space-y-3 text-slate-700">
                <li>✅ <strong>Mogging the competition</strong> — Our pros outperform, every time</li>
                <li>✅ <strong>Looksmaxxing your home</strong> — Professional results that elevate your space</li>
                <li>✅ <strong>No ghosting</strong> — Real-time updates via SMS, every step of the way</li>
                <li>✅ <strong>Adulting made easy</strong> — We handle the hard part so you don't have to</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vibe Check Section */}
        <div className="bg-slate-50 py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Vibe Check: Why ${cityName} Homeowners Choose Fixlo
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Fast Response</h3>
                <p className="text-slate-700">
                  Get matched in <strong>6-7 minutes</strong>. No waiting around. 
                  Our pros have that <strong>rizz</strong> — they respond fast and deliver faster.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Quality Sleep Guaranteed</h3>
                <p className="text-slate-700">
                  Once you book, you can start <strong>sleepmaxxing</strong>. We've got your ${serviceName.toLowerCase()} 
                  needs covered so you can rest easy.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Aesthetic-Core Results</h3>
                <p className="text-slate-700">
                  Our pros deliver work that's pure <strong>aesthetic-core</strong>. Your home will look so good, 
                  it'll be the <strong>main character</strong> of the block.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Local Services List */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              ${serviceName} Services We Offer in ${cityName}, ${cityState}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${generateServicesList(serviceName)}
            </div>
          </div>
        </div>

        {/* Girl/Boy Dinner Reset */}
        <div className="bg-slate-900 text-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold mb-6">
              If Your Space Still Looks Like a <span className="italic">Girl Dinner</span> or <span className="italic">Boy Dinner</span> Moment…
            </h2>
            
            <p className="text-lg text-slate-200 mb-6">
              Let's be real — <strong>adulting</strong> is hard, and sometimes your place needs more than a quick fix. 
              Whether it's your kitchen, bathroom, or entire home, our ${serviceName.toLowerCase()} pros in ${cityName} 
              will transform it from <strong>mid</strong> to <strong>GOAT</strong>-level gorgeous.
            </p>
            
            <p className="text-xl font-semibold">
              No <strong>delulu</strong> expectations. Just real professionals doing real work. <strong>Bet</strong>.
            </p>
          </div>
        </div>

        {/* Service Request Form */}
        <div id="request-service" className="bg-white py-12">
          <div className="container-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Request ${serviceName} Service in ${cityName}
              </h2>
              
              <div className="card p-8">
                <p className="text-slate-700 mb-6">
                  Describe your ${serviceName.toLowerCase()} needs and get matched with verified pros in ${cityName}, ${cityState}.
                </p>
                
                {/* Form would go here - reuse existing ServiceLeadForm component */}
                <div className="text-center py-8">
                  <a 
                    href="/services/${service}/${city}" 
                    className="btn btn-primary btn-lg"
                  >
                    Submit Service Request
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
          <div className="container-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              It's Giving Upgraded.
            </h2>
            <p className="text-xl mb-6">
              Book the <strong>GOAT</strong> of ${serviceName.toLowerCase()} in ${cityName} today — <strong>no cap</strong>.
            </p>
            <a 
              href="#request-service" 
              className="btn btn-white btn-lg px-8 py-4"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
`;
}

/**
 * Render Spanish page template
 */
function renderSpanishPageTemplate(service, city, cityState) {
  const serviceName = service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const serviceES = translateService(serviceName);
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const meta = generateMeta(service, city, 'es');
  const schema = generateSchema(service, city, 'es');
  
  return `import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function ${serviceName.replace(/\s+/g, '')}${cityName.replace(/\s+/g, '')}ESPage() {
  return (
    <>
      <Helmet>
        <title>${meta.title}</title>
        <meta name="description" content="${meta.description}" />
        <link rel="canonical" href="https://fixloapp.com${meta.canonical}" />
        <meta name="language" content="es" />
        <script type="application/ld+json">
          {${JSON.stringify(schema)}}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero Section */}
        <div className="container-xl py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            ${serviceES} en ${cityName}, ${cityState} — Rápido y Confiable — Sin Mentiras
          </h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-xl text-slate-700 leading-relaxed">
              ¿Buscas profesionales de ${serviceES.toLowerCase()} en ${cityName} con energía de <span className="font-semibold">personaje principal</span>? 
              Te tenemos cubierto. Fixlo te conecta con profesionales verificados — nada de pros <span className="font-semibold">normalitos</span>, 
              solo <span className="font-semibold">el GOAT</span> de los servicios del hogar. Reserva en <span className="font-semibold">6-7 minutos</span>, 
              y confía cuando decimos: <span className="font-semibold">está dando vibras</span> de confiable, rápido y profesional.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-4 mb-12">
            <a 
              href="#solicitar-servicio" 
              className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold"
            >
              Conectar con los Mejores Pros
            </a>
            <a 
              href="/how-it-works" 
              className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold"
            >
              Cómo Funciona
            </a>
          </div>
        </div>

        {/* Trusted Pros Section */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Profesionales de ${serviceES} Confiables en ${cityName}
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-700 mb-4">
                ¿Nuestros profesionales de ${serviceES.toLowerCase()} en ${cityName}? <span className="font-semibold">Se la comieron y no dejaron migas</span>. 
                En serio. Cada contratista en nuestra red está verificado con antecedentes revisados y listo para manejar tu proyecto 
                con trabajo de nivel <span className="font-semibold">estética</span>.
              </p>
              
              <ul className="space-y-3 text-slate-700">
                <li>✅ <strong>Dominando la competencia</strong> — Nuestros pros superan a todos, siempre</li>
                <li>✅ <strong>Ponte más guapo/guapa tu hogar</strong> — Resultados profesionales que elevan tu espacio</li>
                <li>✅ <strong>Sin ghosting</strong> — Actualizaciones en tiempo real vía SMS, en cada paso</li>
                <li>✅ <strong>Vida adulta hecha fácil</strong> — Nosotros manejamos la parte difícil para que tú no tengas que hacerlo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vibe Check Section */}
        <div className="bg-slate-50 py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Chequeo de Vibras: Por Qué Los Propietarios de ${cityName} Eligen Fixlo
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Respuesta Rápida</h3>
                <p className="text-slate-700">
                  Conectamos en <strong>6-7 minutos</strong>. Sin esperas. 
                  Nuestros pros tienen ese <strong>flow</strong> — responden rápido y entregan más rápido.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Sueño de Calidad Garantizado</h3>
                <p className="text-slate-700">
                  Una vez que reserves, puedes empezar a <strong>dormir brutal</strong>. Tenemos tus necesidades de ${serviceES.toLowerCase()} 
                  cubiertas para que puedas descansar tranquilo.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Resultados Estética-Core</h3>
                <p className="text-slate-700">
                  Nuestros pros entregan trabajo que es pura <strong>estética-core</strong>. Tu hogar se verá tan bien, 
                  será el <strong>personaje principal</strong> de la cuadra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Local Services List */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Servicios de ${serviceES} Que Ofrecemos en ${cityName}, ${cityState}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${generateServicesList(serviceES)}
            </div>
          </div>
        </div>

        {/* Girl/Boy Dinner Reset */}
        <div className="bg-slate-900 text-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold mb-6">
              Si Tu Espacio Todavía Parece un Momento de <span className="italic">Cena de Chica</span> o <span className="italic">Cena de Chico</span>…
            </h2>
            
            <p className="text-lg text-slate-200 mb-6">
              Seamos honestos — la <strong>vida adulta</strong> es difícil, y a veces tu lugar necesita más que una solución rápida. 
              Ya sea tu cocina, baño o toda la casa, nuestros profesionales de ${serviceES.toLowerCase()} en ${cityName} 
              lo transformarán de <strong>normalito</strong> a hermoso nivel <strong>GOAT</strong>.
            </p>
            
            <p className="text-xl font-semibold">
              Sin expectativas <strong>delulu</strong>. Solo profesionales reales haciendo trabajo real. <strong>De una</strong>.
            </p>
          </div>
        </div>

        {/* Service Request Form */}
        <div id="solicitar-servicio" className="bg-white py-12">
          <div className="container-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Solicitar Servicio de ${serviceES} en ${cityName}
              </h2>
              
              <div className="card p-8">
                <p className="text-slate-700 mb-6">
                  Describe tus necesidades de ${serviceES.toLowerCase()} y conéctate con profesionales verificados en ${cityName}, ${cityState}.
                </p>
                
                {/* Form would go here */}
                <div className="text-center py-8">
                  <a 
                    href="/services/${service}/${city}" 
                    className="btn btn-primary btn-lg"
                  >
                    Enviar Solicitud de Servicio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
          <div className="container-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Está Dando Vibras de Upgrade.
            </h2>
            <p className="text-xl mb-6">
              Reserva <strong>el GOAT</strong> de ${serviceES.toLowerCase()} en ${cityName} hoy — <strong>sin mentiras</strong>.
            </p>
            <a 
              href="#solicitar-servicio" 
              className="btn btn-white btn-lg px-8 py-4"
            >
              Comenzar Ahora
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
`;
}

/**
 * Create directories recursively
 */
function createDirectoriesRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write SEO page to file
 */
function writeSEOPage(service, city, cityState, lang = 'en') {
  const serviceSlug = formatSlug(service);
  const citySlug = formatSlug(city);
  
  // Create directory structure
  const pagePath = path.join(OUTPUT_DIR, serviceSlug, citySlug);
  createDirectoriesRecursively(pagePath);
  
  // Generate file content
  const content = lang === 'es' 
    ? renderSpanishPageTemplate(serviceSlug, citySlug, cityState)
    : renderEnglishPageTemplate(serviceSlug, citySlug, cityState);
  
  // Write file
  const fileName = lang === 'es' ? 'es.jsx' : 'index.jsx';
  const filePath = path.join(pagePath, fileName);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  
  return filePath;
}

/**
 * Main generator function
 */
async function generateAllPages() {
  console.log('🚀 Starting SEO Landing Page Generation...\n');
  console.log(`📊 Services: ${services.length}`);
  console.log(`🌆 Cities: ${cities.length}`);
  console.log(`📄 Total pages to generate: ${services.length * cities.length * 2} (EN + ES)\n`);
  
  let generatedCount = 0;
  const startTime = Date.now();
  
  // Generate pages
  for (const service of services) {
    for (const cityData of cities) {
      const { city, state } = cityData;
      
      // Generate English version
      writeSEOPage(service, city, state, 'en');
      generatedCount++;
      
      // Generate Spanish version
      writeSEOPage(service, city, state, 'es');
      generatedCount++;
      
      // Progress indicator
      if (generatedCount % 1000 === 0) {
        console.log(`✅ Generated ${generatedCount} pages...`);
      }
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✨ Generation Complete!`);
  console.log(`📄 Total pages generated: ${generatedCount}`);
  console.log(`⏱️  Time taken: ${duration} seconds`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n🎉 All SEO pages have been generated successfully!`);
}

// Run generator
generateAllPages().catch(console.error);
