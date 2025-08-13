import React, { useMemo } from 'react';

const MEDIUMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram Story' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X / Twitter' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'copy', label: 'Copy Link' },
];

export default function ShareProfileModal({ isOpen, onClose, pro, api, origin = window.location.origin }) {
  const shareUrl = useMemo(() => {
    const slug = pro?.slug || `${pro?.firstName || pro?.name?.split(' ')[0] || 'pro'}-${pro?.lastName || pro?.name?.split(' ')[1] || ''}-${(pro?.primaryService || pro?.trade || 'pro')}`.toLowerCase().replace(/\s+/g, '-');
    const url = `${origin}/pro/${slug}?utm_source=share&utm_campaign=profile_share`;
    return url;
  }, [pro, origin]);

  if (!isOpen) return null;

  const handleShare = async (medium) => {
    let finalUrl = shareUrl + `&utm_medium=${medium}`;
    
    if (medium === 'copy') {
      try {
        await navigator.clipboard.writeText(finalUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = finalUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied!');
      }
    } else if (navigator.share && (medium === 'x' || medium === 'whatsapp')) {
      // Web Share API for mobile-friendly mediums
      try {
        await navigator.share({
          title: `${pro?.businessName || pro?.name} on Fixlo`,
          text: 'Book me for your next job via my Fixlo profile.',
          url: finalUrl
        });
      } catch (error) {
        console.log('Web Share API failed, falling back to URL opening');
        // Fall through to URL opening
      }
    }
    
    if (medium !== 'copy') {
      // Share targets for different platforms
      const targets = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalUrl)}`,
        instagram: finalUrl, // Instagram doesn't accept URLs directly; provide link for Story
        x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent('Book me via my Fixlo profile')}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent('Book me via my Fixlo profile: ' + finalUrl)}`
      };
      
      const href = targets[medium] || finalUrl;
      window.open(href, '_blank', 'noopener,noreferrer');
    }

    // Fire-and-forget API call to award boost + badges
    try {
      await api.post(`/api/profiles/${pro._id}/share-event`, { 
        medium, 
        utm: { source: 'share', campaign: 'profile_share', medium } 
      });
      console.log('✅ Share event recorded successfully');
    } catch (e) {
      console.error('❌ Share event failed:', e);
      // Don't show error to user - this is background functionality
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      aria-describedby="share-modal-description"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6">
        <div id="share-modal-title" className="text-xl font-semibold mb-2">Share your Fixlo profile</div>
        <p id="share-modal-description" className="text-sm text-gray-600 mb-4">
          Sharing unlocks a <b>7‑day visibility boost</b> and earns badges.
        </p>

        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Share options">
          {MEDIUMS.map(m => (
            <button
              key={m.key}
              onClick={() => handleShare(m.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleShare(m.key);
                }
              }}
              className="rounded-xl border border-gray-200 px-4 py-3 text-left hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Share profile on ${m.label}`}
            >
              <div className="font-medium text-gray-900">{m.label}</div>
              <div className="text-xs text-gray-500">Share & get boosted</div>
            </button>
          ))}
        </div>

        <div className="mt-5 text-xs text-gray-500 break-all border rounded-lg p-3 bg-gray-50">
          <strong>Your share URL:</strong><br />
          {shareUrl}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClose();
              }
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close share modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}