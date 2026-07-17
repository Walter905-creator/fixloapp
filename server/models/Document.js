const mongoose = require('mongoose');

const previousVersionSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  ownerRole: {
    type: String,
    enum: ['homeowner', 'pro'],
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'invoice',
      'receipt',
      'contract',
      'photo',
      'permit',
      'insurance',
      'project_file',
      'before_photo',
      'after_photo',
      'other'
    ],
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  cloudinaryFormat: String,
  fileSize: Number,
  mimeType: String,
  version: {
    type: Number,
    default: 1
  },
  previousVersions: {
    type: [previousVersionSchema],
    default: []
  },
  description: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  sharedWith: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

documentSchema.index({ ownerId: 1, type: 1, createdAt: -1 });
documentSchema.index({ jobId: 1 });
documentSchema.index({ ownerId: 1, isDeleted: 1 });

module.exports = mongoose.model('Document', documentSchema);

