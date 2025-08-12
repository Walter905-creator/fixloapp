// Database optimization utilities
const mongoose = require('mongoose');

class DatabaseOptimizer {
  // Ensure proper indexes exist for performance
  static async ensureIndexes() {
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected - skipping index optimization');
      return false;
    }

    try {
      const Pro = require('../models/Pro');
      const Review = require('../models/Review');

      console.log('🔍 Checking database indexes...');

      // Ensure Pro model indexes
      await Pro.collection.createIndex({ email: 1 }, { unique: true, background: true });
      await Pro.collection.createIndex({ phone: 1 }, { unique: true, background: true });
      await Pro.collection.createIndex({ slug: 1 }, { unique: true, background: true });
      await Pro.collection.createIndex({ trade: 1 }, { background: true });
      await Pro.collection.createIndex({ isActive: 1 }, { background: true });
      await Pro.collection.createIndex({ 'location': '2dsphere' }, { background: true });
      await Pro.collection.createIndex({ paymentStatus: 1 }, { background: true });
      await Pro.collection.createIndex({ stripeCustomerId: 1 }, { sparse: true, background: true });

      // Ensure Review model indexes
      await Review.collection.createIndex({ proId: 1 }, { background: true });
      await Review.collection.createIndex({ rating: 1 }, { background: true });
      await Review.collection.createIndex({ createdAt: -1 }, { background: true });
      await Review.collection.createIndex({ proId: 1, createdAt: -1 }, { background: true });

      console.log('✅ Database indexes optimized');
      return true;
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      return false;
    }
  }

  // Clean up old data (implement as needed)
  static async cleanupOldData() {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    try {
      // Example: Clean up failed registrations older than 30 days
      const Pro = require('../models/Pro');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await Pro.deleteMany({
        paymentStatus: 'failed',
        joinedDate: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} old failed registrations`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error.message);
      return false;
    }
  }

  // Get database statistics
  static async getDatabaseStats() {
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // MB
        storageSize: Math.round(stats.storageSize / 1024 / 1024 * 100) / 100, // MB
        indexes: stats.indexes,
        indexSize: Math.round(stats.indexSize / 1024 / 1024 * 100) / 100, // MB
        documents: stats.objects
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      return null;
    }
  }

  // Initialize optimization (run on server start)
  static async initialize() {
    // Wait a bit for the database connection to stabilize
    setTimeout(async () => {
      await this.ensureIndexes();
      await this.cleanupOldData();
      
      const stats = await this.getDatabaseStats();
      if (stats) {
        console.log('📊 Database stats:', stats);
      }
    }, 5000); // Wait 5 seconds after server start
  }
}

module.exports = DatabaseOptimizer;