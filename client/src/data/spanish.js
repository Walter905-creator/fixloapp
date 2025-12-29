// Spanish translations for bilingual SEO support
// Supports US Hispanic market and Mexico expansion

export const SPANISH_TRANSLATIONS = {
  // Service names
  services: {
    'plumbing': 'plomería',
    'electrical': 'electricista',
    'hvac': 'calefacción y aire',
    'carpentry': 'carpintería',
    'painting': 'pintura',
    'roofing': 'techado',
    'house-cleaning': 'limpieza del hogar',
    'cleaning': 'limpieza',
    'junk-removal': 'remoción de basura',
    'landscaping': 'jardinería',
    'handyman': 'manitas'
  },

  // Trend types
  trends: {
    'christmas': 'navidad',
    'new-year': 'año nuevo',
    'spring-cleaning': 'limpieza de primavera',
    'thanksgiving': 'día de acción de gracias',
    'emergency': 'emergencia',
    'same-day': 'mismo día',
    '24-hour': '24 horas',
    'near-me': 'cerca de mí',
    'last-minute': 'último minuto'
  },

  // Common phrases
  phrases: {
    'in': 'en',
    'near': 'cerca de',
    'find': 'encontrar',
    'trusted': 'confiable',
    'professional': 'profesional',
    'service': 'servicio',
    'services': 'servicios',
    'home': 'hogar',
    'repair': 'reparación',
    'emergency': 'emergencia',
    'fast': 'rápido',
    'quality': 'calidad',
    'affordable': 'asequible',
    'licensed': 'licenciado',
    'insured': 'asegurado',
    'verified': 'verificado'
  },

  // SEO content templates
  templates: {
    title: {
      'trend-service-city': '{trend} {service} en {city} | Fixlo',
      'service-city': '{service} en {city} | Fixlo',
      'emergency-service': '{service} de Emergencia en {city} | Fixlo'
    },
    description: {
      'trend-service-city': 'Encuentra profesionales de {service} para {trend} en {city}. Verificados, licenciados y listos para ayudar. Reserve hoy.',
      'emergency-service': 'Servicio de {service} de emergencia 24/7 en {city}. Profesionales verificados y confiables. Respuesta rápida.'
    }
  },

  // Call to action
  cta: {
    'book-now': 'Reserve Ahora',
    'get-quote': 'Obtener Cotización',
    'contact': 'Contactar',
    'learn-more': 'Más Información',
    'find-pro': 'Encontrar Profesional'
  },

  // Benefits and features
  benefits: {
    'background-checked': 'Verificación de antecedentes',
    'licensed-pros': 'Profesionales licenciados',
    'free-quotes': 'Cotizaciones gratuitas',
    'fast-response': 'Respuesta rápida',
    '24-7-service': 'Servicio 24/7',
    'satisfaction-guaranteed': 'Satisfacción garantizada',
    'no-hidden-fees': 'Sin cargos ocultos'
  },

  // Content sections
  sections: {
    'why-choose-us': '¿Por Qué Elegirnos?',
    'how-it-works': 'Cómo Funciona',
    'our-services': 'Nuestros Servicios',
    'service-areas': 'Áreas de Servicio',
    'frequently-asked': 'Preguntas Frecuentes',
    'customer-reviews': 'Opiniones de Clientes',
    'get-started': 'Comenzar'
  },

  // FAQ questions (Spanish-specific)
  faq: {
    'what-is-fixlo': {
      question: '¿Qué es Fixlo?',
      answer: 'Fixlo es un mercado de servicios para el hogar que conecta a propietarios con profesionales verificados y confiables para plomería, electricidad, limpieza y más.'
    },
    'how-does-it-work': {
      question: '¿Cómo funciona Fixlo?',
      answer: 'Simplemente describa su necesidad, revise las cotizaciones de profesionales verificados, y elija el que mejor se adapte a sus necesidades. Todo gratis para propietarios.'
    },
    'is-it-free': {
      question: '¿Es gratis para propietarios?',
      answer: 'Sí, Fixlo es completamente gratuito para propietarios. No hay tarifas de membresía ni cargos ocultos.'
    },
    'background-checks': {
      question: '¿Verifican los antecedentes de los profesionales?',
      answer: 'Sí, todos los profesionales en Fixlo pasan por verificaciones exhaustivas de antecedentes, incluidas verificaciones criminales, de licencia y de seguro.'
    },
    'emergency-service': {
      question: '¿Ofrecen servicio de emergencia?',
      answer: 'Sí, tenemos profesionales disponibles para emergencias las 24 horas, los 7 días de la semana en la mayoría de las áreas.'
    }
  },

  // Holiday-specific content
  holiday: {
    'christmas': {
      title: 'Servicios Navideños para el Hogar',
      description: 'Prepare su hogar para la Navidad con profesionales confiables',
      cta: 'Reserve para Navidad'
    },
    'new-year': {
      title: 'Servicios de Año Nuevo',
      description: 'Comience el año nuevo con un hogar renovado',
      cta: 'Comenzar el Año Nuevo Bien'
    }
  },

  // Emergency keywords
  emergency: {
    'urgent': 'urgente',
    'immediate': 'inmediato',
    'emergency': 'emergencia',
    '24-hours': '24 horas',
    'fast-response': 'respuesta rápida',
    'same-day': 'mismo día',
    'available-now': 'disponible ahora'
  }
};

// Generate Spanish service name
export function getSpanishServiceName(serviceSlug) {
  return SPANISH_TRANSLATIONS.services[serviceSlug] || serviceSlug;
}

// Generate Spanish trend name
export function getSpanishTrendName(trendSlug) {
  return SPANISH_TRANSLATIONS.trends[trendSlug] || trendSlug;
}

// Generate Spanish title
export function generateSpanishTitle({ trend, service, city }) {
  const trendName = trend ? getSpanishTrendName(trend) : '';
  const serviceName = getSpanishServiceName(service);
  
  if (trend && service && city) {
    return `${trendName} ${serviceName} en ${city} | Fixlo`;
  }
  if (service && city) {
    return `${serviceName} en ${city} | Fixlo`;
  }
  return `Servicios del Hogar en ${city} | Fixlo`;
}

// Generate Spanish description
export function generateSpanishDescription({ trend, service, city }) {
  const serviceName = getSpanishServiceName(service);
  const trendName = trend ? getSpanishTrendName(trend) : '';
  
  if (trend === 'emergency' || trend === 'emergencia') {
    return `Servicio de ${serviceName} de emergencia 24/7 en ${city}. Profesionales verificados y confiables. Respuesta rápida garantizada.`;
  }
  
  if (trend) {
    return `Encuentre profesionales de ${serviceName} para ${trendName} en ${city}. Verificados, con licencia y listos para ayudar. Reserve hoy.`;
  }
  
  return `Reserve profesionales verificados de ${serviceName} en ${city}. Cotizaciones rápidas, profesionales con verificación de antecedentes, programación fácil.`;
}

// Check if content should be in Spanish
export function shouldUseSpanish(trend) {
  return trend && (
    trend === 'navidad' ||
    trend.includes('español') ||
    trend.includes('spanish') ||
    SPANISH_TRANSLATIONS.trends[trend]?.includes('navidad')
  );
}

// Get Spanish FAQ for a service/trend
export function getSpanishFAQ({ service, trend, city }) {
  const faqs = [];
  
  // Always include core FAQs
  faqs.push(SPANISH_TRANSLATIONS.faq['what-is-fixlo']);
  faqs.push(SPANISH_TRANSLATIONS.faq['how-does-it-work']);
  faqs.push(SPANISH_TRANSLATIONS.faq['is-it-free']);
  faqs.push(SPANISH_TRANSLATIONS.faq['background-checks']);
  
  // Add emergency FAQ if trend is emergency
  if (trend === 'emergency' || trend === 'emergencia') {
    faqs.push(SPANISH_TRANSLATIONS.faq['emergency-service']);
  }
  
  return faqs;
}
