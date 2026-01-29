// Lead Hunter Mode Configuration
// Defines available modes and their characteristics

module.exports = {
  MODES: {
    OBSERVER: 'observer',
    GUARDED: 'guarded',
    TUNING: 'tuning',
  },
  
  // Default mode (safe by default)
  DEFAULT_MODE: 'observer',
  
  // Mode characteristics
  MODE_CONFIG: {
    observer: {
      name: 'Observer',
      description: 'Intelligence gathering only, zero execution risk',
      readOnly: true,
      requiresOptIn: false,
      canFeedSEOAgent: false,
      canModifyData: false,
      defaultEnabled: true,
    },
    guarded: {
      name: 'Guarded Execution',
      description: 'Feed opportunities to SEO agent with strict safety controls',
      readOnly: false,
      requiresOptIn: true,
      canFeedSEOAgent: true,
      canModifyData: false,
      defaultEnabled: false,
    },
    tuning: {
      name: 'Threshold Tuning',
      description: 'Analyze performance and recommend threshold optimizations',
      readOnly: true,
      requiresOptIn: false,
      canFeedSEOAgent: false,
      canModifyData: false,
      defaultEnabled: true,
    },
  },
  
  // Environment variable keys
  ENV_KEYS: {
    MODE: 'LEAD_HUNTER_MODE',
    ENABLED: 'LEAD_HUNTER_ENABLED',
    MAX_DAILY_FEEDS: 'LEAD_HUNTER_MAX_DAILY_FEEDS',
    MIN_OPPORTUNITY_SCORE: 'LEAD_HUNTER_MIN_OPPORTUNITY_SCORE',
  },
};
