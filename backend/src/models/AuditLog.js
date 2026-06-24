const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['super-admin', 'admin', 'technician'],
    required: true,
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
  },
  labName: {
    type: String,
  },
  module: {
    type: String,
    required: true,
    enum: [
      'USERS',
      'PATIENTS',
      'REPORTS',
      'TEMPLATES',
      'SUBSCRIPTIONS',
      'REVENUE',
      'FEEDBACK',
      'SETTINGS',
    ],
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'STATUS_CHANGE',
      'PRINT',
      'DOWNLOAD',
      'ACTIVATE',
      'DEACTIVATE',
      'RENEW',
      'CANCEL',
      'EXPIRED',
      'SUBMIT',
      'UPLOAD',
      'ROLE_CHANGE',
      'PLAN_CHANGE',
      'ADJUSTMENT',
      'CORRECTION',
      'VERIFY',
      'EXTEND',
    ],
  },
  entityId: {
    type: String,
  },
  entityType: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  oldData: {
    type: mongoose.Schema.Types.Mixed,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ lab: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityId: 1 });

// Audit logs are immutable - prevent updates
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    const err = new Error('Audit logs are immutable and cannot be modified');
    return next(err);
  }
  next();
});

// Prevent findOneAndUpdate, updateOne, updateMany, deleteOne, deleteMany
auditLogSchema.statics.findOneAndUpdate = function () {
  throw new Error('Audit logs are immutable and cannot be updated');
};
auditLogSchema.statics.updateOne = function () {
  throw new Error('Audit logs are immutable and cannot be updated');
};
auditLogSchema.statics.updateMany = function () {
  throw new Error('Audit logs are immutable and cannot be updated');
};
auditLogSchema.statics.deleteOne = function () {
  throw new Error('Audit logs are immutable and cannot be deleted');
};
auditLogSchema.statics.deleteMany = function () {
  throw new Error('Audit logs are immutable and cannot be deleted');
};
auditLogSchema.statics.findByIdAndDelete = function () {
  throw new Error('Audit logs are immutable and cannot be deleted');
};
auditLogSchema.statics.findByIdAndRemove = function () {
  throw new Error('Audit logs are immutable and cannot be deleted');
};

module.exports = mongoose.model('AuditLog', auditLogSchema);