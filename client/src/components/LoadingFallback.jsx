import React, { useState, useEffect } from 'react';

const LoadingFallback = ({ onTimeout, timeoutDuration = 5000 }) => {
  const [loadingMessage, setLoadingMessage] = useState('Loading application...');
  const [dots, setDots] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    // Animated dots effect
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    // Progressive loading messages
    const messageInterval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        if (newTime === 1) {
          setLoadingMessage('Initializing Fixlo');
        } else if (newTime === 3) {
          setLoadingMessage('Loading home services');
        } else if (newTime === 5) {
          setLoadingMessage('Almost ready');
        } else if (newTime >= 7) {
          setLoadingMessage('This is taking longer than expected');
        }
        
        return newTime;
      });
    }, 1000);

    // Timeout mechanism
    const timeoutTimer = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutDuration);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
      clearTimeout(timeoutTimer);
    };
  }, [onTimeout, timeoutDuration]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '2rem'
      }}>
        {/* Fixlo Logo */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            animation: 'pulse 2s infinite'
          }}>
            🔧
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1a202c',
            margin: '0'
          }}>
            Fixlo
          </h1>
        </div>

        {/* Loading Message */}
        <div style={{
          marginBottom: '1.5rem'
        }}>
          <p style={{
            fontSize: '1.125rem',
            color: '#4a5568',
            margin: '0 0 0.5rem 0'
          }}>
            {loadingMessage}{dots}
          </p>
          
          {timeElapsed >= 7 && (
            <p style={{
              fontSize: '0.875rem',
              color: '#718096',
              margin: '0.5rem 0 0 0'
            }}>
              Please wait while we set up your home services platform...
            </p>
          )}
        </div>

        {/* Loading Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '2px',
            animation: 'loading 2s infinite'
          }} />
        </div>

        {/* Help Text */}
        {timeElapsed >= 5 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#718096',
              margin: '0 0 0.5rem 0'
            }}>
              Having trouble loading?
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingFallback;