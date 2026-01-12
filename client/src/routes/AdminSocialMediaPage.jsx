import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

/**
 * Social Media Manager Admin UI
 * 
 * This component handles OAuth connections for social media platforms
 * using a POST-based OAuth flow as required by the backend.
 * 
 * OAuth Flow:
 * 1. User clicks "Connect" button
 * 2. Frontend sends GET request to /api/social/connect/:platform/url
 * 3. Backend returns authorization URL
 * 4. Frontend redirects browser to OAuth provider
 * 5. User authorizes and is redirected back with code
 * 6. Backend POST /api/social/connect/:platform completes connection
 * 7. Frontend refreshes status from /api/social/status
 */
export default function AdminSocialMediaPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [metaDebugInfo, setMetaDebugInfo] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    loadStatus();
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const reason = urlParams.get('reason');
    const connected = urlParams.get('connected');
    const platform = urlParams.get('platform');
    
    if (oauthError || reason) {
      if (oauthError) {
        // Map safe error codes to user-friendly messages
        const errorMessages = {
          'access_denied': 'OAuth access was denied',
          'oauth_error': 'OAuth authentication error',
          'no_code': 'No authorization code received',
          'internal_error': 'Internal server error'
        };
        setError(errorMessages[oauthError] || 'OAuth connection failed');
      }
      
      // Load debug info for any error or reason
      loadMetaDebugInfo();
      setShowDebugPanel(true);
      
      // Clean URL without page reload
      window.history.replaceState({}, '', window.location.pathname);
    } else if (connected === 'true' && platform) {
      // Success! Refresh status
      loadStatus();
      // Clean URL without page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  /**
   * Load connection status for all platforms
   */
  const loadStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/api/social/status`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error loading status:', err);
      setError('Failed to load connection status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Load Meta OAuth debug information
   */
  const loadMetaDebugInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/social/debug/meta`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to load Meta debug info:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setMetaDebugInfo(data);
      }
    } catch (err) {
      console.error('Error loading Meta debug info:', err);
    }
  };

  /**
   * Initiate OAuth flow for a platform
   * 
   * This function:
   * 1. Opens a blank window synchronously (prevents popup blocking)
   * 2. Calls GET /api/social/connect/:platform/url to get authUrl
   * 3. Assigns authUrl to the pre-opened window
   * 4. After user authorizes, OAuth provider redirects back with code
   * 5. Backend callback handler completes the connection
   * 
   * IMPORTANT: The window must be opened synchronously in the click event
   * stack to prevent browser popup blocking. Navigating after an async
   * operation would be blocked as non-user-initiated.
   * 
   * @param {string} platform - Platform key (meta_instagram, meta_facebook)
   * @param {string} accountType - Account type for Meta (instagram, facebook)
   */
  const handleConnect = async (platform, accountType = 'instagram') => {
    // Step 1: Open window synchronously inside click event stack
    // This prevents browser from blocking the navigation
    // Using _self means we're getting a reference to the current window
    const currentWindow = window.open('', '_self');
    
    try {
      setConnectingPlatform(platform);
      setError('');

      // Step 2: Get authorization URL from backend
      const url = `${API_BASE}/api/social/connect/${platform}/url?accountType=${accountType}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('[OAuth] Requesting authorization URL:', url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[OAuth] Response status:', response.status, response.ok);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get authorization URL: ${response.status}`);
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('[OAuth] Received response:', data);
      }
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response');
      }
      
      if (!data.authUrl) {
        throw new Error('Authorization URL missing from server response');
      }

      // Validate URL format
      const authUrl = String(data.authUrl).trim();
      try {
        // Validate that it's a proper URL
        const urlObj = new URL(authUrl);
        // Ensure it's using http or https protocol
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          throw new Error(`Invalid OAuth URL protocol: ${urlObj.protocol}`);
        }
      } catch (urlError) {
        throw new Error(`Invalid OAuth URL: ${authUrl}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[OAuth] Redirecting to:', authUrl);
      }

      // Step 3: Navigate the pre-opened window to OAuth provider
      // This works because the window was opened synchronously
      // in the click event stack, maintaining user-initiated context
      currentWindow.location.href = authUrl;

    } catch (err) {
      console.error('[OAuth] Error initiating OAuth:', err);
      setError(err.message || 'Failed to connect. Please try again.');
      setConnectingPlatform(null);
      
      // Note: With _self target, currentWindow refers to current window
      // If fetch fails, we're still on the admin page, so no cleanup needed
    }
  };

  /**
   * Get platform connection status
   */
  const getPlatformStatus = (platformKey) => {
    if (!status || !status.accounts) return null;
    return status.accounts.find(acc => acc.platform === platformKey);
  };

  /**
   * Render connection status badge
   */
  const renderStatusBadge = (platformKey) => {
    const account = getPlatformStatus(platformKey);
    
    if (connectingPlatform === platformKey) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          Connecting...
        </span>
      );
    }
    
    if (account && account.isActive) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          ✓ Connected
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
        Not Connected
      </span>
    );
  };

  /**
   * Check if platform is connected
   */
  const isConnected = (platformKey) => {
    const account = getPlatformStatus(platformKey);
    return account && account.isActive;
  };

  return (
    <>
      <HelmetSEO 
        title="Social Media Manager | Admin | Fixlo" 
        canonicalPathname="/admin/social-media" 
        robots="noindex, nofollow" 
      />
      
      <div className="container-xl py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Social Media Manager</h1>
          <p className="text-gray-600">
            Connect and manage your social media accounts for automated content publishing.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Meta OAuth Diagnostic Panel */}
        {showDebugPanel && metaDebugInfo && metaDebugInfo.lastErrorReason && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Meta Connection Failed: {metaDebugInfo.lastErrorReason}
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  {metaDebugInfo.helpText || 'An error occurred during OAuth connection.'}
                </p>
                
                <div className="bg-white rounded p-4 text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-gray-700">Error Code:</span>
                      <span className="ml-2 text-gray-900">{metaDebugInfo.lastErrorReason}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Timestamp:</span>
                      <span className="ml-2 text-gray-900">
                        {metaDebugInfo.lastErrorTimestamp 
                          ? new Date(metaDebugInfo.lastErrorTimestamp).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Node Env:</span>
                      <span className="ml-2 text-gray-900">{metaDebugInfo.nodeEnv || 'unknown'}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="mt-3 text-sm text-red-700 hover:text-red-900 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading status...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Status Card */}
            {status && status.system && (
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold mb-4">System Status</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Scheduler Active</p>
                    <p className="font-medium">
                      {status.system.schedulerActive ? '✓ Running' : '✗ Stopped'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Manual Approval Mode</p>
                    <p className="font-medium">
                      {status.system.requiresApproval ? '✓ Enabled' : '✗ Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instagram Connection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    IG
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Instagram Business</h3>
                    <p className="text-sm text-gray-600">Connect your Instagram Business account</p>
                  </div>
                </div>
                {renderStatusBadge('meta_instagram')}
              </div>

              {(() => {
                const instagramAccount = getPlatformStatus('meta_instagram');
                return instagramAccount && instagramAccount.isActive ? (
                  <div className="bg-gray-50 rounded p-4 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      @{instagramAccount.platformUsername}
                    </p>
                    <p className="text-xs text-gray-600">
                      Connected: {new Date(instagramAccount.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Requirements:</strong>
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Instagram Business or Creator account</li>
                      <li>Account must be connected to a Facebook Page</li>
                      <li>You must be an admin of the Facebook Page</li>
                    </ul>
                  </div>
                );
              })()}

              <button
                onClick={() => handleConnect('meta_instagram', 'instagram')}
                disabled={connectingPlatform === 'meta_instagram' || isConnected('meta_instagram')}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  connectingPlatform === 'meta_instagram'
                    ? 'bg-blue-400 text-white cursor-wait'
                    : isConnected('meta_instagram')
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'
                }`}
              >
                {connectingPlatform === 'meta_instagram'
                  ? 'Connecting...'
                  : isConnected('meta_instagram')
                  ? 'Connected'
                  : 'Connect Instagram'}
              </button>
            </div>

            {/* Facebook Connection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    f
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Facebook Page</h3>
                    <p className="text-sm text-gray-600">Connect your Facebook business page</p>
                  </div>
                </div>
                {renderStatusBadge('meta_facebook')}
              </div>

              {(() => {
                const facebookAccount = getPlatformStatus('meta_facebook');
                return facebookAccount && facebookAccount.isActive ? (
                  <div className="bg-gray-50 rounded p-4 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {facebookAccount.accountName}
                    </p>
                    <p className="text-xs text-gray-600">
                      Connected: {new Date(facebookAccount.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Requirements:</strong>
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Facebook Business Page (not personal profile)</li>
                      <li>You must be an admin of the page</li>
                      <li>Page must be published and active</li>
                    </ul>
                  </div>
                );
              })()}

              <button
                onClick={() => handleConnect('meta_facebook', 'facebook')}
                disabled={connectingPlatform === 'meta_facebook' || isConnected('meta_facebook')}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  connectingPlatform === 'meta_facebook'
                    ? 'bg-blue-400 text-white cursor-wait'
                    : isConnected('meta_facebook')
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {connectingPlatform === 'meta_facebook'
                  ? 'Connecting...'
                  : isConnected('meta_facebook')
                  ? 'Connected'
                  : 'Connect Facebook'}
              </button>
            </div>

            {/* Info Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                How OAuth Connection Works
              </h3>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Click "Connect" button above</li>
                <li>You'll be redirected to the platform's authorization page</li>
                <li>Review and authorize the requested permissions</li>
                <li>You'll be redirected back to Fixlo</li>
                <li>Your account will be connected and ready to use</li>
              </ol>
              <p className="text-sm text-yellow-800 mt-4">
                <strong>Security:</strong> We use OAuth 2.0 - we never see or store your password.
                You can revoke access anytime from your platform's security settings.
              </p>
            </div>
            
            {/* Meta Debug Info Section (Admin Only) */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Meta OAuth Debug Info
                </h3>
                <button
                  onClick={loadMetaDebugInfo}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium text-gray-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
              
              {metaDebugInfo ? (
                <div className="space-y-3 text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">App Configured:</span>
                      <span className={`ml-2 ${metaDebugInfo.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                        {metaDebugInfo.isConfigured ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Node Env:</span>
                      <span className="ml-2 text-gray-900">{metaDebugInfo.nodeEnv || 'unknown'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Instagram Connected:</span>
                      <span className={`ml-2 ${metaDebugInfo.hasActiveInstagram ? 'text-green-600' : 'text-gray-500'}`}>
                        {metaDebugInfo.hasActiveInstagram ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Facebook Connected:</span>
                      <span className={`ml-2 ${metaDebugInfo.hasActiveFacebook ? 'text-green-600' : 'text-gray-500'}`}>
                        {metaDebugInfo.hasActiveFacebook ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                  
                  {metaDebugInfo.lastOAuthAttempt && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="font-medium text-gray-700 mb-2">Last OAuth Attempt:</p>
                      <div className="bg-white rounded p-3 space-y-1">
                        <div>
                          <span className="font-medium text-gray-600">Status:</span>
                          <span className={`ml-2 ${metaDebugInfo.lastOAuthAttempt.success ? 'text-green-600' : 'text-red-600'}`}>
                            {metaDebugInfo.lastOAuthAttempt.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </div>
                        {metaDebugInfo.lastOAuthAttempt.reason && (
                          <div>
                            <span className="font-medium text-gray-600">Reason:</span>
                            <span className="ml-2 text-gray-900">{metaDebugInfo.lastOAuthAttempt.reason}</span>
                          </div>
                        )}
                        {metaDebugInfo.lastOAuthAttempt.accountType && (
                          <div>
                            <span className="font-medium text-gray-600">Account Type:</span>
                            <span className="ml-2 text-gray-900">{metaDebugInfo.lastOAuthAttempt.accountType}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600">Timestamp:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(metaDebugInfo.lastOAuthAttempt.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {metaDebugInfo.connectedAccounts && metaDebugInfo.connectedAccounts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="font-medium text-gray-700 mb-2">Connected Accounts:</p>
                      <div className="space-y-2">
                        {metaDebugInfo.connectedAccounts.map((acc, idx) => (
                          <div key={idx} className="bg-white rounded p-3">
                            <div className="font-medium text-gray-900">@{acc.username}</div>
                            <div className="text-xs text-gray-600">
                              Platform: {acc.platform} | Token Valid: {acc.isTokenValid ? '✓' : '✗'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={loadMetaDebugInfo}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                  >
                    Load Debug Info
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
