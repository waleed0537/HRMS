// Fixed Attendance.js model with proper exports and initialization
const mongoose = require('mongoose');

// Define the schema first
const attendanceSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true
  },
  employeeNumber: {
    type: String,
    required: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timeIn: {
    type: Date,
    required: true,
    index: true
  },
  timeOut: {
    type: Date
  },
  location: {
    type: String
  },
  verifyMethod: {
    type: String
  },
  status: {
    type: String,
    enum: ['present', 'late', 'half-day', 'adjusted'],
    default: 'present'
  },
  notes: {
    type: String
  },
  deviceUserId: {
    type: Number,
    index: true
  },
  modified: {
    type: Boolean,
    default: false
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: {
    type: Date
  },
  rawData: {
    type: String
  },
  shiftStart: {
    type: Date
  },
  shiftEnd: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes after schema definition
attendanceSchema.index({ employeeNumber: 1, date: 1 });
attendanceSchema.index({ deviceUserId: 1, date: 1 });
attendanceSchema.index({ department: 1, date: 1 });
attendanceSchema.index({ date: 1, timeIn: 1 });

// Create and export the model
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Function to ensure proper indexes exist - moved AFTER model creation
async function ensureIndexes() {
  try {
    console.log('Verifying attendance collection indexes...');
    
    // Now we can safely use Attendance.collection
    const collection = Attendance.collection;
    
    // Get all indices on the collection
    const indices = await collection.indexes();
    
    // Find any problematic unique indices
    const uniqueIndices = indices.filter(index => 
      index.unique === true && 
      (
        // Look for problematic unique indices that could cause duplicate key errors
        (index.key && index.key.deviceUserId === 1 && index.key.date === 1) ||
        (index.key && index.key.employeeNumber === 1 && index.key.date === 1)
      )
    );
    
    // Drop problematic unique indices if found
    if (uniqueIndices.length > 0) {
      console.log(`Found ${uniqueIndices.length} problematic unique indices to drop`);
      
      for (const index of uniqueIndices) {
        console.log(`Dropping index: ${index.name}...`);
        await collection.dropIndex(index.name);
        console.log(`Successfully dropped index: ${index.name}`);
      }
    }
    
    console.log('Attendance indexes verified successfully');
  } catch (error) {
    console.error('Error verifying attendance indexes:', error);
  }
}

// Call ensureIndexes but don't block startup with await
ensureIndexes().catch(err => {
  console.error('Initial index verification failed:', err);
});

// Export the model
module.exports = Attendance;