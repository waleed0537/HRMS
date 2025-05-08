// models/SyncStatus.js
const mongoose = require('mongoose');

const syncStatusSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  success: {
    type: Boolean,
    required: true
  },
  message: {
    type: String
  },
  recordsProcessed: {
    type: Number,
    default: 0
  },
  recordsAdded: {
    type: Number,
    default: 0
  },
  todayRecords: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  deviceInfo: {
    ip: String,
    port: Number,
    users: Number
  }
}, {
  timestamps: true
});

// Add indexes to speed up queries
syncStatusSchema.index({ success: 1 });
syncStatusSchema.index({ createdAt: -1 });

// Add method to get latest status
syncStatusSchema.statics.getLatest = async function() {
  return this.findOne().sort({ timestamp: -1 }).lean();
};

// Add method to get daily summary
syncStatusSchema.statics.getDailySummary = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSyncs: { $sum: 1 },
        successfulSyncs: { 
          $sum: { $cond: ["$success", 1, 0] }
        },
        failedSyncs: {
          $sum: { $cond: ["$success", 0, 1] }
        },
        totalRecordsProcessed: { $sum: "$recordsProcessed" },
        totalRecordsAdded: { $sum: "$recordsAdded" },
        lastSync: { $max: "$timestamp" }
      }
    }
  ]);
};

const SyncStatus = mongoose.model('SyncStatus', syncStatusSchema);

module.exports = SyncStatus;