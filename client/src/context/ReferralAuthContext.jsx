import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * ReferralAuthContext - Lightweight authentication for referral users
 * 
 * IMPORTANT: This is SEPARATE from ProAuthContext (AuthContext)
 * - Referral accounts are NOT Pro accounts
 * - Uses phone verification only (no password)
 * - Stores session in localStorage as 'fixlo_referrer'
 * - Independent auth flow for /earn routes
 */

const ReferralAuthContext = createContext(null);

export const useReferralAuth = () => {
  const context = useContext(ReferralAuthContext);
  if (!context) {
    throw new Error('useReferralAuth must be used within a ReferralAuthProvider');
  }
  return context;
};

export const ReferralAuthProvider = ({ children }) => {
  const [referralUser, setReferralUser] = useState(null);
  const [isReferralAuthenticated, setIsReferralAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load referral auth state from localStorage on mount
  useEffect(() => {
    const loadReferralAuthState = () => {
      try {
        const referrerData = localStorage.getItem('fixlo_referrer');
        
        if (referrerData) {
          const userData = JSON.parse(referrerData);
          setReferralUser(userData);
          setIsReferralAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading referral auth state:', error);
        // Clear invalid data
        localStorage.removeItem('fixlo_referrer');
      } finally {
        setLoading(false);
      }
    };

    loadReferralAuthState();
  }, []);

  const loginReferral = (referralData) => {
    try {
      localStorage.setItem('fixlo_referrer', JSON.stringify(referralData));
      setReferralUser(referralData);
      setIsReferralAuthenticated(true);
    } catch (error) {
      console.error('Error saving referral auth state:', error);
      throw error;
    }
  };

  const logoutReferral = () => {
    localStorage.removeItem('fixlo_referrer');
    setReferralUser(null);
    setIsReferralAuthenticated(false);
  };

  const value = {
    referralUser,
    isReferralAuthenticated,
    loading,
    loginReferral,
    logoutReferral
  };

  return (
    <ReferralAuthContext.Provider value={value}>
      {children}
    </ReferralAuthContext.Provider>
  );
};
