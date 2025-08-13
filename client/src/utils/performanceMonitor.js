/**
 * Performance monitoring utilities for Fixlo frontend
 * Tracks page load times, component render times, and user interactions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isEnabled = !this.isProduction; // Disable in production for privacy
  }

  /**
   * Mark the start of a performance measurement
   */
  markStart(name) {
    if (!this.isEnabled || !performance.mark) return;
    
    try {
      performance.mark(`${name}-start`);
    } catch (error) {
      // Silently fail if performance API not available
    }
  }

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  markEnd(name) {
    if (!this.isEnabled || !performance.mark || !performance.measure) return;
    
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        this.metrics[name] = {
          duration: measure.duration,
          timestamp: Date.now()
        };
        
        // Log slow operations (>1000ms) in development
        if (measure.duration > 1000) {
          console.warn(`⚠️ Slow operation detected: ${name} took ${measure.duration.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      // Silently fail if performance API not available
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {};
    
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  /**
   * Track page navigation timing
   */
  trackPageLoad() {
    if (!this.isEnabled || !window.performance || !window.performance.timing) return;

    // Wait for page to fully load
    window.addEventListener('load', () => {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      
      this.metrics.pageLoad = {
        duration: pageLoadTime,
        timestamp: Date.now(),
        details: {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          domInteractive: timing.domInteractive - timing.navigationStart,
          domComplete: timing.domComplete - timing.navigationStart
        }
      };

      // Log slow page loads (>3000ms) in development
      if (pageLoadTime > 3000) {
        console.warn(`⚠️ Slow page load detected: ${pageLoadTime}ms`);
      }
    });
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();

    this.markStart(`component-${componentName}`);
    const result = renderFunction();
    this.markEnd(`component-${componentName}`);
    
    return result;
  }

  /**
   * Get Web Vitals if available
   */
  getWebVitals() {
    if (!this.isEnabled || !window.performance) return null;

    try {
      // Try to get LCP (Largest Contentful Paint)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1];

      // Try to get FID (First Input Delay) - requires user interaction
      const fidEntries = performance.getEntriesByType('first-input');
      const fid = fidEntries[0];

      // Try to get CLS (Cumulative Layout Shift)
      const clsEntries = performance.getEntriesByType('layout-shift');
      const cls = clsEntries.reduce((sum, entry) => {
        if (!entry.hadRecentInput) {
          return sum + entry.value;
        }
        return sum;
      }, 0);

      return {
        lcp: lcp ? lcp.startTime : null,
        fid: fid ? fid.processingStart - fid.startTime : null,
        cls: cls || null
      };
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-track page load
performanceMonitor.trackPageLoad();

export default performanceMonitor;