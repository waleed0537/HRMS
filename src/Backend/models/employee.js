// models/employee.js
const mongoose = require('mongoose');

// Define milestone schema for employment history tracking
const milestoneSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  branch: { 
    type: String 
  },
  impact: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['milestone', 'role_change', 'branch_transfer', 'status_change', 'document_upload'],
    default: 'milestone'
  }
});

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalDetails: {
    name: { type: String, required: true },
    id: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    address: String
  },
  professionalDetails: {
    role: {
      type: String,
      enum: ['employee', 'agent', 'hr_manager', 't1_member', 'operational_manager'],
      required: true
    },
    branch: { type: String, required: true },
    department: String,
    status: {
      type: String,
      enum: ['active', 'resigned', 'terminated', 'on_leave'],
      default: 'active'
    }
  },
  documents: [{
    name: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Add milestones array to track employment history
  milestones: [milestoneSchema],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Enable automatic timestamps handling

// Create indexes for efficient queries
employeeSchema.index({ userId: 1 });
employeeSchema.index({ 'personalDetails.email': 1 });

// Add methods to help with milestone tracking
employeeSchema.methods.addMilestone = function(milestone) {
  this.milestones.push(milestone);
  return this.save();
};

// Add method to record role changes
employeeSchema.methods.recordRoleChange = function(oldRole, newRole) {
  const milestone = {
    title: `Role changed to ${formatRole(newRole)}`,
    description: `Role updated from ${formatRole(oldRole)} to ${formatRole(newRole)}`,
    date: new Date(),
    branch: this.professionalDetails.branch,
    impact: 'Employee role has been updated with new responsibilities and permissions',
    type: 'role_change'
  };
  return this.addMilestone(milestone);
};

// Add method to record branch transfers
employeeSchema.methods.recordBranchTransfer = function(oldBranch, newBranch) {
  const milestone = {
    title: `Transferred to ${newBranch} branch`,
    description: `Branch transfer from ${oldBranch} to ${newBranch}`,
    date: new Date(),
    branch: newBranch,
    impact: 'Employee moved to a new branch location',
    type: 'branch_transfer'
  };
  return this.addMilestone(milestone);
};

// Add method to record status changes
employeeSchema.methods.recordStatusChange = function(oldStatus, newStatus) {
  const milestone = {
    title: `Status changed to ${newStatus.replace('_', ' ')}`,
    description: `Employee status updated from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
    date: new Date(),
    branch: this.professionalDetails.branch,
    impact: `Employee is now ${newStatus.replace('_', ' ')}`,
    type: 'status_change'
  };
  return this.addMilestone(milestone);
};

// Add method to record document uploads
employeeSchema.methods.recordDocumentUpload = function(documentName) {
  const milestone = {
    title: 'Document Uploaded',
    description: `New document uploaded: ${documentName}`,
    date: new Date(),
    branch: this.professionalDetails.branch,
    type: 'document_upload'
  };
  return this.addMilestone(milestone);
};

// Helper function to format role names
function formatRole(role) {
  if (!role) return 'Unknown';
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;