import React from 'react';

const ICONS = {
  'Top Promoter': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-600">
      <path d="M12 2l3 7h7l-5.5 4.1L18 21l-6-4-6 4 1.5-7.9L2 9h7z"/>
    </svg>
  ),
  'Community Builder': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-9 9v-2a7 7 0 0114 0v2H3z"/>
    </svg>
  )
};

export default function Badges({ badges = [], featureFlags = { showBadges: true } }) {
  // Check feature flag
  if (!featureFlags.showBadges || !badges.length) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <span 
          key={`${badge.name}-${index}`} 
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700"
          title={`Earned on ${new Date(badge.earnedAt).toLocaleDateString()}`}
        >
          {ICONS[badge.name] || (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3 7h7l-5.5 4.1L18 21l-6-4-6 4 1.5-7.9L2 9h7z"/>
            </svg>
          )}
          <span>{badge.name}</span>
        </span>
      ))}
    </div>
  );
}