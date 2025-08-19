// Feature flag system for Fixlo
// Allows toggling features without redeploy

const defaultFlags = {
  showBadges: true,
  shareProfile: true,
  boostIndicator: true,
  reviewCapture: true,
  cloudinaryUpload: true,
  badges: true,
  sevenDayBoost: true,
  cloudinaryEnabled: true
};

// Get feature flags from environment or API
function getFeatureFlags() {
  // In production, this could fetch from an API
  // For now, use environment variables and defaults
  const flags = { ...defaultFlags };
  
  // Override with environment variables if available
  if (process.env.REACT_APP_FEATURE_SHOW_BADGES !== undefined) {
    flags.showBadges = process.env.REACT_APP_FEATURE_SHOW_BADGES === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_SHARE_PROFILE !== undefined) {
    flags.shareProfile = process.env.REACT_APP_FEATURE_SHARE_PROFILE === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_BOOST_INDICATOR !== undefined) {
    flags.boostIndicator = process.env.REACT_APP_FEATURE_BOOST_INDICATOR === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_REVIEW_CAPTURE !== undefined) {
    flags.reviewCapture = process.env.REACT_APP_FEATURE_REVIEW_CAPTURE === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_CLOUDINARY_UPLOAD !== undefined) {
    flags.cloudinaryUpload = process.env.REACT_APP_FEATURE_CLOUDINARY_UPLOAD === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_BADGES !== undefined) {
    flags.badges = process.env.REACT_APP_FEATURE_BADGES === 'true';
  }
  
  if (process.env.REACT_APP_FEATURE_7DAY_BOOST !== undefined) {
    flags.sevenDayBoost = process.env.REACT_APP_FEATURE_7DAY_BOOST === 'true';
  }
  
  if (process.env.REACT_APP_CLOUDINARY_ENABLED !== undefined) {
    flags.cloudinaryEnabled = process.env.REACT_APP_CLOUDINARY_ENABLED === 'true';
  }
  
  return flags;
}

// Hook for using feature flags in components
import { useMemo } from 'react';

export function useFeatureFlags() {
  return useMemo(() => getFeatureFlags(), []);
}

export { getFeatureFlags };
export default getFeatureFlags;