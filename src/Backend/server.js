import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createBranch, getAllBranches, updateBranchRole, deleteBranch } from './models/BranchAnnouncement.js';
// Get current file directory path (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models - make sure these files are also using ES module syntax
import User from '../Backend/models/Users.js';
import Employee from '../Backend/models/employee.js';
import Leave from '../Backend/models/Leave.js';
import Branch from '../Backend/models/branch.js';
import Announcement from '../Backend/models/Announcement.js';
import Notification from '../Backend/models/Notification.js';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173', // Vite preview port
  'https://hrms-sxi4.onrender.com' // Replace with your Render frontend URL
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const app = express();
const JWT_SECRET = 'your-jwt-secret-key';

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
if (!fs.existsSync('./uploads/documents')) {
  fs.mkdirSync('./uploads/documents');
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: './uploads/documents/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

const checkPermission = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access for both admin and HR manager
    if (user.isAdmin || user.role === 'hr_manager') {
      req.userRole = user.role;
      next();
    } else {
      // Regular employees can only access their own requests
      req.userRole = 'employee';
      next();
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking permissions' });
  }
};

async function createTestLeaveRequest() {
  try {
    // Find an existing employee
    const employee = await Employee.findOne();
    
    if (!employee) {
      console.log('No employees found to create test leave request');
      return;
    }

    // Create a test leave request
    const testLeave = new Leave({
      employeeId: employee.userId,
      employeeName: employee.personalDetails.name,
      employeeEmail: employee.personalDetails.email,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      leaveType: 'annual',
      reason: 'Test leave request',
      status: 'pending',
      documents: []
    });

    await testLeave.save();
    console.log('Test leave request created successfully');
  } catch (error) {
    console.error('Error creating test leave request:', error);
  }
}
// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Invalid file type!');
  }
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// MongoDB Connection
mongoose.connect('mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Create admin user if not exists
async function createAdminUser() {
  try {
    const adminExists = await User.findOne({ email: 'admin@mail.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@mail.com',
        password: 'admin',
        role: 'admin',
        branchName: 'HQ',
        status: 'approved',
        isAdmin: true,
      });
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

createAdminUser();

// Routes
// Sign Up
app.post('/api/signup', async (req, res) => {
  try {
    const { personalDetails, professionalDetails, password } = req.body;
    
    // Validate input
    if (!personalDetails || !professionalDetails || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if all required fields are present
    const requiredPersonalFields = ['name', 'email', 'contact', 'address'];
    const requiredProfessionalFields = ['role', 'branch', 'department', 'status'];
    
    const missingPersonalFields = requiredPersonalFields.filter(field => !personalDetails[field]);
    const missingProfessionalFields = requiredProfessionalFields.filter(field => !professionalDetails[field]);
    
    if (missingPersonalFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing personal fields: ${missingPersonalFields.join(', ')}` 
      });
    }

    if (missingProfessionalFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing professional fields: ${missingProfessionalFields.join(', ')}` 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: personalDetails.email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account with pending status
    const user = await User.create({
      email: personalDetails.email,
      password: hashedPassword, // Use hashed password
      role: professionalDetails.role,
      branchName: professionalDetails.branch,
      status: 'pending'
    });

    // Generate unique employee ID (you can create a more sophisticated method)
    const generateEmployeeId = () => {
      return `EMP${Date.now()}`;
    };

    // Create corresponding employee record
    const employee = await Employee.create({
      personalDetails: {
        name: personalDetails.name,
        id: generateEmployeeId(), // Add employee ID
        contact: personalDetails.contact,
        email: personalDetails.email,
        address: personalDetails.address
      },
      professionalDetails: {
        role: professionalDetails.role,
        branch: professionalDetails.branch,
        department: professionalDetails.department,
        status: professionalDetails.status
      },
      userId: user._id // Link employee to user account
    });

    res.status(201).json({ 
      message: 'Signup request submitted for approval',
      userId: user._id 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Error creating user account', 
      error: error.toString() // Use toString to ensure error is serializable
    });
  }
});

// Sign In
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(400).json({ message: 'Account pending approval' });
    }

    if (user.status === 'rejected') {
      return res.status(400).json({ message: 'Account access denied' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error signing in', error: error.message });
  }
});

// Employee Routes
// Create new employee
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    // Join employees with users collection to get all necessary data
    const employees = await Employee.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $match: {
          'user.status': 'approved'
        }
      },
      {
        $project: {
          personalDetails: 1,
          professionalDetails: 1,
          documents: 1,
          rating: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 1
        }
      }
    ]);

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      message: 'Error fetching employees', 
      error: error.message 
    });
  }
});
// Get all employees


// Get employee by ID
app.get('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update employee
app.put('/api/employees/:id', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const updateData = JSON.parse(req.body.employeeData);
    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path,
      uploadedAt: new Date()
    })) : [];

    // Find employee
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // First update User collection
    const userUpdate = await User.findByIdAndUpdate(
      employee.userId,
      {
        role: updateData.professionalDetails.role,
        branchName: updateData.professionalDetails.branch,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!userUpdate) {
      throw new Error('Failed to update user data');
    }

    // Then update Employee collection
    const updates = {
      professionalDetails: updateData.professionalDetails,
      updatedAt: new Date()
    };

    if (documents.length > 0) {
      updates.$push = { documents: { $each: documents } };
    }

    if (updateData.milestones && updateData.milestones.length > 0) {
      if (!updates.$push) updates.$push = {};
      updates.$push.milestones = { $each: updateData.milestones };
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json(updatedEmployee);

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/employees/:id/documents', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/employees/:id/milestones', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee.milestones || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.delete('/api/employees/:id/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const document = employee.documents.id(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from storage
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Remove document from employee record
    employee.documents.pull(req.params.documentId);
    await employee.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Requests (Admin Only)
app.get('/api/pending-requests', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingRequests = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Approve/Reject Request (Admin Only)
app.put('/api/requests/:userId/status', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update user status
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const notification = new Notification({
      userId: req.params.userId,
      title: 'Account Status Update',
      message: `Your account has been ${status}`,
      type: 'account'
    });
    await notification.save();

    // If approved, create or update the corresponding employee record
    if (status === 'approved') {
      // Check if employee record already exists
      let employee = await Employee.findOne({ userId: user._id });
      
      if (!employee) {
        // Create new employee record
        employee = new Employee({
          userId: user._id,
          personalDetails: {
            name: user.email.split('@')[0], // Temporary name from email
            id: `EMP${Date.now()}`, // Generate a unique employee ID
            contact: 'Not provided',
            email: user.email,
            address: 'Not provided'
          },
          professionalDetails: {
            role: user.role,
            branch: user.branchName,
            department: 'General',
            status: 'active'
          }
        });
        await employee.save();
      } else {
        // Update existing employee record
        employee.professionalDetails.status = 'active';
        await employee.save();
      }
    }

    res.json({
      message: `User ${status} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ 
      message: 'Error updating request', 
      error: error.message 
    });
  }
});

// In server.js, keep just one handler:
// Add this endpoint to server.js
app.get('/api/leaves/filter/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Find leave requests for this employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const leaveRequests = await Leave.find({
      employeeId: employeeId
    }).sort({ createdAt: -1 });
    
    res.json(leaveRequests);
    
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ 
      message: 'Error fetching leave requests',
      error: error.message 
    });
  }
});

//Leave management endpoints 
app.post('/api/leaves', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path
    })) : [];

    const leaveRequest = new Leave({
      employeeId: req.user.id,
      employeeName: user.name || user.email,
      employeeEmail: user.email,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      leaveType: req.body.leaveType,
      reason: req.body.reason,
      documents: documents
    });

    await leaveRequest.save();
    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { employeeEmail } = req.query;
    
    // Build query based on email and user role
    const query = {};
    if (employeeEmail) {
      query.employeeEmail = employeeEmail;
    } else if (!req.user.isAdmin) {
      query.employeeEmail = req.user.email;
    }

    const leaveRequests = await Leave.find(query)
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

app.get('/api/leaves/debug/:email', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { email } = req.params;
    
    const leaves = await Leave.find({ employeeEmail: email }).lean();
    const employee = await Employee.findOne({ 'personalDetails.email': email }).lean();
    
    res.json({
      leaves,
      employee,
      leaveCount: leaves.length,
      employeeFound: !!employee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific leave request
app.get('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    const leaveRequest = await Leave.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has permission to view this request
    if (!req.user.isAdmin && leaveRequest.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/leaves/:id/status', authenticateToken, checkPermission, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'hr_manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leaveRequest = await Leave.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('employeeId');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Create notification
    const notification = new Notification({
      userId: leaveRequest.employeeId,
      title: 'Leave Request Update',
      message: `Your ${leaveRequest.leaveType} leave request has been ${status}`,
      type: 'leave'
    });
    await notification.save();

    // Socket notification could be added here if implementing real-time updates

    res.json(leaveRequest);
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ 
      message: 'Error updating leave request', 
      error: error.message 
    });
  }
});

app.get('/api/leaves/stats', authenticateToken, checkPermission, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'hr_manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Leave.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete leave request
app.delete('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    const leaveRequest = await Leave.findById(req.params.id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Only allow admin or the request owner to delete
    if (!req.user.isAdmin && leaveRequest.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated documents
    if (leaveRequest.documents && leaveRequest.documents.length > 0) {
      leaveRequest.documents.forEach(doc => {
        if (fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let leaveRequests;
    
    if (user.isAdmin) {
      // Admins can see all requests
      leaveRequests = await Leave.find().sort({ createdAt: -1 });
    } else {
      // Regular users can only see their own requests
      leaveRequests = await Leave.find({ employeeId: req.user.id }).sort({ createdAt: -1 });
    }
    
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/leaves/employee/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user has permission to view these leaves
    if (!req.user.isAdmin && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find leaves for this user
    const employee = await Employee.findOne({ userId: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const leaves = await Leave.find({ employeeId: employee._id })
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ 
      message: 'Error fetching leaves', 
      error: error.message 
    });
  }
});
// Add these routes to server.js

// Create branch
app.post('/api/branches', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, hrManager, t1Member, operationalManager } = req.body;
    
    // Update employee roles
    await Employee.findByIdAndUpdate(hrManager, {
      'professionalDetails.role': 'hr_manager'
    });
    await Employee.findByIdAndUpdate(t1Member, {
      'professionalDetails.role': 't1_member'
    });
    await Employee.findByIdAndUpdate(operationalManager, {
      'professionalDetails.role': 'operational_manager'
    });

    const branch = new Branch({
      name,
      hrManager,
      t1Member,
      operationalManager
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/branches', authenticateToken, async (req, res) => {
  try {
    const branches = await Branch.find().lean();
    console.log('Raw branches:', branches);
    
    const employeeIds = branches.reduce((ids, branch) => {
      ids.push(branch.hrManager, branch.t1Member, branch.operationalManager);
      return ids;
    }, []);
    
    console.log('Employee IDs to fetch:', employeeIds);
    
    const employees = await Employee.find({
      _id: { $in: employeeIds }
    }).lean();

    console.log('Found employees:', employees);

    const employeeMap = employees.reduce((map, emp) => {
      map[emp._id.toString()] = emp.personalDetails.name;
      return map;
    }, {});

    console.log('Employee map:', employeeMap);

    const branchesWithNames = branches.map(branch => ({
      ...branch,
      hrManagerName: employeeMap[branch.hrManager.toString()] || 'Not Assigned',
      t1MemberName: employeeMap[branch.t1Member.toString()] || 'Not Assigned',
      operationalManagerName: employeeMap[branch.operationalManager.toString()] || 'Not Assigned'
    }));

    console.log('Final branches with names:', branchesWithNames);

    res.json(branchesWithNames);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: error.message });
  }
});
app.put('/api/branches/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const { hrManager, t1Member, operationalManager } = req.body;

    // Reset roles of previous position holders if they're being replaced
    if (branch.hrManager.toString() !== hrManager) {
      await Employee.findByIdAndUpdate(branch.hrManager, {
        'professionalDetails.role': 'employee'
      });
      await Employee.findByIdAndUpdate(hrManager, {
        'professionalDetails.role': 'hr_manager'
      });
    }

    if (branch.t1Member.toString() !== t1Member) {
      await Employee.findByIdAndUpdate(branch.t1Member, {
        'professionalDetails.role': 'employee'
      });
      await Employee.findByIdAndUpdate(t1Member, {
        'professionalDetails.role': 't1_member'
      });
    }

    if (branch.operationalManager.toString() !== operationalManager) {
      await Employee.findByIdAndUpdate(branch.operationalManager, {
        'professionalDetails.role': 'employee'
      });
      await Employee.findByIdAndUpdate(operationalManager, {
        'professionalDetails.role': 'operational_manager'
      });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json(updatedBranch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add to your routes file
app.put('/api/branches/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role, employeeId } = req.body;
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    branch[role] = employeeId;
    await branch.save();

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to server.js

app.post('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const { title, content, branchId, priority, expiresAt } = req.body;
    
    if (!title || !content || !branchId || !expiresAt) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    const announcement = new Announcement({
      title,
      content,
      branchId, // Store as ObjectId
      createdBy: req.user.id,
      priority: priority || 'medium',
      expiresAt: new Date(expiresAt)
    });

    await announcement.save();
    console.log('Created announcement:', announcement);
    
    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      message: 'Failed to create announcement',
      error: error.message 
    });
  }
});

// Add this route to your server.js
app.get('/api/announcements/:branchId', authenticateToken, async (req, res) => {
  try {
    const branchId = req.params.branchId;
    console.log('Received announcement request for branchId:', branchId);
    
    // First check if the branch exists
    const branch = await Branch.findById(branchId);
    console.log('Found branch:', branch);

    // Get current time for expiry check
    const now = new Date();
    console.log('Current time:', now);

    // Get all announcements first
    const allAnnouncements = await Announcement.find({ branchId: branchId });
    console.log('All announcements before expiry filter:', allAnnouncements);

    // Then get active ones
    const activeAnnouncements = await Announcement.find({
      branchId: branchId,
      expiresAt: { $gt: now }
    })
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 });

    console.log('Active announcements after expiry filter:', activeAnnouncements);

    if (allAnnouncements.length === 0) {
      console.log('No announcements found for branch');
    } else if (activeAnnouncements.length === 0) {
      console.log('All announcements have expired');
      allAnnouncements.forEach(ann => {
        console.log('Announcement expiry status:', {
          title: ann.title,
          expiresAt: ann.expiresAt,
          isExpired: ann.expiresAt <= now
        });
      });
    }

    res.json(activeAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      message: 'Error fetching announcements',
      error: error.message
    });
  }
});

// Get announcements by branch
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'email')
      .populate('branchId', 'name')
      .sort('-createdAt');
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete announcement
app.delete('/api/announcements/:id', authenticateToken, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this route to your server.js
app.get('/api/employees/byemail/:email', authenticateToken, async (req, res) => {
  try {
    const email = req.params.email;
    console.log('Looking up employee by email:', email);
    
    const employee = await Employee.findOne({
      'personalDetails.email': email
    });
    
    if (!employee) {
      console.log('No employee found for email:', email);
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    console.log('Found employee:', employee);
    res.json(employee);
  } catch (error) {
    console.error('Error finding employee by email:', error);
    res.status(500).json({ 
      message: 'Error fetching employee data',
      error: error.message 
    });
  }
});

// Add this endpoint in server.js
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Get the user data as well
    const user = await User.findById(req.user.id).select('-password');
    
    // Combine employee and user data
    const profile = {
      ...employee.toObject(),
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      message: 'Error fetching profile data',
      error: error.message 
    });
  }
});

// Update this endpoint in server.js
app.get('/api/leaves/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    console.log('Requesting leaves for employee:', employeeId);
    
    // Get the employee to verify permission
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Allow access if user is admin, HR manager, or the employee themselves
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    // Check if the requesting user has permission
    const hasPermission = 
      requestingUser.isAdmin || 
      requestingUser.role === 'hr_manager' || 
      employee.userId.toString() === requestingUser._id.toString();

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to view these leaves' });
    }

    // If authorized, fetch the leaves
    const leaves = await Leave.find({ employeeId })
      .sort({ createdAt: -1 });

    console.log(`Found ${leaves.length} leaves for employee ${employeeId}`);
    res.json(leaves);

  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({ 
      message: 'Error fetching leave history',
      error: error.message 
    });
  }
});


app.get('/api/employees/:id/history', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const history = [];

    // Add milestones
    if (employee.milestones) {
      employee.milestones.forEach(milestone => {
        history.push({
          date: milestone.date,
          change: milestone.title,
          details: milestone.description,
          branch: milestone.branch || employee.professionalDetails.branch,
          impact: milestone.impact,
          type: 'milestone'
        });
      });
    }

    // Add document uploads
    if (employee.documents) {
      employee.documents.forEach(doc => {
        history.push({
          date: doc.uploadedAt,
          change: 'Document Upload',
          details: `New document uploaded: ${doc.name}`,
          type: 'document'
        });
      });
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to server.js - Notification Routes
app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notification = new Notification({
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(20);

    console.log('Found notifications:', notifications); // Debug log
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Failed to update notification',
      details: error.message 
    });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});