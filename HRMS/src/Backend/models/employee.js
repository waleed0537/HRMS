const mongoose = require('mongoose');

// Function to generate unique employee ID
async function generateEmployeeId() {
  const lastEmployee = await Employee.findOne({}, {}, { sort: { 'personalDetails.id': -1 } });
  let newId = 1;
  
  if (lastEmployee && lastEmployee.personalDetails.id) {
    const lastIdNum = parseInt(lastEmployee.personalDetails.id.replace('EMP', ''));
    if (!isNaN(lastIdNum)) {
      newId = lastIdNum + 1;
    }
  }
  
  return `EMP${String(newId).padStart(5, '0')}`;
}

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalDetails: {
    name: { 
      type: String, 
      required: true 
    },
    id: { 
      type: String, 
      unique: true 
    },
    contact: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    address: String
  },
  professionalDetails: {
    role: {
      type: String,
      enum: ['employee', 'agent', 'hr_manager', 't1_member', 'operational_manager'],
      required: true
    },
    branch: { 
      type: String, 
      required: true 
    },
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
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  rating: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware to automatically generate employee ID if not provided
employeeSchema.pre('save', async function(next) {
  if (!this.personalDetails.id) {
    this.personalDetails.id = await generateEmployeeId();
  }
  next();
});

// Add indexes for better query performance
employeeSchema.index({ userId: 1 });
employeeSchema.index({ 'personalDetails.email': 1 });
employeeSchema.index({ 'personalDetails.id': 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;