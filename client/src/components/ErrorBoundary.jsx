import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You could also log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
          <div className="max-w-2xl w-full">
            <div className="card p-8 text-center">
              {/* Error Icon */}
              <div className="mb-6">
                <svg 
                  className="w-16 h-16 mx-auto text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-lg text-slate-700 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary px-6 py-3"
                >
                  Refresh Page
                </button>
                <a
                  href="/"
                  className="btn btn-outline px-6 py-3"
                >
                  Go to Home
                </a>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium mb-2">
                    Technical Details (Development Only)
                  </summary>
                  <div className="bg-slate-100 rounded-lg p-4 overflow-auto">
                    <p className="text-sm text-red-600 font-mono mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 mb-2">
                Need help? Contact our support team
              </p>
              <a 
                href="/contact" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
