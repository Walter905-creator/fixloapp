import React, { useState } from 'react';
import api from '../../lib/api';

export default function ShareProfileButton({ pro, onShareSuccess }) {
  const [isSharing, setIsSharing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const profileUrl = `${window.location.origin}/pro/${pro.slug}`;
  const displayName = pro.businessName || `${pro.firstName || ''} ${pro.lastName || ''}`.trim() || pro.name;
  const service = pro.primaryService || pro.trade;
  const location = [pro.city, pro.state].filter(Boolean).join(', ');

  const shareText = `Check out ${displayName}, a trusted ${service} professional in ${location}. Get your free quote on Fixlo!`;

  const shareOptions = [
    {
      name: 'Facebook',
      medium: 'facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Twitter/X',
      medium: 'x',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
    },
    {
      name: 'LinkedIn',
      medium: 'linkedin',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`
    },
    {
      name: 'WhatsApp',
      medium: 'whatsapp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`
    }
  ];

  const recordShareEvent = async (medium) => {
    try {
      setIsSharing(true);
      const response = await api.post(`/api/profiles/${pro._id}/share-event`, { medium });
      
      if (response.data.ok) {
        onShareSuccess?.(response.data);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
        successMsg.innerHTML = `
          <div class="flex items-center gap-2">
            <span>🎉</span>
            <div>
              <div class="font-semibold">Profile shared successfully!</div>
              <div class="text-sm opacity-90">7-day search boost activated</div>
            </div>
          </div>
        `;
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 4000);
      }
    } catch (error) {
      console.error('Share event recording failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareClick = async (option) => {
    // Record the share event
    await recordShareEvent(option.medium);
    
    // Open share window
    window.open(option.url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      await recordShareEvent('copy');
      
      // Show copied notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Profile link copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 2000);
      
      setShowShareMenu(false);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowShareMenu(!showShareMenu);
          }
        }}
        disabled={isSharing}
        className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={showShareMenu}
        aria-haspopup="menu"
        aria-label="Share profile on social media"
      >
        <span className="mr-2" aria-hidden="true">📤</span>
        Share Profile
      </button>

      {showShareMenu && (
        <div 
          role="menu"
          aria-label="Share options"
          className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48"
        >
          <div className="p-2">
            <div className="text-sm font-semibold text-gray-700 px-2 py-1 border-b border-gray-100 mb-2">
              Share and get a 7-day boost! 🚀
            </div>
            
            {shareOptions.map((option) => (
              <button
                key={option.medium}
                onClick={() => handleShareClick(option)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleShareClick(option);
                  }
                }}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors focus:outline-none focus:bg-gray-50"
                aria-label={`Share profile on ${option.name}`}
              >
                <span className="text-lg" aria-hidden="true">{option.icon}</span>
                <span className="text-sm font-medium">{option.name}</span>
              </button>
            ))}
            
            <button
              onClick={handleCopyLink}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCopyLink();
                }
              }}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors border-t border-gray-100 mt-2 pt-3 focus:outline-none focus:bg-gray-50"
              aria-label="Copy profile link to clipboard"
            >
              <span className="text-lg" aria-hidden="true">📋</span>
              <span className="text-sm font-medium">Copy Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowShareMenu(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}