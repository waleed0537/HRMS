// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('../Backend/models/Users');
const Employee = require('../Backend/models/employee');
const multer = require('multer');
const bcrypt = require('bcryptjs'); // Add this import
const path = require('path');
const fs = require('fs');
const Leave = require('../Backend/models/Leave');
const Branch = require('../Backend/models/branch');
const Announcement = require('../Backend/models/Announcement'); // Make sure to import the model
const Notification =  require('../Backend/models/Notification');
const Holiday = require('../Backend/models/Holiday');
const Applicant = require('../Backend/models/Applicant');
const Attendance = require('../Backend/models/Attendance');
const FormField = require('../Backend/models/FormField');


const app = express();
const JWT_SECRET = 'your-jwt-secret-key';
// Create the uploads/resumes directory if it doesn't exist
if (!fs.existsSync('./uploads/resumes')) {
  fs.mkdirSync('./uploads/resumes', { recursive: true });
}

// Configure multer for resume uploads
const resumeStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/resumes/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: function(req, file, cb) {
    // Accept only pdf and doc/docx files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});
app.get('/', (req, res) => {
  res.json({ message: 'HRMS API is running' });
});

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

    // Allow access for admin and HR manager
    if (user.isAdmin || user.role === 'hr_manager') {
      req.userRole = user.role;
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
  } catch (error) {
    console.error('Permission check error:', error);
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
  origin: ['https://hrms-sxi4.onrender.com', 'http://localhost:5173', 'https://www.hrrive.com', 'https://hrrive.com'],
  credentials: true
}));

app.use(express.json());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
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
// Attendance Routes
// In server.js, update the attendance endpoint

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    console.log('Received date parameter:', date);
    
    let query = {};
    
    if (date) {
      // Convert the date to start and end of day in UTC
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      console.log('Query date range:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });
      
      query.date = { 
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    // First, get total count
    const totalCount = await Attendance.countDocuments(query);
    console.log('Total matching records:', totalCount);

    // Then get the actual records
    const attendanceRecords = await Attendance.find(query)
      .sort({ timeIn: 1 })
      .lean();
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    console.log('Sample record:', attendanceRecords[0]);

    // Send detailed response
    res.json({
      success: true,
      count: attendanceRecords.length,
      totalRecords: totalCount,
      date: date || 'all',
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance records',
      error: error.message 
    });
  }
});

// Add to server.js

// Get all holidays
app.get('/api/holidays', authenticateToken, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ holidayDate: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new holiday
app.post('/api/holidays', authenticateToken, checkPermission, async (req, res) => {
  try {
    const { holidayName, holidayDate } = req.body;
    
    // Convert date string to Date object
    const date = new Date(holidayDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const holidayDay = days[date.getDay()];

    const holiday = new Holiday({
      holidayName,
      holidayDate: date,
      holidayDay
    });

    const newHoliday = await holiday.save();
    res.status(201).json(newHoliday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete holiday
app.delete('/api/holidays/:id', authenticateToken, checkPermission, async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    await holiday.remove();
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and Word documents are allowed!'));
  }
});

// Create directory for resume uploads if it doesn't exist
if (!fs.existsSync('./uploads/resumes')) {
  fs.mkdirSync('./uploads/resumes', { recursive: true });
}

// Server route handler for applicant submission
// In server.js, update the /api/applicants POST route

// In server.js, update the applicant submission route

// In server.js
// In server.js, update the applicant submission endpoint

app.post('/api/applicants', resumeUpload.single('resume'), async (req, res) => {
  try {
    console.log('Starting application submission');
    const personalDetails = JSON.parse(req.body.personalDetails);
    const jobDetails = JSON.parse(req.body.jobDetails);
    const branchName = jobDetails.branchName || jobDetails.branch;

    console.log('Application details:', {
      name: personalDetails.name,
      position: jobDetails.position,
      branchName: branchName
    });

    // Find branch with case-insensitive match
    const branch = await Branch.findOne({
      name: { $regex: new RegExp('^' + branchName + '$', 'i') }
    });

    if (!branch) {
      console.log('Branch not found:', branchName);
      throw new Error('Invalid branch specified');
    }

    console.log('Found branch:', branch);

    // Save applicant
    const applicantData = {
      personalDetails: new Map(Object.entries(personalDetails)),
      jobDetails: new Map(Object.entries(jobDetails)),
      branchName: branch.name, // Use canonical branch name from database
      status: 'pending'
    };

    if (req.file) {
      applicantData.resume = {
        filename: req.file.originalname,
        path: req.file.path,
        uploadedAt: new Date()
      };
    }

    const applicant = new Applicant(applicantData);
    await applicant.save();

    // Create notifications
    const notificationPromises = [];

    // Find admins
    const admins = await User.find({ isAdmin: true });
    console.log(`Found ${admins.length} admin users`);

    // Notify admins
    admins.forEach(admin => {
      notificationPromises.push(
        new Notification({
          userId: admin._id,
          title: 'New Job Application',
          message: `New application received from ${personalDetails.name} for ${jobDetails.position} position in ${branch.name} branch`,
          type: 'application',
          metadata: {
            branchId: branch._id,
            branchName: branch.name
          }
        }).save()
      );
    });

    // Find HR manager for the branch
    if (branch.hrManager) {
      console.log('Branch HR Manager ID:', branch.hrManager);
      
      const hrUser = await User.findOne({
        $or: [
          { _id: branch.hrManager },
          { role: 'hr_manager', branchName: branch.name }
        ]
      });

      if (hrUser) {
        console.log('Creating notification for HR manager:', hrUser.email);
        notificationPromises.push(
          new Notification({
            userId: hrUser._id,
            title: 'New Job Application',
            message: `New application received from ${personalDetails.name} for ${jobDetails.position} position`,
            type: 'application',
            metadata: {
              branchId: branch._id,
              branchName: branch.name
            }
          }).save()
        );
      }
    }

    // Save all notifications
    const notifications = await Promise.all(notificationPromises);
    console.log(`Created ${notifications.length} notifications`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      notifications: notifications.length
    });

  } catch (error) {
    console.error('Error in application submission:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit application'
    });
  }
});


// Add a route to get applicant data for admin/HR
// Get all applications (Admin only)
app.get('/api/applicants', authenticateToken, async (req, res) => {
  console.log('GET /api/applicants endpoint hit');
  console.log('Auth header:', req.headers.authorization);
  
  try {
      const { status, position, branch } = req.query;
      const query = {};

      if (status) query.status = status;
      if (position) query['jobDetails.position'] = position;
      if (branch) query['jobDetails.branch'] = branch;

      console.log('Query:', query);

      const applicants = await Applicant.find(query).sort({ createdAt: -1 });
      console.log(`Found ${applicants.length} applicants`);

      // Transform data for frontend display
      const transformedApplicants = applicants.map(applicant => {
          try {
              const personalDetails = Object.fromEntries(applicant.personalDetails || new Map());
              const jobDetails = Object.fromEntries(applicant.jobDetails || new Map());

              return {
                  _id: applicant._id,
                  personalDetails: {
                      name: personalDetails.name || 'Not provided',
                      email: personalDetails.email || 'Not provided',
                      phone: personalDetails.phone || 'Not provided',
                      gender: personalDetails.gender || 'Not provided',
                      ...personalDetails
                  },
                  jobDetails: {
                      position: jobDetails.position || 'Not provided',
                      branch: jobDetails.branch || 'Not provided',
                      ...jobDetails
                  },
                  status: applicant.status,
                  resume: applicant.resume,
                  createdAt: applicant.createdAt
              };
          } catch (err) {
              console.error('Error transforming applicant:', err, applicant);
              // Return a safe fallback for this applicant
              return {
                  _id: applicant._id,
                  personalDetails: {
                      name: 'Error processing details',
                      email: 'Not available',
                      phone: 'Not available',
                      gender: 'Not available'
                  },
                  jobDetails: {
                      position: 'Not available',
                      branch: 'Not available'
                  },
                  status: applicant.status || 'pending',
                  createdAt: applicant.createdAt
              };
          }
      });

      res.json(transformedApplicants);
  } catch (error) {
      console.error('Error in /api/applicants:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching applications',
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});

app.get('/api/applicants', authenticateToken, checkPermission, async (req, res) => {
  try {
    console.log('Fetching applicants...');
    
    // Get query parameters
    const { status, position, branch } = req.query;
    const query = {};

    // Build query based on filters
    if (status) query.status = status;
    if (position) query['jobDetails.get("position")'] = position;
    if (branch) query['jobDetails.get("branch")'] = branch;

    // Fetch applicants from database
    const applicants = await Applicant.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${applicants.length} applicants`);

    // Transform the data for response
    const transformedApplicants = applicants.map(applicant => {
      // Convert Maps to regular objects
      const personalDetails = applicant.personalDetails instanceof Map ? 
        Object.fromEntries(applicant.personalDetails) : 
        (applicant.personalDetails || {});

      const jobDetails = applicant.jobDetails instanceof Map ? 
        Object.fromEntries(applicant.jobDetails) : 
        (applicant.jobDetails || {});

      return {
        _id: applicant._id,
        personalDetails: {
          name: personalDetails.name || personalDetails['First Name'] || 'Not provided',
          email: personalDetails.email || personalDetails.Email || 'Not provided',
          phone: personalDetails.phone || personalDetails.Phone || 'Not provided',
          gender: personalDetails.gender || personalDetails.Gender || 'Not provided',
          ...personalDetails
        },
        jobDetails: {
          position: jobDetails.position || jobDetails.Position || 'Not provided',
          branch: jobDetails.branch || jobDetails.Branch || 'Not provided',
          ...jobDetails
        },
        status: applicant.status || 'pending',
        resume: applicant.resume,
        createdAt: applicant.createdAt
      };
    });

    res.json(transformedApplicants);
  } catch (error) {
    console.error('Error in /api/applicants:', error);
    res.status(500).json({
      message: 'Error fetching applications',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});



// Update application status
app.put('/api/applicants/:id/status', authenticateToken, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const applicant = await Applicant.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    res.json(applicant);
  } catch (error) {
    console.error('Error updating applicant status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get application details (Admin only)
app.get('/api/applicants/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }
    res.json(applicant);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching applicant details',
      error: error.message
    });
  }
});

// Download resume
app.get('/api/applicants/:id/resume', authenticateToken, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findById(id);

    if (!applicant || !applicant.resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if file exists
    if (!fs.existsSync(applicant.resume.path)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    res.download(applicant.resume.path, applicant.resume.filename);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin routes for managing form fields (protected)
app.get('/api/admin/form-fields', authenticateToken, isAdmin, async (req, res) => {
  try {
    const fields = await FormField.find().sort({ order: 1 });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/api/admin/form-fields', authenticateToken, isAdmin, async (req, res) => {
  try {
    const field = new FormField(req.body);
    const newField = await field.save();
    res.status(201).json(newField);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.put('/api/admin/form-fields/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const updatedField = await FormField.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedField) {
      return res.status(404).json({ message: 'Field not found' });
    }
    res.json(updatedField);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/admin/form-fields/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const field = await FormField.findByIdAndDelete(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }
    res.json({ message: 'Field deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/form-fields/reorder', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { fields } = req.body;
    await Promise.all(fields.map(field => 
      FormField.findByIdAndUpdate(field._id, { order: field.order })
    ));
    res.json({ message: 'Field order updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public route for getting form fields (unprotected)
app.get('/api/public/form-fields', async (req, res) => {
  try {
    const fields = await FormField.find()
      .sort({ order: 1 })
      .select('-__v'); // Exclude unnecessary fields
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load form fields. Please try again later.' });
  }
});
// Add these HR-specific routes to server.js

// Middleware to check if user is HR manager
// Add or update this middleware in your server.js
// Update or add this middleware in your server.js
const isHrManager = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    console.log('User found:', user ? 'yes' : 'no', 'Role:', user?.role);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is HR manager or admin
    if (user.role === 'hr_manager' || user.isAdmin) {
      // For HR managers, set their branch. For admin, they can see all
      if (user.role === 'hr_manager') {
        if (!user.branchName) {
          return res.status(400).json({ message: 'HR Manager branch not set' });
        }
        req.hrBranch = user.branchName;
        console.log('HR Manager Branch set to:', req.hrBranch);
      } else {
        req.isAdmin = true;
      }
      next();
    } else {
      res.status(403).json({ message: 'HR Manager access required' });
    }
  } catch (error) {
    console.error('Error in HR manager middleware:', error);
    res.status(500).json({ message: 'Error checking HR access' });
  }
};

// Get branch employees for HR
app.get('/api/hr/employees', authenticateToken, isHrManager, async (req, res) => {
  try {
    const employees = await Employee.aggregate([
      {
        $match: {
          'professionalDetails.branch': req.hrBranch
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          'user.status': 'approved'
        }
      }
    ]);

    res.json(employees);
  } catch (error) {
    console.error('Error fetching branch employees:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get branch leave requests for HR
app.get('/api/hr/leaves', authenticateToken, isHrManager, async (req, res) => {
  try {
    // First get all employees from the HR's branch
    const branchEmployees = await Employee.find({
      'professionalDetails.branch': req.hrBranch
    }).select('userId personalDetails.email');

    const employeeEmails = branchEmployees.map(emp => emp.personalDetails.email);

    // Then get leave requests for those employees
    const leaves = await Leave.find({
      employeeEmail: { $in: employeeEmails }
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching branch leaves:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this to your server.js file
// Add this to your server.js file
// Remove any existing /api/hr/applicants routes and replace with this
app.get('/api/hr/applicants', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(user.role === 'hr_manager' || user.isAdmin)) {
      return res.status(403).json({ message: 'HR Manager access required' });
    }

    console.log('HR Manager Branch:', user.branchName);

    // Fetch all applicants
    const allApplicants = await Applicant.find();
    console.log(`Total applicants found: ${allApplicants.length}`);

    let applicantsToShow = allApplicants;

    // If HR manager (not admin), filter by branch
    if (user.role === 'hr_manager') {
      applicantsToShow = allApplicants.filter(applicant => {
        // Get branch name from various possible locations
        const branchName = applicant.branchName || 
          (applicant.jobDetails instanceof Map ? 
            applicant.jobDetails.get('branchName') || 
            applicant.jobDetails.get('branch') : 
            applicant.jobDetails?.branchName || 
            applicant.jobDetails?.branch);

        return branchName && branchName.toLowerCase() === user.branchName.toLowerCase();
      });
    }

    // Transform the data to match admin view
    const transformedApplicants = applicantsToShow.map(applicant => {
      // Get personal details
      let personalDetails = {};
      if (applicant.personalDetails instanceof Map) {
        personalDetails = Object.fromEntries(applicant.personalDetails);
      } else if (typeof applicant.personalDetails === 'object') {
        personalDetails = applicant.personalDetails;
      }

      // Get job details
      let jobDetails = {};
      if (applicant.jobDetails instanceof Map) {
        jobDetails = Object.fromEntries(applicant.jobDetails);
      } else if (typeof applicant.jobDetails === 'object') {
        jobDetails = applicant.jobDetails;
      }

      // Log raw data for debugging
      console.log('Raw applicant data:', {
        personalDetails: applicant.personalDetails instanceof Map ? 
          Object.fromEntries(applicant.personalDetails) : 
          applicant.personalDetails,
        jobDetails: applicant.jobDetails instanceof Map ? 
          Object.fromEntries(applicant.jobDetails) : 
          applicant.jobDetails
      });

      return {
        _id: applicant._id,
        personalDetails: {
          name: personalDetails.name || personalDetails.fullname || 'Not provided',
          email: personalDetails.email || 'Not provided',
          phone: personalDetails.phone || 'Not provided',
          gender: personalDetails.gender || 'Not provided',
          ...personalDetails
        },
        jobDetails: {
          position: jobDetails.position || 'Not specified',
          branchName: applicant.branchName || 
                     jobDetails.branchName || 
                     jobDetails.branch || 
                     'Not specified',
          ...jobDetails
        },
        status: applicant.status || 'pending',
        resume: applicant.resume || null,
        createdAt: applicant.createdAt
      };
    });

    // Log first transformed applicant for debugging
    if (transformedApplicants.length > 0) {
      console.log('First transformed applicant:', JSON.stringify(transformedApplicants[0], null, 2));
    }

    res.json(transformedApplicants);

  } catch (error) {
    console.error('Error in HR applicants endpoint:', error);
    res.status(500).json({
      message: 'Error fetching applicants',
      error: error.message
    });
  }
});
// Add to server.js

// Get branch employees for HR editing
app.get('/api/hr/edit-profiles', authenticateToken, isHrManager, async (req, res) => {
  try {
    // Find all employees from HR's branch
    const branchEmployees = await Employee.find({
      'professionalDetails.branch': req.hrBranch
    }).populate('userId');

    const employees = branchEmployees.map(employee => ({
      ...employee.toObject(),
      userDetails: employee.userId ? {
        email: employee.userId.email,
        role: employee.userId.role,
        status: employee.userId.status
      } : null
    }));

    res.json(employees);
  } catch (error) {
    console.error('Error fetching branch employees for editing:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update employee profile for HR
app.put('/api/hr/edit-profiles/:id', authenticateToken, isHrManager, upload.array('documents', 5), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify employee belongs to HR's branch
    if (employee.professionalDetails.branch !== req.hrBranch) {
      return res.status(403).json({ message: 'Access denied. Employee not in your branch.' });
    }

    const updateData = JSON.parse(req.body.employeeData);
    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path,
      uploadedAt: new Date()
    })) : [];

    // Update user role if changed
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, {
        role: updateData.professionalDetails.role
      });
    }

    // Prepare updates object
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
    console.error('Error updating employee profile:', error);
    res.status(500).json({ message: error.message });
  }
});
// New endpoint for HR notifications
// In server.js, update the HR notifications endpoint

app.get('/api/hr/notifications', authenticateToken, isHrManager, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log('Fetching notifications for HR user:', {
      userId: user._id,
      branchName: user.branchName,
      role: user.role
    });

    // Case-insensitive branch name matching
    const branch = await Branch.findOne({
      name: { $regex: new RegExp('^' + user.branchName + '$', 'i') }
    });

    console.log('Found branch:', branch);

    let notifications;
    if (user.isAdmin) {
      // Admins see all notifications
      notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(20);
    } else {
      // HR managers see:
      // 1. Their own notifications
      // 2. Applications for their branch
      notifications = await Notification.find({
        $or: [
          { userId: user._id },
          {
            type: 'application',
            'metadata.branchName': { $regex: new RegExp('^' + user.branchName + '$', 'i') }
          }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20);
    }

    console.log(`Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('Error in HR notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});