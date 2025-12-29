// Competitor alternatives data for SEO comparison pages
// SAFE & LEGAL: Educational comparison only, no brand hijacking

export const COMPETITORS = {
  ANGI: {
    id: 'angi',
    name: 'Angi',
    slug: 'angi',
    formerName: 'Angie\'s List',
    urlPatterns: [
      '/alternatives-to-angi',
      '/angi-alternatives',
      '/angi-competitors'
    ],
    category: 'home-services-marketplace',
    strengths: [
      'Large network of service providers',
      'Established brand recognition',
      'Customer reviews and ratings'
    ],
    weaknesses: [
      'Membership fees for some features',
      'Lead generation model can be expensive for pros',
      'Complex pricing structure'
    ],
    active: true
  },
  HOMEADVISOR: {
    id: 'homeadvisor',
    name: 'HomeAdvisor',
    slug: 'homeadvisor',
    urlPatterns: [
      '/alternatives-to-homeadvisor',
      '/homeadvisor-alternatives',
      '/homeadvisor-competitors'
    ],
    category: 'home-services-marketplace',
    strengths: [
      'Wide service coverage',
      'Instant matching system',
      'National presence'
    ],
    weaknesses: [
      'High fees for professionals',
      'Aggressive lead distribution',
      'Mixed customer satisfaction reviews'
    ],
    active: true
  },
  THUMBTACK: {
    id: 'thumbtack',
    name: 'Thumbtack',
    slug: 'thumbtack',
    urlPatterns: [
      '/alternatives-to-thumbtack',
      '/thumbtack-alternatives',
      '/thumbtack-competitors'
    ],
    category: 'home-services-marketplace',
    strengths: [
      'Easy request process',
      'Direct messaging with pros',
      'Mobile-friendly platform'
    ],
    weaknesses: [
      'Pay-per-lead model expensive for pros',
      'Quality varies significantly',
      'Limited screening of professionals'
    ],
    active: true
  },
  TASKRABBIT: {
    id: 'taskrabbit',
    name: 'TaskRabbit',
    slug: 'taskrabbit',
    urlPatterns: [
      '/alternatives-to-taskrabbit',
      '/taskrabbit-alternatives',
      '/best-taskrabbit-alternative'
    ],
    category: 'task-services',
    strengths: [
      'Quick booking for small tasks',
      'Good for handyman work',
      'Available in major cities'
    ],
    weaknesses: [
      'Limited to specific task types',
      'Higher pricing for customers',
      'Not ideal for specialized trades'
    ],
    active: true
  },
  HANDY: {
    id: 'handy',
    name: 'Handy',
    slug: 'handy',
    urlPatterns: [
      '/alternatives-to-handy',
      '/handy-alternatives',
      '/handy-competitors'
    ],
    category: 'cleaning-handyman',
    strengths: [
      'Focus on cleaning and handyman services',
      'Online booking convenience',
      'Regular service scheduling'
    ],
    weaknesses: [
      'Limited service types',
      'Mixed reviews on pro quality',
      'Customer service concerns'
    ],
    active: true
  },
  PORCH: {
    id: 'porch',
    name: 'Porch',
    slug: 'porch',
    urlPatterns: [
      '/alternatives-to-porch',
      '/porch-alternatives',
      '/porch-competitors'
    ],
    category: 'home-services-marketplace',
    strengths: [
      'Home project management tools',
      'Professional network',
      'Project cost estimates'
    ],
    weaknesses: [
      'Smaller professional network',
      'Less known brand',
      'Limited geographic coverage'
    ],
    active: true
  }
};

// How Fixlo differentiates from competitors
export const FIXLO_ADVANTAGES = {
  pricing: {
    title: 'Transparent, Pro-Friendly Pricing',
    description: 'Unlike competitors who charge high lead fees or take percentage cuts, Fixlo offers straightforward subscription pricing that lets professionals keep more of what they earn.',
    benefits: [
      'No per-lead charges',
      'No hidden commission fees',
      'Predictable monthly costs for pros',
      'Free for homeowners'
    ]
  },
  screening: {
    title: 'Rigorous Background Checks',
    description: 'Every professional on Fixlo undergoes comprehensive background checks and verification to ensure safety and quality.',
    benefits: [
      'Criminal background checks',
      'License verification where applicable',
      'Insurance verification',
      'Identity verification'
    ]
  },
  technology: {
    title: 'Modern, User-Friendly Platform',
    description: 'Built with the latest technology for seamless booking, communication, and project management.',
    benefits: [
      'Intuitive mobile and web apps',
      'Real-time messaging',
      'Easy scheduling and calendar sync',
      'Secure payment processing'
    ]
  },
  support: {
    title: 'Dedicated Customer Support',
    description: 'Real people ready to help homeowners and professionals succeed on the platform.',
    benefits: [
      'Responsive customer service',
      'Support for both homeowners and pros',
      'Dispute resolution assistance',
      'Technical support when needed'
    ]
  }
};

// Comparison table data generator
export function generateComparisonTable(competitorId) {
  const competitor = COMPETITORS[competitorId.toUpperCase()];
  if (!competitor) return null;

  return {
    features: [
      {
        feature: 'Cost for Homeowners',
        fixlo: 'Free - No hidden fees',
        competitor: 'May have membership fees or service charges'
      },
      {
        feature: 'Cost for Professionals',
        fixlo: 'Simple subscription - No per-lead fees',
        competitor: 'Expensive per-lead charges or high commissions'
      },
      {
        feature: 'Background Checks',
        fixlo: 'Comprehensive verification for all pros',
        competitor: 'Varies by platform and professional'
      },
      {
        feature: 'Platform Technology',
        fixlo: 'Modern, mobile-first design',
        competitor: 'May have outdated interfaces'
      },
      {
        feature: 'Customer Support',
        fixlo: 'Dedicated support team',
        competitor: 'Support quality varies'
      },
      {
        feature: 'Pro Earnings',
        fixlo: 'Keep more of what you earn',
        competitor: 'High fees reduce pro earnings'
      }
    ],
    disclaimer: `Fixlo is not affiliated with or endorsed by ${competitor.name}. Brand names are used for educational comparison purposes only. Information is based on publicly available data and may change. Always verify current pricing and features directly with each service.`
  };
}

// FAQ data for competitor pages
export function generateCompetitorFAQ(competitorId) {
  const competitor = COMPETITORS[competitorId.toUpperCase()];
  if (!competitor) return [];

  return [
    {
      question: `What is the best alternative to ${competitor.name}?`,
      answer: `Fixlo is a top alternative to ${competitor.name}, offering transparent pricing for professionals, comprehensive background checks, and a modern platform that benefits both homeowners and service providers. Unlike traditional lead-generation platforms, Fixlo uses a fair subscription model that helps pros keep more of their earnings.`
    },
    {
      question: `How is Fixlo different from ${competitor.name}?`,
      answer: `Fixlo differentiates itself through pro-friendly pricing (no expensive per-lead fees), rigorous background verification for all professionals, and a modern technology platform. While ${competitor.name} ${competitor.weaknesses[0]?.toLowerCase()}, Fixlo focuses on creating value for both homeowners and professionals through transparent pricing and quality assurance.`
    },
    {
      question: `Is Fixlo free for homeowners?`,
      answer: `Yes, Fixlo is completely free for homeowners. There are no membership fees, no hidden charges, and no service fees when you book professionals through our platform. Homeowners can browse, compare, and connect with verified professionals at no cost.`
    },
    {
      question: `Does Fixlo do background checks on professionals?`,
      answer: `Yes, every professional on Fixlo undergoes comprehensive background verification including criminal background checks, license verification (where applicable), insurance verification, and identity verification. This ensures you're working with trustworthy, qualified professionals.`
    },
    {
      question: `How much does Fixlo cost for professionals?`,
      answer: `Fixlo uses a transparent subscription model for professionals instead of expensive per-lead fees. This means pros pay a predictable monthly cost and keep more of what they earn, rather than paying for every lead or losing a percentage of each job to high platform fees.`
    }
  ];
}

// Get all active competitors
export function getActiveCompetitors() {
  return Object.values(COMPETITORS).filter(comp => comp.active);
}

// Get competitor by slug
export function getCompetitorBySlug(slug) {
  return Object.values(COMPETITORS).find(
    comp => comp.slug === slug && comp.active
  );
}

// Get all competitor URL patterns
export function getAllCompetitorUrls() {
  const urls = [];
  Object.values(COMPETITORS).forEach(comp => {
    if (comp.active) {
      urls.push(...comp.urlPatterns);
    }
  });
  return urls;
}
