// models/Announcement.js - Updated version with proper department filtering for employees
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true
  },
  
  // NEW FIELDS FOR DEPARTMENT SUPPORT
  department: {
    type: String,
    required: false, // Not required for branch-wide announcements
    trim: true,
    index: true,
    maxlength: 100
  },
  targetType: {
    type: String,
    enum: ['branch', 'department'],
    default: 'branch',
    required: true,
    index: true
  },
  // END NEW FIELDS
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Optional fields for future enhancements
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Read tracking (optional for future use)
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'expired', 'draft', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// INDEXES FOR OPTIMAL QUERY PERFORMANCE
// Compound indexes for common query patterns
announcementSchema.index({ branchId: 1, expiresAt: 1 }); // Basic branch + expiry queries
announcementSchema.index({ branchId: 1, department: 1, expiresAt: 1 }); // Department-specific queries
announcementSchema.index({ branchId: 1, targetType: 1, expiresAt: 1 }); // Target type queries
announcementSchema.index({ createdBy: 1, createdAt: -1 }); // Creator's announcements
announcementSchema.index({ priority: 1, expiresAt: 1 }); // Priority-based queries
announcementSchema.index({ status: 1, expiresAt: 1 }); // Status-based queries

// Text index for search functionality (optional)
announcementSchema.index({ 
  title: 'text', 
  content: 'text',
  tags: 'text'
}, {
  name: 'announcement_text_index',
  weights: {
    title: 10,
    content: 5,
    tags: 3
  }
});

// VIRTUAL FIELDS
// Check if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Get days until expiry
announcementSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Get target description
announcementSchema.virtual('targetDescription').get(function() {
  if (this.targetType === 'department' && this.department) {
    return `${this.department} Department`;
  }
  return 'Branch-wide';
});

// INSTANCE METHODS
// Check if announcement targets a specific user - UPDATED LOGIC FOR EMPLOYEE FILTERING
announcementSchema.methods.targetsUser = function(userBranch, userDepartment, userRole = 'employee') {
  // Must be same branch first
  if (this.branchId.toString() !== userBranch.toString()) {
    return false;
  }

  // Admin and HR managers can see all announcements in their branch
  if (userRole === 'admin' || userRole === 'hr_manager') {
    return true;
  }

  // For employees: only show branch-wide announcements OR their own department announcements
  if (this.targetType === 'branch' || !this.department) {
    // Branch-wide announcement - all employees can see
    return true;
  }
  
  // Department-specific announcement - only show to employees in that department
  if (this.targetType === 'department' && this.department) {
    return this.department === userDepartment;
  }
  
  return false;
};

// Mark announcement as read by a user
announcementSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => 
    read.userId.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      userId: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Get read count
announcementSchema.methods.getReadCount = function() {
  return this.readBy.length;
};

// STATIC METHODS
// Get active announcements for a user - UPDATED WITH PROPER EMPLOYEE FILTERING
announcementSchema.statics.getForUser = async function(branchId, userDepartment = null, userRole = 'employee') {
  const now = new Date();
  
  let query = {
    branchId: branchId,
    expiresAt: { $gt: now },
    status: 'active'
  };

  // For employees and agents: strict filtering
  if (userRole === 'employee' || userRole === 'agent') {
    query.$or = [
      // Branch-wide announcements (no department specified)
      { 
        $and: [
          { targetType: 'branch' },
          { $or: [{ department: { $exists: false } }, { department: null }] }
        ]
      },
      // Department-specific announcements for user's department only
      ...(userDepartment ? [{
        $and: [
          { targetType: 'department' },
          { department: userDepartment }
        ]
      }] : [])
    ];
  }
  // For admin and HR managers: show all announcements in the branch
  // (no additional filtering needed beyond the base query)

  return this.find(query)
    .populate('createdBy', 'email')
    .populate('branchId', 'name')
    .sort({ priority: -1, createdAt: -1 }); // High priority first, then newest
};

// Get all announcements for admin view (no filtering)
announcementSchema.statics.getAllForAdmin = async function(branchId = null) {
  const now = new Date();
  
  let query = {
    expiresAt: { $gt: now },
    status: 'active'
  };

  // If branchId is provided, filter by branch
  if (branchId) {
    query.branchId = branchId;
  }

  return this.find(query)
    .populate('createdBy', 'email')
    .populate('branchId', 'name')
    .sort({ createdAt: -1 });
};

// Get announcements by department (for admin/HR use)
announcementSchema.statics.getByDepartment = async function(branchId, department) {
  const now = new Date();
  
  return this.find({
    branchId: branchId,
    department: department,
    targetType: 'department',
    expiresAt: { $gt: now },
    status: 'active'
  })
  .populate('createdBy', 'email')
  .populate('branchId', 'name')
  .sort({ createdAt: -1 });
};

// Get branch-wide announcements only
announcementSchema.statics.getBranchWideOnly = async function(branchId) {
  const now = new Date();
  
  return this.find({
    branchId: branchId,
    targetType: 'branch',
    $or: [
      { department: { $exists: false } },
      { department: null }
    ],
    expiresAt: { $gt: now },
    status: 'active'
  })
  .populate('createdBy', 'email')
  .populate('branchId', 'name')
  .sort({ createdAt: -1 });
};

// Clean up expired announcements
announcementSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      expiresAt: { $lte: now },
      status: { $ne: 'expired' }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  console.log(`Marked ${result.modifiedCount} announcements as expired`);
  return result;
};

// Get announcement statistics
announcementSchema.statics.getStats = async function(branchId, startDate, endDate) {
  const matchStage = { branchId: mongoose.Types.ObjectId(branchId) };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byTargetType: {
          $push: {
            targetType: '$targetType',
            department: '$department'
          }
        },
        byPriority: {
          $push: '$priority'
        },
        avgReadCount: {
          $avg: { $size: '$readBy' }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        branchWide: {
          $size: {
            $filter: {
              input: '$byTargetType',
              cond: { $eq: ['$$this.targetType', 'branch'] }
            }
          }
        },
        departmentSpecific: {
          $size: {
            $filter: {
              input: '$byTargetType',
              cond: { $eq: ['$$this.targetType', 'department'] }
            }
          }
        },
        highPriority: {
          $size: {
            $filter: {
              input: '$byPriority',
              cond: { $eq: ['$$this', 'high'] }
            }
          }
        },
        avgReadCount: { $round: ['$avgReadCount', 2] }
      }
    }
  ]);
};

// PRE-SAVE MIDDLEWARE
// Set status to expired if expiresAt is in the past
announcementSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt <= new Date() && this.status !== 'expired') {
    this.status = 'expired';
  }
  next();
});

// Ensure department is null for branch-wide announcements
announcementSchema.pre('save', function(next) {
  if (this.targetType === 'branch') {
    this.department = null;
  }
  next();
});

// POST-SAVE MIDDLEWARE
// Log announcement creation
announcementSchema.post('save', function(doc) {
  console.log(`Announcement created/updated: ${doc.title} (${doc.targetType}${doc.department ? ' - ' + doc.department : ''})`);
});

// Create and export the model
const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;