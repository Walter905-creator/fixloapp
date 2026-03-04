const mongoose = require('mongoose');

const AdminSettingsSchema = new mongoose.Schema({
  // Singleton document identifier
  _singleton: { type: String, default: 'admin', unique: true },

  // Lead routing
  defaultLeadRadius: { type: Number, default: 25 }, // miles
  maxLeadsPerPro: { type: Number, default: 10 },
  autoAssignEnabled: { type: Boolean, default: true },

  // SMS
  smsPriorityEnabled: { type: Boolean, default: true },

  // Engine toggles (persisted state)
  aiLeadHunterEnabled: { type: Boolean, default: true },
  seoEngineEnabled: { type: Boolean, default: true },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
