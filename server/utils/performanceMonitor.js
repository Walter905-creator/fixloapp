// Performance monitoring utility for API endpoints
const mongoose = require('mongoose');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  // Monitor API endpoint performance
  middleware() {
    const self = this; // Capture the correct context
    return (req, res, next) => {
      const startTime = Date.now();
      const originalEnd = res.end;
      
      res.end = function(...args) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log slow requests (>2 seconds)
        if (duration > 2000) {
          console.warn(`🐌 Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
        }
        
        // Track metrics
        const key = `${req.method}_${req.route?.path || req.path}`;
        if (!self.metrics.has(key)) {
          self.metrics.set(key, { count: 0, totalTime: 0, avgTime: 0 });
        }
        
        const metric = self.metrics.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = Math.round(metric.totalTime / metric.count);
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  // Get performance stats
  getStats() {
    const stats = {};
    this.metrics.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  // Database performance check
  async checkDatabasePerformance() {
    if (mongoose.connection.readyState !== 1) {
      return { status: 'disconnected', responseTime: null };
    }

    const startTime = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      return { status: 'healthy', responseTime };
    } catch (error) {
      return { status: 'error', responseTime: null, error: error.message };
    }
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  // System health summary
  async getHealthSummary() {
    const [dbPerformance, memoryUsage] = await Promise.all([
      this.checkDatabasePerformance(),
      Promise.resolve(this.getMemoryUsage())
    ]);

    return {
      timestamp: new Date().toISOString(),
      database: dbPerformance,
      memory: memoryUsage,
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      apiMetrics: this.getStats()
    };
  }
}

module.exports = new PerformanceMonitor();