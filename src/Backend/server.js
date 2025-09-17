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
const Notification = require('../Backend/models/Notification');
const Holiday = require('../Backend/models/Holiday');
const Applicant = require('../Backend/models/Applicant');
const Attendance = require('../Backend/models/Attendance');
const FormField = require('../Backend/models/FormField');
const nodemailer = require('nodemailer');
const zktecoService = require('./zktecoService');
const csv = require('csv-parser');
const cron = require('node-cron');


const app = express();
const JWT_SECRET = 'your-jwt-secret-key';
// Create the uploads/resumes directory if it doesn't exist
if (!fs.existsSync('./uploads/resumes')) {
  fs.mkdirSync('./uploads/resumes', { recursive: true });
}


const csvStorage = multer.memoryStorage(); 

// Check if directory exists, if not create it
if (!fs.existsSync('./uploads/attendance-csv')) {
  fs.mkdirSync('./uploads/attendance-csv', { recursive: true });
}
async function removeEmailUniqueConstraint() {
  try {
    console.log('Checking for unique index on applicant email...');

    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState !== 1) {
      console.log('Mongoose not connected yet, will check indexes after connection');
      return;
    }

    const collections = await mongoose.connection.db.listCollections().toArray();

    if (collections.some(col => col.name === 'applicants')) {
      console.log('Applicants collection exists, checking indexes...');
      const indexes = await mongoose.connection.db.collection('applicants').indexes();
      console.log('Current indexes:', indexes);

      const emailUniqueIndex = indexes.find(idx =>
        idx.key &&
        (idx.key['personalDetails.email'] === 1 || idx.unique === true)
      );

      if (emailUniqueIndex) {
        console.log('Found potentially problematic index:', emailUniqueIndex);
        console.log('Dropping index:', emailUniqueIndex.name);

        try {
          await mongoose.connection.db.collection('applicants').dropIndex(emailUniqueIndex.name);
          console.log('Successfully dropped index on applicants collection');
        } catch (dropError) {
          console.error('Error dropping index:', dropError);
        }
      } else {
        console.log('No problematic index found on applicants collection');
      }
    } else {
      console.log('Applicants collection does not exist yet');
    }
  } catch (error) {
    console.error('Error checking/removing email index:', error);
  }
}
const validateLeaveDocs = (req, res, next) => {
  const maxSize = 16 * 1024 * 1024; // 16MB MongoDB document limit
  
  if (req.files) {
    for (let file of req.files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} is too large. Maximum size is 16MB.`
        });
      }
    }
  }
  
  next();
};

const csvUpload = multer({
  storage: csvStorage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for CSV files
  }
});
const resumeStorage = multer.memoryStorage();
// Configure multer for resume uploads
const documentStorage = multer.memoryStorage(); // Changed from diskStorage

const upload = multer({
  storage: documentStorage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'hrmsmongo@gmail.com',
    pass: 'abtf fgsv muyt odxz'  // The actual password, not "hrms"
  },
  tls: {
    rejectUnauthorized: false
  }
});
const sendEmail = async (to, subject, content) => {
  try {
    const mailOptions = {
      from: 'hrmsmongo@gmail.com',
      to: to,
      subject: subject,
      html: content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    console.log('Email messageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email to', to, ':', error);
    return false;
  }
};

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: function (req, file, cb) {
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
    fileSize: 10 * 1024 * 1024 // Increased to 10MB max file size for database storage
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
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


const checkPermission = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access for admin, HR manager, and T1 member
    if (user.isAdmin || user.role === 'hr_manager' || user.role === 't1_member') {
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
// app.use(cors({
//   origin: ['https://hrms-sxi4.onrender.com', 'http://localhost:5173', 'https://www.hrrive.com', 'https://hrrive.com', 'https://hrms-backend-flfy.onrender.com', 'https://hrms-seab.onrender.com', 'https://hrms-uqy9.onrender.com', 'https://hrms-backend-qoir.onrender.com'],
//   credentials: true
// }));

// server.js - Fix for current setup
app.use(cors({
  origin: [
    'https://hrrive.com',           // Your main domain with SSL
    'https://www.hrrive.com',       // With www and SSL
    'https://api.hrrive.com',       // API domain with SSL
    'http://hrrive.com',            // HTTP fallback
    'http://www.hrrive.com',        // HTTP www fallback
    'http://157.180.123.32',        // IP access
    'http://localhost:5173',        // Local development
    'http://localhost:3000'         // Alternative local
  ],
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
  .then(() => {
    console.log('Connected to MongoDB');
    return removeEmailUniqueConstraint();
  })
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
const checkFormFieldsAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && (user.isAdmin || user.role === 'hr_manager')) {
      next();
    } else {
      res.status(403).json({ message: 'Admin or HR Manager access required' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking permissions' });
  }
};
createAdminUser();

// Routes
// Sign Up
// Find this part in your server.js file and replace it with this corrected version:

app.post('/api/signup', async (req, res) => {
  try {
    const { personalDetails, professionalDetails, password } = req.body;

    console.log('Received signup request with data:', {
      personalDetails: { ...personalDetails, password: '******' },
      professionalDetails
    });

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
      password: hashedPassword,
      role: professionalDetails.role,
      branchName: professionalDetails.branch,
      status: 'pending',
      profilePic: Math.floor(Math.random() * 11) + 1
    });

    // Generate unique employee ID for system use
    const generateEmployeeId = () => {
      return `EMP${Date.now()}`;
    };

    // Create corresponding employee record WITH user-entered ID preserved
    const employee = await Employee.create({
      personalDetails: {
        name: personalDetails.name,
        id: personalDetails.id || generateEmployeeId(),
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
      userId: user._id
    });

    // Create notifications for admins and HR managers
    try {
      // Find all admin users
      const adminUsers = await User.find({
        isAdmin: true,
        status: 'approved'
      });

      // Find HR managers for this specific branch
      const hrManagers = await User.find({
        role: 'hr_manager',
        branchName: professionalDetails.branch,
        status: 'approved'
      });

      // Create notifications for admins
      const adminNotifications = adminUsers.map(admin => ({
        userId: admin._id,
        title: 'New Staff Request',
        message: `${personalDetails.name} has requested to join as ${professionalDetails.role} in ${professionalDetails.branch} branch`,
        type: 'account',
        metadata: {
          branchName: professionalDetails.branch,
          branchId: null, // This could be populated if branch ID is available
          requestType: 'staff_request'
        }
      }));

      // Create notifications for HR managers of this branch
      const hrNotifications = hrManagers.map(hr => ({
        userId: hr._id,
        title: 'New Staff Request',
        message: `${personalDetails.name} has requested to join your branch as ${professionalDetails.role}`,
        type: 'account',
        metadata: {
          branchName: professionalDetails.branch,
          branchId: null,
          requestType: 'staff_request'
        }
      }));

      // Combine and save all notifications
      const allNotifications = [...adminNotifications, ...hrNotifications];
      if (allNotifications.length > 0) {
        await Notification.insertMany(allNotifications);
        console.log(`Created ${allNotifications.length} notifications for new staff request`);
      }
    } catch (notifError) {
      // Log but don't fail the signup process
      console.error('Error creating notifications for new staff request:', notifError);
    }

    console.log('User and employee created successfully:', {
      userId: user._id,
      employeeId: employee._id,
      systemGeneratedId: employee.personalDetails.id
    });

    res.status(201).json({
      message: 'Signup request submitted for approval',
      userId: user._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Error creating user account',
      error: error.toString()
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
        profilePic: user.profilePic || Math.floor(Math.random() * 10) + 1
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
const isAdminOrT1 = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && (user.isAdmin || user.role === 't1_member')) {
      next();
    } else {
      res.status(403).json({ message: 'Admin or T1 Member access required' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking permissions' });
  }
};

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
// Improved version of the history tracking on the server side
// Add or update this code in your server.js file

// Update this in your server.js file
// Add this to your server.js file
const validateFileSizeForDB = (req, res, next) => {
  const maxSize = 16 * 1024 * 1024; // 16MB MongoDB document limit
  
  if (req.file && req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File ${req.file.originalname} is too large. Maximum size is 16MB.`
    });
  }
  
  if (req.files) {
    for (let file of req.files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} is too large. Maximum size is 16MB.`
        });
      }
    }
  }
  
  next();
};
app.put('/api/employees/:id',validateFileSizeForDB,  authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const updateData = JSON.parse(req.body.employeeData);
    console.log('Employee update received:', {
      id: req.params.id,
      hasMilestones: !!updateData.milestones,
      milestoneCount: updateData.milestones ? updateData.milestones.length : 0,
      hasFiles: !!req.files,
      fileCount: req.files ? req.files.length : 0
    });

    // Find employee
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Store original values for change detection
    const originalRole = employee.professionalDetails?.role;
    const originalBranch = employee.professionalDetails?.branch;
    const originalStatus = employee.professionalDetails?.status;

    // First update User collection if userId exists
    if (employee.userId) {
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
        console.warn('Failed to update user data');
      }
    }

    // Prepare update for Employee collection
    const updates = {
      personalDetails: {
        // Preserve the employee ID and only update the other fields
        ...employee.personalDetails,
        name: updateData.personalDetails?.name,
        contact: updateData.personalDetails?.contact,
        email: updateData.personalDetails?.email,
        address: updateData.personalDetails?.address
      },
      professionalDetails: updateData.professionalDetails,
      updatedAt: new Date()
    };

    // Handle uploaded documents - store in database instead of file system
    const processedDocuments = [];
    if (req.files && req.files.length > 0) {
      console.log('Processing uploaded documents:', req.files.length);
      
      for (const file of req.files) {
        // Validate file size (MongoDB document limit is 16MB)
        if (file.size > 16 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} is too large. Maximum size is 16MB.`
          });
        }

        const documentData = {
          name: file.originalname,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: file.buffer, // Store file data in database
          uploadedAt: new Date()
        };

        processedDocuments.push(documentData);
        console.log(`Processed document: ${file.originalname}, size: ${file.size} bytes`);
      }
    }

    // Initialize milestones if needed
    if (!updateData.milestones) {
      updateData.milestones = [];
    }

    // Add milestones for document uploads
    if (processedDocuments.length > 0) {
      processedDocuments.forEach(doc => {
        updateData.milestones.push({
          title: 'Document Uploaded',
          description: `New document uploaded: ${doc.name}`,
          date: new Date().toISOString().split('T')[0],
          branch: updateData.professionalDetails.branch,
          type: 'document_upload'
        });
      });
    }

    // Check for existing milestone types to avoid duplicates
    const existingMilestoneTypes = new Set();
    if (employee.milestones && Array.isArray(employee.milestones)) {
      for (const milestone of employee.milestones) {
        if (milestone.type) {
          existingMilestoneTypes.add(milestone.type);
        }
      }
    }

    // Add role change milestone if needed
    if (!existingMilestoneTypes.has('role_change') && originalRole !== updateData.professionalDetails.role) {
      updateData.milestones.push({
        title: `Role changed to ${formatRole(updateData.professionalDetails.role)}`,
        description: `Role updated from ${formatRole(originalRole || 'None')} to ${formatRole(updateData.professionalDetails.role)}`,
        date: new Date().toISOString().split('T')[0],
        branch: updateData.professionalDetails.branch,
        impact: 'Employee role has been updated with new responsibilities and permissions',
        type: 'role_change'
      });
    }

    // Add branch transfer milestone if needed
    if (!existingMilestoneTypes.has('branch_transfer') && originalBranch !== updateData.professionalDetails.branch) {
      updateData.milestones.push({
        title: `Transferred to ${updateData.professionalDetails.branch} branch`,
        description: `Branch transfer from ${originalBranch || 'None'} to ${updateData.professionalDetails.branch}`,
        date: new Date().toISOString().split('T')[0],
        branch: updateData.professionalDetails.branch,
        impact: 'Employee moved to a new branch location',
        type: 'branch_transfer'
      });
    }

    // Add status change milestone if needed
    if (!existingMilestoneTypes.has('status_change') && originalStatus !== updateData.professionalDetails.status) {
      const statusText = updateData.professionalDetails.status.replace('_', ' ');
      updateData.milestones.push({
        title: `Status changed to ${statusText}`,
        description: `Employee status updated from ${(originalStatus || 'active').replace('_', ' ')} to ${statusText}`,
        date: new Date().toISOString().split('T')[0],
        branch: updateData.professionalDetails.branch,
        impact: `Employee is now ${statusText}`,
        type: 'status_change'
      });
    }

    // Apply push operations for documents and milestones
    const pushOperations = {};

    if (processedDocuments.length > 0) {
      pushOperations.documents = { $each: processedDocuments };
    }

    if (updateData.milestones && updateData.milestones.length > 0) {
      const processedMilestones = updateData.milestones.map(milestone => ({
        ...milestone,
        date: milestone.date || new Date().toISOString().split('T')[0],
        type: milestone.type || 'milestone'
      }));

      pushOperations.milestones = { $each: processedMilestones };
    }

    if (Object.keys(pushOperations).length > 0) {
      updates.$push = pushOperations;
    }

    console.log('Applying updates with operations:', {
      basicUpdates: Object.keys(updates).filter(k => k !== '$push'),
      pushOperations: updates.$push ? Object.keys(updates.$push) : 'none',
      documentsCount: pushOperations.documents?.$each.length || 0,
      milestoneCount: pushOperations.milestones?.$each.length || 0
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    // Create notification for employee
    const updatingUser = await User.findById(req.user.id);
    const updaterName = updatingUser ?
      (updatingUser.name || updatingUser.email.split('@')[0]) :
      'An administrator';

    if (employee.userId) {
      let updatedItems = [];

      if (updateData.personalDetails) updatedItems.push('personal details');
      if (updateData.professionalDetails) updatedItems.push('professional details');

      if (updateData.professionalDetails &&
        employee.professionalDetails?.role !== updateData.professionalDetails.role) {
        updatedItems.push(`role changed to ${formatRole(updateData.professionalDetails.role)}`);
      }

      if (updateData.professionalDetails &&
        employee.professionalDetails?.branch !== updateData.professionalDetails.branch) {
        updatedItems.push(`branch changed to ${updateData.professionalDetails.branch}`);
      }

      if (processedDocuments.length > 0) {
        updatedItems.push(`${processedDocuments.length} document(s) added`);
      }

      if (updateData.milestones && updateData.milestones.length > 0) {
        updatedItems.push(`${updateData.milestones.length} milestone(s) added`);
      }

      let notificationMessage = `${updaterName} updated your profile`;
      if (updatedItems.length > 0) {
        notificationMessage += `: ${updatedItems.join(', ')}`;
      }

      try {
        const notification = new Notification({
          userId: employee.userId,
          title: 'Profile Updated',
          message: notificationMessage,
          type: 'account',
          metadata: {
            updatedBy: req.user.id,
            updateTime: new Date()
          }
        });

        await notification.save();
        console.log(`Notification created for user ${employee.userId}`);
      } catch (notifError) {
        console.error('Error creating profile update notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
      documentsAdded: processedDocuments.length,
      milestonesAdded: pushOperations.milestones?.$each.length || 0
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Helper function to format role names
function formatRole(role) {
  if (!role) return 'Unknown';
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format role names
function formatRoleName(role) {
  if (!role) return 'Unknown';
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Enhanced history endpoint with more detailed information
// Update this in your server.js file
// Add this to your server.js file
app.get('/api/employees/:id/history', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log(`Fetching history for employee: ${employee.personalDetails?.name || 'Unknown'}`);

    const history = [];

    // Add milestones with improved type handling
    if (employee.milestones && Array.isArray(employee.milestones)) {
      console.log(`Processing ${employee.milestones.length} milestones for history`);

      employee.milestones.forEach(milestone => {
        // Default type is 'milestone' if not specified
        let type = milestone.type || 'milestone';

        // Create history item
        const historyItem = {
          date: milestone.date || new Date(),
          change: milestone.title,
          details: milestone.description,
          branch: milestone.branch || employee.professionalDetails.branch,
          impact: milestone.impact,
          type: type
        };

        history.push(historyItem);
      });
    } else {
      console.log('No milestones found for employee');
    }

    // Add document uploads if not already covered by milestones
    if (employee.documents && Array.isArray(employee.documents)) {
      console.log(`Processing ${employee.documents.length} documents for history`);

      // Check if we already have document upload milestones
      const existingDocUploads = new Set();
      history.forEach(item => {
        if (item.type === 'document_upload' && item.details) {
          const docName = item.details.replace('New document uploaded: ', '');
          existingDocUploads.add(docName);
        }
      });

      // Add missing document uploads
      employee.documents.forEach(doc => {
        // Skip if this document is already in a milestone
        if (doc.name && existingDocUploads.has(doc.name)) {
          return;
        }

        history.push({
          date: doc.uploadedAt || new Date(),
          change: 'Document Upload',
          details: `New document uploaded: ${doc.name}`,
          type: 'document_upload'
        });
      });
    }

    // Deduplicate history entries by signature
    const uniqueHistory = [];
    const historySignatures = new Set();

    for (const item of history) {
      // Create a unique signature for each history item based on type, title and date
      // Convert date to string format for consistency
      const dateStr = typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0];
      const signature = `${item.type}-${item.change}-${dateStr}`;

      // Only add the item if we haven't seen this signature before
      if (!historySignatures.has(signature)) {
        historySignatures.add(signature);
        uniqueHistory.push(item);
      } else {
        console.log(`Filtered duplicate history item: ${signature}`);
      }
    }

    // Sort by date descending (newest first)
    uniqueHistory.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    console.log(`Returning ${uniqueHistory.length} unique history items out of ${history.length} total`);

    res.json(uniqueHistory);
  } catch (error) {
    console.error('Error fetching employee history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
app.get('/api/employees/:id/documents', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('documents.name documents.originalName documents.mimetype documents.size documents.uploadedAt documents._id');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Return document metadata without the actual file data
    const documentsList = employee.documents.map(doc => ({
      _id: doc._id,
      name: doc.name,
      originalName: doc.originalName,
      mimetype: doc.mimetype,
      size: doc.size,
      uploadedAt: doc.uploadedAt,
      hasData: true // We know it exists if it's in the array
    }));

    res.json(documentsList);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/employees/:id/documents/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    console.log(`Downloading document ${documentId} for employee ${id}`);
    
    // Find employee with specific document
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find the specific document
    const document = employee.documents.id(documentId);
    
    if (!document || !document.data) {
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('Serving document from database:', {
      filename: document.originalName || document.name,
      mimetype: document.mimetype,
      size: document.size
    });

    // Set appropriate headers for file download
    res.set({
      'Content-Type': document.mimetype,
      'Content-Disposition': `attachment; filename="${document.originalName || document.name}"`,
      'Content-Length': document.size
    });

    // Send the file data directly from database
    res.send(document.data);
    
  } catch (error) {
    console.error('Error downloading employee document:', error);
    res.status(500).json({ 
      message: 'Error downloading document',
      error: error.message 
    });
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


// Delete employee document from database
app.delete('/api/employees/:id/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    console.log(`Deleting document ${documentId} for employee ${id}`);
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const document = employee.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const documentName = document.originalName || document.name;
    
    // Remove document from employee record (no file system cleanup needed)
    employee.documents.pull(documentId);
    await employee.save();

    console.log(`Document ${documentName} deleted from database`);

    res.json({ 
      message: 'Document deleted successfully',
      documentName: documentName
    });
  } catch (error) {
    console.error('Error deleting employee document:', error);
    res.status(500).json({ message: error.message });
  }
});
function formatRole(role) {
  if (!role) return 'Unknown';
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}



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
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has permission to view pending requests
    if (!(currentUser.isAdmin || currentUser.role === 'hr_manager')) {
      return res.status(403).json({ message: 'Admin or HR Manager access required' });
    }

    let query = { status: 'pending' };

    // For HR managers (who are not admins), filter by their branch
    if (currentUser.role === 'hr_manager' && !currentUser.isAdmin) {
      if (!currentUser.branchName) {
        return res.status(400).json({ message: 'HR Manager branch not configured' });
      }

      // Use case-insensitive regex match for branch filtering
      query.branchName = { $regex: new RegExp('^' + currentUser.branchName + '$', 'i') };

      console.log(`HR Manager ${currentUser.email} requesting pending requests for branch: ${currentUser.branchName}`);
    } else if (currentUser.isAdmin) {
      console.log(`Admin ${currentUser.email} requesting all pending requests`);
    }

    const pendingRequests = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`Found ${pendingRequests.length} pending requests for user ${currentUser.email} (${currentUser.role})`);

    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Approve/Reject Request (Admin Only)
// Approve/Reject Request (Admin or HR Manager)
app.put('/api/requests/:userId/status', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Check if user is admin or HR manager
    if (!(currentUser.isAdmin || currentUser.role === 'hr_manager')) {
      return res.status(403).json({ message: 'Admin or HR Manager access required' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // For HR managers who are not admins, check if the request belongs to their branch
    if (currentUser.role === 'hr_manager' && !currentUser.isAdmin) {
      // Get the request to be updated
      const requestToUpdate = await User.findById(req.params.userId);
      if (!requestToUpdate) {
        return res.status(404).json({ message: 'User request not found' });
      }

      // Check if the request's branch matches the HR manager's branch
      if (requestToUpdate.branchName.toLowerCase() !== currentUser.branchName.toLowerCase()) {
        return res.status(403).json({ message: 'You can only manage requests from your branch' });
      }
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

    // Create notification
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
app.post('/api/leaves', authenticateToken, validateLeaveDocs, upload.array('documents', 5), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get employee data to determine their branch
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const branchName = employee.professionalDetails.branch;

    // Create leave request object
    const leaveRequestData = {
      employeeId: req.user.id,
      employeeName: user.name || user.email,
      employeeEmail: user.email,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      leaveType: req.body.leaveType,
      reason: req.body.reason,
      documents: [] // Will be populated below
    };

    // Process uploaded documents - store in database
    if (req.files && req.files.length > 0) {
      console.log('Processing uploaded leave documents:', req.files.length);
      
      for (const file of req.files) {
        console.log(`Processing document: ${file.originalname}, size: ${file.size} bytes`);

        const documentData = {
          name: file.originalname,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: file.buffer, // Store file data in database
          uploadedAt: new Date()
        };

        leaveRequestData.documents.push(documentData);
      }
    }

    // Create and save leave request
    const leaveRequest = new Leave(leaveRequestData);
    await leaveRequest.save();

    console.log('Leave request saved with', leaveRequestData.documents.length, 'documents');

    // Create notifications for admins and HR managers (existing code)
    try {
      const adminUsers = await User.find({
        isAdmin: true,
        status: 'approved'
      });

      const hrManagers = await User.find({
        role: 'hr_manager',
        branchName: branchName,
        status: 'approved'
      });

      // Calculate leave duration for better notification
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const formattedStartDate = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Create notifications for admins
      const adminNotifications = adminUsers.map(admin => ({
        userId: admin._id,
        title: 'New Leave Request',
        message: `${user.name || user.email} has requested ${diffDays} ${diffDays === 1 ? 'day' : 'days'} of ${req.body.leaveType} leave from ${branchName} branch`,
        type: 'leave',
        metadata: {
          branchName: branchName,
          leaveType: req.body.leaveType,
          requestId: leaveRequest._id
        }
      }));

      // Create notifications for HR managers of this branch
      const hrNotifications = hrManagers.map(hr => ({
        userId: hr._id,
        title: 'New Leave Request',
        message: `${user.name || user.email} has requested ${diffDays} ${diffDays === 1 ? 'day' : 'days'} of ${req.body.leaveType} leave starting ${formattedStartDate}`,
        type: 'leave',
        metadata: {
          branchName: branchName,
          leaveType: req.body.leaveType,
          requestId: leaveRequest._id
        }
      }));

      // Combine and save all notifications
      const allNotifications = [...adminNotifications, ...hrNotifications];
      if (allNotifications.length > 0) {
        await Notification.insertMany(allNotifications);
        console.log(`Created ${allNotifications.length} notifications for new leave request`);
      }
    } catch (notifError) {
      console.error('Error creating notifications for leave request:', notifError);
    }

    // Return leave request without large file data
    const responseData = leaveRequest.toJSON(); // This will exclude file data automatically
    
    res.status(201).json({
      ...responseData,
      documentsUploaded: leaveRequestData.documents.length
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ 
      message: 'Error creating leave request',
      error: error.message 
    });
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
app.get('/api/leaves/:id/documents', authenticateToken, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has permission to view this request
    const user = await User.findById(req.user.id);
    const hasPermission = user.isAdmin || 
                         user.role === 'hr_manager' || 
                         leave.employeeId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return document metadata without the actual file data
    const documentsList = leave.getDocumentsList();
    res.json(documentsList);
  } catch (error) {
    console.error('Error fetching leave documents:', error);
    res.status(500).json({ message: error.message });
  }
});
// Updated route for handling leave status updates in server.js
app.get('/api/leaves/:id/documents/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    console.log(`Downloading leave document ${documentId} for leave ${id}`);
    
    // Find leave request
    const leave = await Leave.findById(id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has permission to download this document
    const user = await User.findById(req.user.id);
    const hasPermission = user.isAdmin || 
                         user.role === 'hr_manager' || 
                         user.role === 't1_member' ||
                         leave.employeeId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the specific document
    const document = leave.documents.id(documentId);
    
    if (!document || !document.data) {
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('Serving leave document from database:', {
      filename: document.originalName || document.name,
      mimetype: document.mimetype,
      size: document.size
    });

    // Set appropriate headers for file download
    res.set({
      'Content-Type': document.mimetype,
      'Content-Disposition': `attachment; filename="${document.originalName || document.name}"`,
      'Content-Length': document.size
    });

    // Send the file data directly from database
    res.send(document.data);
    
  } catch (error) {
    console.error('Error downloading leave document:', error);
    res.status(500).json({ 
      message: 'Error downloading document',
      error: error.message 
    });
  }
});

app.delete('/api/leaves/:id/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    console.log(`Deleting leave document ${documentId} for leave ${id}`);
    
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has permission (only the employee who created the leave or admin/HR)
    const user = await User.findById(req.user.id);
    const hasPermission = user.isAdmin || 
                         user.role === 'hr_manager' || 
                         leave.employeeId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const document = leave.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const documentName = document.originalName || document.name;
    
    // Remove document from leave record (no file system cleanup needed)
    leave.documents.pull(documentId);
    await leave.save();

    console.log(`Document ${documentName} deleted from database`);

    res.json({ 
      message: 'Document deleted successfully',
      documentName: documentName
    });
  } catch (error) {
    console.error('Error deleting leave document:', error);
    res.status(500).json({ message: error.message });
  }
});
app.post('/api/leaves/:id/documents', authenticateToken, validateLeaveDocs, upload.array('documents', 5), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if user has permission (only the employee who created the leave)
    if (leave.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Process uploaded documents
    const processedDocuments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const documentData = {
          name: file.originalname,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          data: file.buffer,
          uploadedAt: new Date()
        };

        leave.documents.push(documentData);
        processedDocuments.push({
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }

      await leave.save();
    }

    res.json({
      message: `${processedDocuments.length} document(s) added successfully`,
      documentsAdded: processedDocuments
    });
  } catch (error) {
    console.error('Error adding documents to leave:', error);
    res.status(500).json({ message: error.message });
  }
});
app.put('/api/leaves/:id/status', authenticateToken, checkPermission, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'hr_manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, email, employeeName, leaveType, startDate, endDate } = req.body;
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
    );

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

    // Send email notification
    if (email) {
      // Format dates for email
      const formattedStartDate = new Date(startDate || leaveRequest.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedEndDate = new Date(endDate || leaveRequest.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create email subject and content based on status
      const subject = `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;

      // Email template
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #474787;">Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          <p>Hello ${employeeName || 'Employee'},</p>
          
          <p>Your ${leaveType || leaveRequest.leaveType} leave request for the period <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong> has been <strong>${status}</strong>.</p>
          
          ${status === 'approved' ?
          `<p style="background-color: #d1fae5; padding: 15px; border-radius: 5px; color: #047857;">
              Your leave has been approved. Please ensure you've completed any handover procedures before your leave starts.
            </p>`
          :
          `<p style="background-color: #fee2e2; padding: 15px; border-radius: 5px; color: #b91c1c;">
              Your leave request has been declined. Please contact HR for more information if needed.
            </p>`
        }
          
          <p>If you have any questions, please contact the HR department.</p>
          
          <p>Thank you,<br>
          HR Management Team</p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This is an automated email notification. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(email, subject, emailContent);
        console.log(`Email notification sent to ${email} for leave status: ${status}`);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails, just log the error
      }
    }

    res.json({
      message: `Leave request ${status} successfully`,
      leaveRequest,
      emailSent: !!email
    });
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
    const { employeeEmail, management } = req.query;

    // Build query based on email and user role
    let query = {};

    if (employeeEmail) {
      // Case 1: Getting a specific employee's leaves
      query.employeeEmail = employeeEmail;
    } else if (management === 'true') {
      // Case 2: Management view - see all leaves EXCEPT their own
      // This is the new functionality we're adding
      query = { employeeEmail: { $ne: req.user.email } };
    } else if (!req.user.isAdmin) {
      // Case 3: Regular view - see only their own leaves
      query.employeeEmail = req.user.email;
    }

    // Admin with no query params sees all leaves

    const leaveRequests = await Leave.find(query)
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// app.get('/api/leaves/employee/:userId', authenticateToken, async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Check if user has permission to view these leaves
//     if (!req.user.isAdmin && req.user.id !== userId) {
//       return res.status(403).json({ message: 'Access denied' });
//     }

//     // Find leaves for this user
//     const employee = await Employee.findOne({ userId: userId });
//     if (!employee) {
//       return res.status(404).json({ message: 'Employee not found' });
//     }
//     const leaves = await Leave.find({ employeeId: employee._id })
//       .sort({ createdAt: -1 });

//     res.json(leaves);
//   } catch (error) {
//     console.error('Error fetching leaves:', error);
//     res.status(500).json({ 
//       message: 'Error fetching leaves', 
//       error: error.message 
//     });
//   }
// });
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
    const { title, content, branchId, department, targetType, priority, expiresAt } = req.body;

    console.log('Creating announcement with data:', {
      title,
      branchId,
      department,
      targetType,
      priority
    });

    if (!title || !content || !branchId || !expiresAt) {
      return res.status(400).json({
        message: 'Missing required fields: title, content, branchId, and expiresAt are required'
      });
    }

    // Validate that if targetType is department, department must be provided
    if (targetType === 'department' && !department) {
      return res.status(400).json({
        message: 'Department is required when target type is department'
      });
    }

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        message: 'Branch not found'
      });
    }

    // Create announcement with department info
    const announcement = new Announcement({
      title,
      content,
      branchId, 
      department: targetType === 'department' ? department : null, // Only set department if targeting department
      targetType: targetType || 'branch',
      createdBy: req.user.id,
      priority: priority || 'medium',
      expiresAt: new Date(expiresAt)
    });

    await announcement.save();
    console.log('Created announcement:', announcement);

    // Create notifications based on target type
    try {
      let targetUsers = [];
      let notificationMessage = '';

      if (targetType === 'department' && department) {
        // Find users in the specific department and branch
        const departmentEmployees = await Employee.find({
          'professionalDetails.branch': { $regex: new RegExp('^' + branch.name + '$', 'i') },
          'professionalDetails.department': department
        }).populate('userId');

        targetUsers = departmentEmployees
          .filter(emp => emp.userId && emp.userId.status === 'approved')
          .map(emp => emp.userId);

        notificationMessage = `New ${department} department announcement: ${title}`;

        console.log(`Found ${targetUsers.length} users in ${department} department of ${branch.name} branch`);
      } else {
        // Find all users in the branch (branch-wide announcement)
        const branchEmployees = await Employee.find({
          'professionalDetails.branch': { $regex: new RegExp('^' + branch.name + '$', 'i') }
        }).populate('userId');

        targetUsers = branchEmployees
          .filter(emp => emp.userId && emp.userId.status === 'approved')
          .map(emp => emp.userId);

        notificationMessage = `New branch announcement: ${title}`;

        console.log(`Found ${targetUsers.length} users in ${branch.name} branch`);
      }

      // Also notify admins and HR managers
      const adminUsers = await User.find({
        isAdmin: true,
        status: 'approved'
      });

      const hrManagers = await User.find({
        role: 'hr_manager',
        branchName: { $regex: new RegExp('^' + branch.name + '$', 'i') },
        status: 'approved'
      });

      // Combine all target users and remove duplicates
      const allTargetUsers = [...targetUsers, ...adminUsers, ...hrManagers];
      const uniqueUsers = allTargetUsers.filter((user, index, self) => 
        self.findIndex(u => u._id.toString() === user._id.toString()) === index
      );

      // Create notifications for all target users
      const notifications = uniqueUsers.map(user => ({
        userId: user._id,
        title: 'New Announcement',
        message: notificationMessage,
        type: 'announcement',
        metadata: {
          branchName: branch.name,
          branchId: branch._id,
          department: department || null,
          targetType: targetType || 'branch',
          announcementId: announcement._id
        }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Created ${notifications.length} notifications for announcement`);
      }

    } catch (notifError) {
      console.error('Error creating notifications for announcement:', notifError);
      // Continue even if notifications fail
    }

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
    const { department, targetType } = req.query;
    
    console.log('Fetching announcements for branch:', branchId, 'with filters:', {
      department,
      targetType
    });

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    console.log('Found branch:', branch.name);

    // Get current time for expiry check
    const now = new Date();
    console.log('Current time:', now);

    // Build query
    let query = {
      branchId: branchId,
      expiresAt: { $gt: now }
    };

    // Add department filter if specified
    if (targetType === 'department' && department) {
      query.department = department;
    } else if (targetType === 'branch') {
      query.department = { $exists: false };
    }
    
    console.log('Using query:', JSON.stringify(query));

    // Get announcements
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    console.log(`Found ${announcements.length} active announcements`);

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      message: 'Error fetching announcements',
      error: error.message
    });
  }
});

app.get('/api/announcements/user/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's employee record to find their branch and department
    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    const userBranch = employee.professionalDetails.branch;
    const userDepartment = employee.professionalDetails.department;

    console.log(`Fetching announcements for user in ${userBranch} branch, ${userDepartment} department`);

    // Find the branch document
    const branch = await Branch.findOne({ 
      name: { $regex: new RegExp('^' + userBranch + '$', 'i') } 
    });
    
    if (!branch) {
      return res.status(404).json({ message: 'User branch not found' });
    }

    const now = new Date();

    // Get announcements that target this user
    // 1. Branch-wide announcements (no department specified)
    // 2. Department-specific announcements for user's department
    const query = {
      branchId: branch._id,
      expiresAt: { $gt: now },
      $or: [
        { department: { $exists: false } }, // Branch-wide announcements
        { department: null }, // Branch-wide announcements (explicit null)
        { department: userDepartment } // Department-specific announcements
      ]
    };

    console.log('User announcements query:', JSON.stringify(query, null, 2));

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    console.log(`Found ${announcements.length} announcements for user`);

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching user announcements:', error);
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
// Add or update this endpoint in your server.js file
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile request received for user ID:', req.user.id);

    // First check if the user exists
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // Then look for employee record
    const employee = await Employee.findOne({ userId: req.user.id });

    // If no employee record exists, still return the user data
    // This is important for admin users who might not have an employee record
    if (!employee) {
      console.log('No employee record found for user, returning user data only');
      return res.json({
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        branchName: user.branchName,
        // Add basic structure to prevent client-side errors
        personalDetails: { name: user.email.split('@')[0] },
        professionalDetails: {
          role: user.role,
          branch: user.branchName
        }
      });
    }

    console.log('Employee record found');

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
    const leaves = await Leave.find({ employeeId: employee.userId })
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

// Now we need to update the notifications endpoint to handle shared notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // First get this user's direct notifications
    const userNotifications = await Notification.find({
      userId: req.user.id
    });

    // Then find shared notifications for user's role
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine the current user's role(s)
    const userRoles = [];
    if (currentUser.isAdmin) userRoles.push('admin');
    userRoles.push(currentUser.role); // Add their specific role

    // Find shared notifications for these roles
    const sharedNotificationsQuery = {
      'metadata.isSharedNotification': true,
      $or: []
    };

    // Add condition for admin role if applicable
    if (currentUser.isAdmin) {
      sharedNotificationsQuery.$or.push({ 'metadata.forRole': 'admin' });
    }

    // Add condition for specific role
    sharedNotificationsQuery.$or.push({ 'metadata.forRole': currentUser.role });

    // For HR managers, only show notifications for their branch
    if (currentUser.role === 'hr_manager') {
      // Find only shared HR manager notifications for this branch
      sharedNotificationsQuery.$and = [
        { 'metadata.branchName': { $regex: new RegExp('^' + currentUser.branchName + '$', 'i') } }
      ];
    }

    let sharedNotifications = [];
    if (sharedNotificationsQuery.$or.length > 0) {
      sharedNotifications = await Notification.find(sharedNotificationsQuery);
    }

    // Combine and remove duplicates (using Set on applicationId)
    const uniqueNotificationIds = new Set();
    const allUniqueNotifications = [];

    // Process user's direct notifications
    userNotifications.forEach(notification => {
      allUniqueNotifications.push(notification);
      // Track application IDs to avoid duplicates
      if (notification.metadata?.applicationId) {
        uniqueNotificationIds.add(notification.metadata.applicationId);
      }
    });

    // Add shared notifications that aren't duplicates
    sharedNotifications.forEach(notification => {
      // Skip if we already have a notification for this application
      if (notification.metadata?.applicationId &&
        uniqueNotificationIds.has(notification.metadata.applicationId)) {
        return;
      }

      allUniqueNotifications.push(notification);
      // Track this application ID
      if (notification.metadata?.applicationId) {
        uniqueNotificationIds.add(notification.metadata.applicationId);
      }
    });

    // Sort by creation date (newest first) and limit
    allUniqueNotifications.sort((a, b) => b.createdAt - a.createdAt);
    const limitedNotifications = allUniqueNotifications.slice(0, 20);

    console.log(`Found ${userNotifications.length} personal and ${sharedNotifications.length} shared notifications for user ${currentUser.email} (${currentUser.role})`);
    console.log(`Returning ${limitedNotifications.length} unique notifications after deduplication`);

    res.json(limitedNotifications);
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
  fileFilter: function (req, file, cb) {
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

// Updated application submission endpoint to create role-specific notifications
// app.post('/api/applicants', resumeUpload.single('resume'), async (req, res) => {
//   try {
//     console.log('Starting application submission');
//     console.log('Request body personal details:', req.body.personalDetails);
//     console.log('Request body job details:', req.body.jobDetails);

//     const personalDetails = JSON.parse(req.body.personalDetails);
//     const jobDetails = JSON.parse(req.body.jobDetails);

//     // CRITICAL FIX: Extract branch name consistently, checking all possible locations
//     const branchName =
//       req.body.branchName ||
//       jobDetails.branch ||
//       jobDetails.branchName ||
//       personalDetails.branch ||
//       personalDetails.branchName;

//     console.log('Application received for branch:', branchName);

//     // Find branch
//     const branch = await Branch.findOne({
//       name: { $regex: new RegExp('^' + branchName + '$', 'i') }
//     });

//     if (!branch) {
//       throw new Error(`Invalid branch specified: ${branchName}`);
//     }

//     console.log('Found branch:', branch);

//     // CRITICAL FIX: Ensure both branch and branchName are stored in jobDetails
//     if (jobDetails) {
//       jobDetails.branch = branch.name;
//       jobDetails.branchName = branch.name;
//     }

//     // Add application timestamp and unique ID
//     const applicationTimestamp = new Date();
//     const uniqueApplicationId = `${applicationTimestamp.getTime()}-${Math.random().toString(36).substring(2, 10)}`;

//     // Save applicant data with standardized branchName
//     const applicantData = {
//       personalDetails: new Map(Object.entries(personalDetails)),
//       jobDetails: new Map(Object.entries(jobDetails)),
//       branchName: branch.name, // Store at top level for HR filtering
//       status: 'pending',
//       applicationId: uniqueApplicationId,
//       applicationTimestamp: applicationTimestamp
//     };

//     if (req.file) {
//       applicantData.resume = {
//         filename: req.file.originalname,
//         path: req.file.path,
//         uploadedAt: new Date()
//       };
//     }

//     const applicant = new Applicant(applicantData);
//     await applicant.save();

//     // Extract applicant name with fallbacks
//     const applicantName =
//       personalDetails.name ||
//       personalDetails.fullname ||
//       personalDetails.fullName ||
//       'Applicant';

//     // Improved position extraction with case-insensitive searching
//     let jobPosition = 'a position';

//     // First check if position exists in jobDetails
//     if (jobDetails.position) {
//       jobPosition = jobDetails.position;
//     } else if (personalDetails.position) {
//       // Check if it's in personal details (old form format)
//       jobPosition = personalDetails.position;
//     } else {
//       // Try to find any field containing "position" in its name, case-insensitive
//       for (const key of Object.keys(jobDetails)) {
//         if (key.toLowerCase().includes('position') && jobDetails[key]) {
//           jobPosition = jobDetails[key];
//           break;
//         }
//       }

//       // If that fails, try other common field names
//       if (jobPosition === 'a position') {
//         jobPosition =
//           jobDetails.title ||
//           jobDetails.job_title ||
//           jobDetails.jobTitle ||
//           jobDetails.role ||
//           jobDetails.job ||
//           'a position';
//       }
//     }

//     console.log('Extracted name:', applicantName);
//     console.log('Extracted position:', jobPosition);

//     // *** FIXED APPROACH: Create representative notifications using target users ***
//     // Instead of using null userId, we'll find one user per role and create a notification for them

//     // Construct the notification message once
//     const notificationMessage = `New application received from ${applicantName} for ${jobPosition} in ${branch.name} branch`;
//     const notificationMetadata = {
//       branchId: branch._id,
//       branchName: branch.name,
//       applicationId: uniqueApplicationId,
//       // Flag this as a shared notification that should be visible to other users with the same role
//       isSharedNotification: true
//     };

//     // Find one representative from each role that should be notified
//     const [branchHRManager, oneAdmin, oneT1Member] = await Promise.all([
//       // Get one HR manager for this branch
//       User.findOne({
//         role: 'hr_manager',
//         branchName: { $regex: new RegExp('^' + branch.name + '$', 'i') },
//         status: 'approved'
//       }),
//       // Get one admin
//       User.findOne({
//         isAdmin: true,
//         status: 'approved'
//       }),
//       // Get one T1 member
//       User.findOne({
//         role: 't1_member',
//         status: 'approved'
//       })
//     ]);

//     // Create notifications only for roles that have representatives
//     const notificationPromises = [];

//     // Create HR manager notification
//     if (branchHRManager) {
//       notificationPromises.push(
//         new Notification({
//           userId: branchHRManager._id,
//           title: 'New Job Application',
//           message: notificationMessage,
//           type: 'application',
//           metadata: {
//             ...notificationMetadata,
//             forRole: 'hr_manager'
//           }
//         }).save()
//       );
//     }

//     // Create admin notification
//     if (oneAdmin) {
//       notificationPromises.push(
//         new Notification({
//           userId: oneAdmin._id,
//           title: 'New Job Application',
//           message: notificationMessage,
//           type: 'application',
//           metadata: {
//             ...notificationMetadata,
//             forRole: 'admin'
//           }
//         }).save()
//       );
//     }

//     // Create T1 member notification
//     if (oneT1Member) {
//       notificationPromises.push(
//         new Notification({
//           userId: oneT1Member._id,
//           title: 'New Job Application',
//           message: notificationMessage,
//           type: 'application',
//           metadata: {
//             ...notificationMetadata,
//             forRole: 't1_member'
//           }
//         }).save()
//       );
//     }

//     // Save all notifications
//     if (notificationPromises.length > 0) {
//       await Promise.all(notificationPromises);
//       console.log(`Created ${notificationPromises.length} representative notifications for application ${uniqueApplicationId}`);
//     } else {
//       console.log('No users found to notify about new application');
//     }

//     // Send email notification to branch HR manager if found
//     let emailSent = false;
//     if (branchHRManager) {
//       try {
//         const subject = `New Job Application for ${branch.name} Branch`;

//         const emailContent = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
//             <h2 style="color: #474787;">New Job Application Received</h2>
            
//             <p>Hello ${branchHRManager.email.split('@')[0]},</p>
            
//             <p>A new job application has been submitted for the ${branch.name} branch.</p>
            
//             <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
//               <h3 style="margin-top: 0; color: #4b5563;">Applicant Details:</h3>
//               <p><strong>Name:</strong> ${applicantName}</p>
//               <p><strong>Email:</strong> ${personalDetails.email || 'Not provided'}</p>
//               <p><strong>Position:</strong> ${jobPosition}</p>
//               <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
//             </div>
            
//             <p>To review this application, please log in to the HR Management System and check the Applicants section.</p>
            
//             <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
//               <p>This is an automated notification from the HR Management System.</p>
//             </div>
//           </div>
//         `;

//         const emailResult = await sendEmail(branchHRManager.email, subject, emailContent);
//         emailSent = emailResult;
//         console.log(`Email notification sent to HR manager: ${branchHRManager.email}`);
//       } catch (emailError) {
//         console.error(`Failed to send email for HR manager ${branchHRManager.email}:`, emailError);
//       }
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Application submitted successfully',
//       applicationId: uniqueApplicationId,
//       notificationsCreated: notificationPromises.length,
//       emailSent: emailSent
//     });

//   } catch (error) {
//     console.error('Error in application submission:', error);
//     res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to submit application'
//     });
//   }
// });
const checkFileSizeForDB = (req, res, next) => {
  if (req.file && req.file.size > 16 * 1024 * 1024) { // 16MB MongoDB document limit
    return res.status(400).json({
      success: false,
      message: 'File too large for database storage. Maximum size is 16MB.'
    });
  }
  
  if (req.files) {
    for (let file of req.files) {
      if (file.size > 16 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'One or more files are too large for database storage. Maximum size is 16MB per file.'
        });
      }
    }
  }
  
  next();
};


app.post('/api/applicants', checkFileSizeForDB,resumeUpload.single('resume'), async (req, res) => {
  try {
    console.log('Starting application submission');
    console.log('Request body personal details:', req.body.personalDetails);
    console.log('Request body job details:', req.body.jobDetails);
    
    const personalDetails = JSON.parse(req.body.personalDetails);
    const jobDetails = JSON.parse(req.body.jobDetails);
    
    // Extract branch name consistently
    const branchName = 
      req.body.branchName || 
      jobDetails.branch || 
      jobDetails.branchName || 
      personalDetails.branch || 
      personalDetails.branchName;
    
    console.log('Application received for branch:', branchName);

    // Find branch
    const branch = await Branch.findOne({
      name: { $regex: new RegExp('^' + branchName + '$', 'i') }
    });

    if (!branch) {
      throw new Error(`Invalid branch specified: ${branchName}`);
    }

    console.log('Found branch:', branch);

    // Ensure branch name is stored properly
    if (jobDetails) {
      jobDetails.branch = branch.name;
      jobDetails.branchName = branch.name;
    }

    // Add application timestamp and unique ID
    const applicationTimestamp = new Date();
    const uniqueApplicationId = `${applicationTimestamp.getTime()}-${Math.random().toString(36).substring(2, 10)}`;

    // Prepare applicant data
    const applicantData = {
      personalDetails: new Map(Object.entries(personalDetails)),
      jobDetails: new Map(Object.entries(jobDetails)),
      branchName: branch.name,
      status: 'pending',
      applicationId: uniqueApplicationId,
      applicationTimestamp: applicationTimestamp
    };

    // Handle resume file - store in database instead of file system
    if (req.file) {
      console.log('Processing uploaded resume:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Store file data directly in database
      applicantData.resume = {
        filename: `resume-${uniqueApplicationId}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer, // Store the actual file data
        uploadedAt: new Date()
      };

      console.log('Resume stored in database, size:', req.file.buffer.length, 'bytes');
    }

    // Save applicant to database
    const applicant = new Applicant(applicantData);
    await applicant.save();

    console.log('Applicant saved successfully with ID:', applicant._id);

    // Extract applicant info for notifications
    const applicantName = 
      personalDetails.name || 
      personalDetails.fullname || 
      personalDetails.fullName || 
      'Applicant';

    // Extract position
    let jobPosition = 'a position';
    if (jobDetails.position) {
      jobPosition = jobDetails.position;
    } else if (personalDetails.position) {
      jobPosition = personalDetails.position;
    } else {
      // Try to find any field containing "position"
      for (const key of Object.keys(jobDetails)) {
        if (key.toLowerCase().includes('position') && jobDetails[key]) {
          jobPosition = jobDetails[key];
          break;
        }
      }
      
      if (jobPosition === 'a position') {
        jobPosition = 
          jobDetails.title || 
          jobDetails.job_title || 
          jobDetails.jobTitle || 
          jobDetails.role || 
          jobDetails.job || 
          'a position';
      }
    }

    console.log('Extracted name:', applicantName);
    console.log('Extracted position:', jobPosition);

    // Create notifications for relevant users
    const notificationMessage = `New application received from ${applicantName} for ${jobPosition} in ${branch.name} branch`;
    const notificationMetadata = {
      branchId: branch._id,
      branchName: branch.name,
      applicationId: uniqueApplicationId,
      isSharedNotification: true
    };
    
    // Find ALL users that should be notified
    const [branchHRManagers, admins, t1Members] = await Promise.all([
      User.find({
        role: 'hr_manager',
        branchName: { $regex: new RegExp('^' + branch.name + '$', 'i') },
        status: 'approved'
      }),
      User.find({
        isAdmin: true,
        status: 'approved'
      }),
      User.find({
        role: 't1_member',
        status: 'approved'
      })
    ]);
    
    console.log(`Found ${branchHRManagers.length} HR managers, ${admins.length} admins, ${t1Members.length} T1 members`);
    
    // Create notifications for all relevant users
    const notificationPromises = [];
    
    // HR managers
    branchHRManagers.forEach(hrManager => {
      notificationPromises.push(
        new Notification({
          userId: hrManager._id,
          title: 'New Job Application',
          message: notificationMessage,
          type: 'application',
          metadata: { ...notificationMetadata, forRole: 'hr_manager' }
        }).save()
      );
    });
    
    // Admins
    admins.forEach(admin => {
      notificationPromises.push(
        new Notification({
          userId: admin._id,
          title: 'New Job Application',
          message: notificationMessage,
          type: 'application',
          metadata: { ...notificationMetadata, forRole: 'admin' }
        }).save()
      );
    });
    
    // T1 members
    t1Members.forEach(t1Member => {
      notificationPromises.push(
        new Notification({
          userId: t1Member._id,
          title: 'New Job Application',
          message: notificationMessage,
          type: 'application',
          metadata: { ...notificationMetadata, forRole: 't1_member' }
        }).save()
      );
    });
    
    // Save all notifications
    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications`);
    }
    
    // Send email notifications to HR managers
    let emailsSent = 0;
    if (branchHRManagers.length > 0) {
      const subject = `New Job Application for ${branch.name} Branch`;
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #474787;">New Job Application Received</h2>
          
          <p>Hello,</p>
          
          <p>A new job application has been submitted for the ${branch.name} branch.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #4b5563;">Applicant Details:</h3>
            <p><strong>Name:</strong> ${applicantName}</p>
            <p><strong>Email:</strong> ${personalDetails.email || 'Not provided'}</p>
            <p><strong>Position:</strong> ${jobPosition}</p>
            <p><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Application ID:</strong> ${uniqueApplicationId}</p>
            <p><strong>Resume:</strong> ${req.file ? '✅ Included' : '❌ Not provided'}</p>
          </div>
          
          <p>To review this application, please log in to the HR Management System and check the Applicants section.</p>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>This is an automated notification from the HR Management System.</p>
          </div>
        </div>
      `;
      
      const emailPromises = branchHRManagers.map(hrManager =>
        sendEmail(hrManager.email, subject, emailContent)
          .then(result => result ? 1 : 0)
          .catch(error => {
            console.error(`Email failed for ${hrManager.email}:`, error);
            return 0;
          })
      );
      
      const emailResults = await Promise.all(emailPromises);
      emailsSent = emailResults.reduce((sum, result) => sum + result, 0);
      
      console.log(`Successfully sent ${emailsSent} out of ${branchHRManagers.length} emails`);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: uniqueApplicationId,
      notificationsCreated: notificationPromises.length,
      emailsSent: emailsSent,
      totalHRManagers: branchHRManagers.length,
      branchName: branch.name,
      resumeStored: !!req.file
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
// In your server.js, update the GET /api/applicants endpoint
app.get('/api/applicants', authenticateToken, async (req, res) => {
  try {
    const { status, position, branch } = req.query;
    const query = {};

    if (status) query.status = status;
    if (position) query['jobDetails.position'] = position;
    if (branch) query.branchName = branch;

    console.log('Fetching applicants with query:', query);

    // Fetch applicants but exclude the large file data from the initial query
    const applicants = await Applicant.find(query)
      .select('-resume.data -documents.data') // Exclude file data for performance
      .sort({ createdAt: -1 });

    console.log(`Found ${applicants.length} applicants`);

    // Transform the data for response
    const transformedApplicants = applicants.map(applicant => {
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
        resume: applicant.resume ? {
          filename: applicant.resume.filename,
          originalName: applicant.resume.originalName,
          mimetype: applicant.resume.mimetype,
          size: applicant.resume.size,
          uploadedAt: applicant.resume.uploadedAt,
          hasData: true // We know it has data since resume object exists
        } : null,
        createdAt: applicant.createdAt,
        applicationId: applicant.applicationId
      };
    });

    res.json(transformedApplicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({
      message: 'Error fetching applications',
      error: error.message
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
// Update application status
// Update or add this route in server.js
app.put('/api/applicants/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check user permissions
    const user = await User.findById(req.user.id);
    if (!(user.isAdmin || user.role === 'hr_manager' || user.role === 't1_member')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find applicant with all details
    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Get applicant details
    const personalDetails = Object.fromEntries(applicant.personalDetails);
    const jobDetails = Object.fromEntries(applicant.jobDetails);

    // Update applicant status
    applicant.status = status;
    await applicant.save();

    // Prepare status message for email
    let statusMessage = '';
    let nextSteps = '';

    switch (status) {
      case 'reviewed':
        statusMessage = 'Your application has been reviewed by our HR team.';
        nextSteps = 'We are currently evaluating all applications and will update you soon about the next steps.';
        break;
      case 'shortlisted':
        statusMessage = 'Congratulations! Your application has been shortlisted.';
        nextSteps = 'Our HR team will contact you soon to schedule an interview.';
        break;
      case 'rejected':
        statusMessage = 'Thank you for your interest in our organization.';
        nextSteps = 'We regret to inform you that we have decided to move forward with other candidates. We encourage you to apply for future positions that match your skills and experience.';
        break;
      default:
        statusMessage = 'Your application status has been updated.';
        nextSteps = 'We will keep you informed about any further updates.';
    }

    // Format application date
    const applicationDate = applicant.createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send email to applicant
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #474787;">Application Status Update</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin-bottom: 20px;">${statusMessage}</p>
          <p style="margin-bottom: 20px;">${nextSteps}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px;">Application Details:</h3>
          <ul style="list-style: none; padding-left: 0;">
            <li style="margin-bottom: 10px;"><strong>Position:</strong> ${jobDetails.position}</li>
            <li style="margin-bottom: 10px;"><strong>Branch:</strong> ${applicant.branchName}</li>
            <li style="margin-bottom: 10px;"><strong>Applied On:</strong> ${applicationDate}</li>
            <li style="margin-bottom: 10px;"><strong>Current Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</li>
          </ul>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-bottom: 15px;">Your Information:</h3>
          <ul style="list-style: none; padding-left: 0;">
            <li style="margin-bottom: 10px;"><strong>Name:</strong> ${personalDetails.name}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${personalDetails.email}</li>
            <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${personalDetails.phone}</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
          <p style="font-size: 12px;">This is an automated email from our HR Management System.</p>
          ${status === 'shortlisted' ? '<p style="font-size: 14px; color: #474787;"><strong>Note:</strong> Please monitor your email for interview scheduling details.</p>' : ''}
        </div>
      </div>
    `;

    try {
      console.log(`Sending status update email to applicant: ${personalDetails.email}`);
      await sendEmail(
        personalDetails.email,
        `Application Status Update - ${jobDetails.position}`,
        emailContent
      );
      console.log('Status update email sent successfully');
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // Continue with response even if email fails
    }

    res.json({
      message: 'Application status updated successfully',
      applicant: {
        id: applicant._id,
        status: applicant.status,
        emailSent: true
      }
    });

  } catch (error) {
    console.error('Error updating applicant status:', error);
    res.status(500).json({
      message: 'Error updating application status',
      error: error.message
    });
  }
});


// Get application details (Admin and T1 member)
// Add this to your server.js
app.get('/api/applicants/:id', authenticateToken, async (req, res) => {
  try {
    // Get applicant without file data for performance
    const applicant = await Applicant.findById(req.params.id)
      .select('-resume.data -documents.data');

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Use the existing getAllDetails method but ensure we indicate file presence
    const processedData = applicant.getAllDetails();

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    res.status(500).json({
      message: 'Error fetching applicant details',
      error: error.message
    });
  }
});



// Download resume
app.get('/api/applicants/:id/resume', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!(user.isAdmin || user.role === 'hr_manager' || user.role === 't1_member')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    console.log('Fetching resume for applicant:', id);
    
    // Find applicant with resume data
    const applicant = await Applicant.findById(id);

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    if (!applicant.resume || !applicant.resume.data) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('Serving resume from database:', {
      filename: applicant.resume.originalName,
      mimetype: applicant.resume.mimetype,
      size: applicant.resume.size
    });

    // Set appropriate headers for file download
    res.set({
      'Content-Type': applicant.resume.mimetype,
      'Content-Disposition': `attachment; filename="${applicant.resume.originalName}"`,
      'Content-Length': applicant.resume.size
    });

    // Send the file data directly from database
    res.send(applicant.resume.data);
    
  } catch (error) {
    console.error('Error downloading resume from database:', error);
    res.status(500).json({ 
      message: 'Error downloading resume',
      error: error.message 
    });
  }
});


// Admin routes for managing form fields (protected)
app.get('/api/admin/form-fields', authenticateToken, checkFormFieldsAccess, async (req, res) => {
  try {
    const fields = await FormField.find().sort({ order: 1 });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/api/admin/form-fields', authenticateToken, checkFormFieldsAccess, async (req, res) => {
  try {
    const field = new FormField(req.body);
    const newField = await field.save();
    res.status(201).json(newField);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.put('/api/admin/form-fields/:id', authenticateToken, checkFormFieldsAccess, async (req, res) => {
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

app.delete('/api/admin/form-fields/:id', authenticateToken, checkFormFieldsAccess, async (req, res) => {
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

app.put('/api/admin/form-fields/reorder', authenticateToken, checkFormFieldsAccess, async (req, res) => {
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
app.get('/api/hr/employees', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!(user.isAdmin || user.role === 'hr_manager' || user.role === 't1_member')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const query = user.role === 'hr_manager' ?
      { 'professionalDetails.branch': user.branchName } : {};

    const employees = await Employee.aggregate([
      {
        $match: query
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

    // Get all leave requests for those employees
    const leaves = await Leave.find({
      employeeEmail: { $in: employeeEmails }
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching branch leaves:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/leaves/management', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Check if user has management privileges
    if (!(user.isAdmin || user.role === 'hr_manager' || user.role === 't1_member' || user.role === 'operational_manager')) {
      return res.status(403).json({ message: 'Access denied. Management privileges required.' });
    }

    let query = {};

    // For HR manager, only show leaves from their branch
    if (user.role === 'hr_manager') {
      // Get all employees from HR's branch
      const branchEmployees = await Employee.find({
        'professionalDetails.branch': user.branchName
      }).select('personalDetails.email');

      const employeeEmails = branchEmployees.map(emp => emp.personalDetails.email);

      // Filter by branch emails but exclude manager's own email
      query = {
        employeeEmail: {
          $in: employeeEmails,
          $ne: user.email
        }
      };
    } else {
      // For admin, T1, and operational managers - show all leaves except their own
      query = { employeeEmail: { $ne: user.email } };
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching management leaves:', error);
    res.status(500).json({
      message: 'Error fetching leave requests',
      error: error.message
    });
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

    // Build a more robust filter that checks multiple branch fields
    const filter = {};

    // For HR managers (not admin), filter by branch
    if (user.role === 'hr_manager') {
      filter.$or = [
        { branchName: { $regex: new RegExp('^' + user.branchName + '$', 'i') } },
        { 'jobDetails.branch': { $regex: new RegExp('^' + user.branchName + '$', 'i') } },
        { 'jobDetails.branchName': { $regex: new RegExp('^' + user.branchName + '$', 'i') } }
      ];
    }

    console.log('Using filter:', JSON.stringify(filter));

    // Fetch all applicants matching the filter
    const applicants = await Applicant.find(filter);
    console.log(`Found ${applicants.length} applicants${user.role === 'hr_manager' ? ' for branch ' + user.branchName : ''}`);

    // Transform the data to match admin view
    const transformedApplicants = applicants.map(applicant => {
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

      // CRITICAL FIX: Extract branch name from all possible locations
      const branchName =
        applicant.branchName ||
        jobDetails.branch ||
        jobDetails.branchName ||
        personalDetails.branch ||
        personalDetails.branchName ||
        'Not specified';

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
          // Ensure branch is available in both locations for consistency
          branch: branchName,
          branchName: branchName,
          ...jobDetails
        },
        // Ensure branch name at top level too
        branchName: branchName,
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
    let employees = [];

    if (req.isAdmin) {
      // If user is admin, get all employees
      console.log('Admin user detected, fetching all employees');
      employees = await Employee.find({}).populate('userId');
    } else {
      // For HR managers, keep branch-specific filtering
      console.log(`HR Manager fetching employees for branch: ${req.hrBranch}`);
      employees = await Employee.find({
        'professionalDetails.branch': req.hrBranch
      }).populate('userId');
    }

    const transformedEmployees = employees.map(employee => ({
      ...employee.toObject(),
      userDetails: employee.userId ? {
        email: employee.userId.email,
        role: employee.userId.role,
        status: employee.userId.status
      } : null
    }));

    console.log(`Found ${transformedEmployees.length} employees for editing`);
    res.json(transformedEmployees);
  } catch (error) {
    console.error('Error fetching employees for editing:', error);
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

app.get('/api/hr/notifications', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Fetching HR notifications for user:', {
      userId: currentUser._id,
      branchName: currentUser.branchName,
      role: currentUser.role
    });

    // Get user's direct notifications
    const userNotifications = await Notification.find({
      userId: currentUser._id
    });

    // Find shared notifications based on roles
    const sharedNotificationsQuery = {
      'metadata.isSharedNotification': true,
      $or: []
    };

    // Add appropriate role conditions
    if (currentUser.isAdmin) {
      sharedNotificationsQuery.$or.push({ 'metadata.forRole': 'admin' });
    }

    if (currentUser.role === 'hr_manager') {
      sharedNotificationsQuery.$or.push({ 'metadata.forRole': 'hr_manager' });
      // For HR managers, only show notifications for their branch
      sharedNotificationsQuery.$and = [
        { 'metadata.branchName': { $regex: new RegExp('^' + currentUser.branchName + '$', 'i') } }
      ];
    }

    if (currentUser.role === 't1_member') {
      sharedNotificationsQuery.$or.push({ 'metadata.forRole': 't1_member' });
    }

    let sharedNotifications = [];
    if (sharedNotificationsQuery.$or.length > 0) {
      sharedNotifications = await Notification.find(sharedNotificationsQuery);
    }

    // Combine and remove duplicates (using Set on applicationId)
    const uniqueNotificationIds = new Set();
    const allUniqueNotifications = [];

    // Process user's direct notifications
    userNotifications.forEach(notification => {
      allUniqueNotifications.push(notification);
      // Track application IDs to avoid duplicates
      if (notification.metadata?.applicationId) {
        uniqueNotificationIds.add(notification.metadata.applicationId);
      }
    });

    // Add shared notifications that aren't duplicates
    sharedNotifications.forEach(notification => {
      // Skip if we already have a notification for this application
      if (notification.metadata?.applicationId &&
        uniqueNotificationIds.has(notification.metadata.applicationId)) {
        return;
      }

      allUniqueNotifications.push(notification);
      // Track this application ID
      if (notification.metadata?.applicationId) {
        uniqueNotificationIds.add(notification.metadata.applicationId);
      }
    });

    // Sort by creation date (newest first) and limit
    allUniqueNotifications.sort((a, b) => b.createdAt - a.createdAt);
    const limitedNotifications = allUniqueNotifications.slice(0, 20);

    console.log(`Found ${limitedNotifications.length} unique notifications for HR user`);
    res.json(limitedNotifications);
  } catch (error) {
    console.error('Error in HR notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
});

// Add this DELETE endpoint for branches to your server.js file
app.delete('/api/branches/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // First, find the branch to get manager information
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Optional: Reset roles of position holders if needed
    // This prevents orphaned role assignments when a branch is deleted
    // You can remove or modify this section based on your requirements
    try {
      // Reset HR Manager role
      if (branch.hrManager) {
        await Employee.findByIdAndUpdate(branch.hrManager, {
          'professionalDetails.role': 'employee'
        });
      }

      // Reset T1 Member role
      if (branch.t1Member) {
        await Employee.findByIdAndUpdate(branch.t1Member, {
          'professionalDetails.role': 'employee'
        });
      }

      // Reset Operational Manager role
      if (branch.operationalManager) {
        await Employee.findByIdAndUpdate(branch.operationalManager, {
          'professionalDetails.role': 'employee'
        });
      }
    } catch (roleError) {
      console.warn('Warning: Could not reset all branch position roles:', roleError);
      // Continue with branch deletion even if role reset fails
    }

    // Now delete the branch itself
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);

    // Optional: Update employee records to remove this branch
    try {
      await Employee.updateMany(
        { 'professionalDetails.branch': branch.name },
        { 'professionalDetails.branch': 'Unassigned' }
      );
    } catch (empError) {
      console.warn('Warning: Could not update employee branches:', empError);
      // Continue with response even if employee update fails
    }

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      branchName: branch.name
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch',
      error: error.message
    });
  }
});

// Add this to your server.js file - a new public endpoint for branches

// Public endpoint for getting branches (unprotected)
app.get('/api/public/branches', async (req, res) => {
  try {
    const branches = await Branch.find()
      .select('name') // Only return branch names for security
      .lean();

    res.json(branches.map(branch => ({
      id: branch._id,
      name: branch.name
    })));
  } catch (error) {
    console.error('Error fetching public branches:', error);
    res.status(500).json({
      message: 'Failed to load branches. Please try again later.',
      error: error.message
    });
  }
});

app.post('/api/attendance/sync', authenticateToken, async (req, res) => {
  try {
    console.log('Manual attendance sync requested');

    // Get optional custom parameters from request body
    const options = req.body || {};

    const result = await zktecoService.syncAttendanceLogs(options);
    res.json(result);
  } catch (error) {
    console.error('Error syncing attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error synchronizing attendance data',
      error: error.message
    });
  }
});
app.get('/api/attendance/sync-status', authenticateToken, (req, res) => {
  try {
    const status = zktecoService.getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting sync status',
      error: error.message
    });
  }
});
app.post('/api/attendance/auto-sync', authenticateToken, isAdmin, (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'start') {
      const result = zktecoService.startAutoSync();
      res.json(result);
    } else if (action === 'stop') {
      const result = zktecoService.stopAutoSync();
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action. Use "start" or "stop"'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error managing automatic sync',
      error: error.message
    });
  }
});
// Route to test ZKTeco device connection
app.get('/api/attendance/test-connection', authenticateToken, async (req, res) => {
  try {
    console.log('Testing device connection...');

    // Get optional custom parameters from query string
    const options = {};
    if (req.query.ip) options.ip = req.query.ip;
    if (req.query.port) options.port = parseInt(req.query.port);
    if (req.query.timeout) options.timeout = parseInt(req.query.timeout);

    const result = await zktecoService.testConnection(options);

    console.log('Connection test result:', result);
    res.json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing device connection',
      error: error.message
    });
  }
});

// Update the server's API endpoint for attendance
// In server.js, find and update the /api/attendance route

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { date, employeeNumber, department, startDate, endDate, limit, deduplicate } = req.query;
    console.log('Fetching attendance records with filters:', req.query);

    // Build options for zktecoService
    const options = {};

    if (date) {
      options.date = date;
    }

    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    if (employeeNumber) {
      options.employeeNumber = employeeNumber;
    }

    if (department) {
      options.department = department;
    }

    if (limit) {
      options.limit = parseInt(limit);
    }

    // Add deduplication option
    if (deduplicate !== undefined) {
      options.deduplicate = deduplicate === 'true';
    }

    console.log('Fetching attendance with options:', options);

    // Use zktecoService to get attendance data
    let attendanceRecords;
    try {
      attendanceRecords = await zktecoService.getAttendanceData(options);
    } catch (serviceError) {
      console.error('Service error:', serviceError);

      // Fallback to direct MongoDB query if zktecoService fails
      console.log('Trying direct database query...');

      // Try to get Attendance model directly
      const Attendance = require('./models/Attendance');

      // Build query based on options
      const query = {};

      if (date) {
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(queryDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setUTCHours(0, 0, 0, 0);

        // IMPORTANT: Use timeIn for filtering (not date)
        // This ensures we see all check-ins that happened on the calendar day
        query.timeIn = {
          $gte: startOfDay,
          $lt: endOfDay
        };
      }

      if (employeeNumber) {
        query.employeeNumber = employeeNumber;
      }

      if (department) {
        query.department = department;
      }

      // Execute query
      attendanceRecords = await Attendance.find(query)
        .sort({ timeIn: -1 })
        .limit(options.limit || 500)
        .lean();

      // Manual deduplication if requested
      if (options.deduplicate !== false) {
        const uniqueEmployees = {};

        attendanceRecords.forEach(record => {
          const key = record.employeeNumber;
          if (!uniqueEmployees[key] ||
            new Date(record.timeIn) < new Date(uniqueEmployees[key].timeIn)) {
            uniqueEmployees[key] = record;
          }
        });

        attendanceRecords = Object.values(uniqueEmployees);
      }
    }

    // Always ensure we're returning an array
    if (!Array.isArray(attendanceRecords)) {
      attendanceRecords = [];
    }

    console.log(`Returning ${attendanceRecords.length} attendance records`);

    // Send response
    res.json({
      success: true,
      count: attendanceRecords.length,
      totalRecords: attendanceRecords.length,
      date: date || 'all',
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);

    // Return an empty result instead of an error
    res.json({
      success: false,
      message: 'Error fetching attendance records: ' + error.message,
      count: 0,
      totalRecords: 0,
      date: date || 'all',
      data: []
    });
  }
});

// Add this simple email test route to your server.js
app.get('/api/test-email-now', async (req, res) => {
  try {
    console.log('Testing email system...');

    // Test the connection first
    await transporter.verify();
    console.log('SMTP connection verified');

    // Send a test email using your existing sendEmail function
    const testResult = await sendEmail(
      'hrmsmongo@gmail.com', // Send to yourself for testing
      'HRMS Email Test - ' + new Date().toLocaleString(),
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #474787;">✅ Email Test Successful!</h2>
          <p>Your HRMS email system is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>SMTP: Gmail</li>
            <li>From:hrmsmongo@gmail.com</li>
          </ul>
          <p>If you received this email, your nodemailer configuration is working perfectly for production!</p>
        </div>
      `
    );

    res.json({
      success: true,
      message: 'Email test completed successfully',
      connectionStatus: 'Connected to Gmail SMTP',
      emailSent: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      suggestions: [
        'Check your Gmail app password',
        'Verify 2FA is enabled on Gmail',
        'Ensure Gmail allows less secure apps'
      ]
    });
  }
});

// Add this route to your existing server.js file

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, number, company, subject, website, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.'
      });
    }

    // Create email content
    const mailOptions = {
      from: 'hrmsmongo@gmail.com', // Your Gmail address
      to: 'hrmsmongo@gmail.com',
      subject: `HRMS Contact Form - ${subject || 'New Inquiry'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4254f4; border-bottom: 2px solid #4254f4; padding-bottom: 10px;">
            New HRMS Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${number ? `<p><strong>Phone:</strong> ${number}</p>` : ''}
            ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
            ${website ? `<p><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></p>` : ''}
          </div>

          ${subject ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Subject</h3>
            <p style="background-color: #e9ecef; padding: 15px; border-radius: 5px;">${subject}</p>
          </div>
          ` : ''}

          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message</h3>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>This email was sent from the HRMS contact form on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Optional: Send confirmation email to the user
    const confirmationMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting HRMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4254f4;">Thank you for your inquiry!</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and will get back to you within 24-48 hours.</p>
          <p>Your inquiry details:</p>
          <ul>
            <li><strong>Subject:</strong> ${subject || 'General Inquiry'}</li>
            <li><strong>Message:</strong> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}</li>
          </ul>
          <p>Best regards,<br>HRMS Team</p>
        </div>
      `
    };

    await transporter.sendMail(confirmationMail);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});


app.get('/api/branches/:branchId/departments', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Find the branch to get its name
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    console.log(`Fetching departments for branch: ${branch.name}`);

    // Get unique departments from employees in this branch
    const departments = await Employee.aggregate([
      {
        $match: {
          'professionalDetails.branch': { 
            $regex: new RegExp('^' + branch.name + '$', 'i') 
          }
        }
      },
      {
        $group: {
          _id: '$professionalDetails.department',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Extract department names and add default departments if none exist
    let departmentNames = departments.map(dept => dept._id);
    
    // Add common default departments if no departments found
    if (departmentNames.length === 0) {
      departmentNames = ['General', 'HR', 'IT', 'Sales', 'Marketing', 'Operations'];
    } else {
      // Ensure 'General' is always included
      if (!departmentNames.includes('General')) {
        departmentNames.unshift('General');
      }
    }

    console.log(`Found departments for ${branch.name}:`, departmentNames);
    
    res.json(departmentNames);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      message: 'Error fetching departments', 
      error: error.message 
    });
  }
});

// Get all departments across all branches (for admin use)
app.get('/api/departments/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const departments = await Employee.aggregate([
      {
        $group: {
          _id: '$professionalDetails.department',
          branches: { $addToSet: '$professionalDetails.branch' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(departments.map(dept => ({
      name: dept._id,
      branches: dept.branches,
      employeeCount: dept.count
    })));
  } catch (error) {
    console.error('Error fetching all departments:', error);
    res.status(500).json({ 
      message: 'Error fetching departments', 
      error: error.message 
    });
  }
});


// Add these new routes to your existing server.js file
// Insert these after your existing announcement routes

// Get department-specific announcements
app.get('/api/announcements/department/:department', authenticateToken, async (req, res) => {
  try {
    const { department } = req.params;
    const { branch } = req.query;
    
    console.log(`Fetching department announcements for: ${department} in branch: ${branch}`);
    
    // First get the branch ID
    const branchDoc = await Branch.findOne({
      name: { $regex: new RegExp('^' + branch + '$', 'i') }
    });
    
    if (!branchDoc) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    // Get current time for expiry check
    const now = new Date();
    
    // Find announcements that are:
    // 1. For this branch
    // 2. Department-specific (either in title/content or has targetDepartment field)
    // 3. Not expired
    const departmentAnnouncements = await Announcement.find({
      branchId: branchDoc._id,
      expiresAt: { $gt: now },
      $or: [
        // Department mentioned in title (case-insensitive)
        { title: { $regex: new RegExp(department, 'i') } },
        // Department mentioned in content (case-insensitive)
        { content: { $regex: new RegExp(department, 'i') } },
        // Specific department field (if you add this to your schema later)
        { targetDepartment: { $regex: new RegExp('^' + department + '$', 'i') } },
        // Low/medium priority announcements are assumed to be department-specific
        { priority: { $in: ['low', 'medium'] } }
      ]
    })
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${departmentAnnouncements.length} department announcements for ${department}`);
    
    res.json(departmentAnnouncements);
  } catch (error) {
    console.error('Error fetching department announcements:', error);
    res.status(500).json({
      message: 'Error fetching department announcements',
      error: error.message
    });
  }
});

// Get branch-wide announcements (from HR/Admin)
app.get('/api/announcements/branch-wide/:branch', authenticateToken, async (req, res) => {
  try {
    const { branch } = req.params;
    
    console.log(`Fetching branch-wide announcements for: ${branch}`);
    
    // First get the branch ID
    const branchDoc = await Branch.findOne({
      name: { $regex: new RegExp('^' + branch + '$', 'i') }
    });
    
    if (!branchDoc) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    // Get current time for expiry check
    const now = new Date();
    
    // Find announcements that are:
    // 1. For this branch
    // 2. High priority (assumed to be branch-wide) OR created by HR/Admin
    // 3. Not expired
    const branchWideAnnouncements = await Announcement.find({
      branchId: branchDoc._id,
      expiresAt: { $gt: now },
      $or: [
        // High priority announcements are assumed to be branch-wide
        { priority: 'high' },
        // Could also filter by creator role if we populate that data
        // We'll also include any announcement that doesn't seem department-specific
      ]
    })
    .populate('createdBy', 'email role isAdmin')
    .sort({ createdAt: -1 });
    
    // Additional filtering: only show announcements from HR managers or admins
    const filteredAnnouncements = branchWideAnnouncements.filter(announcement => {
      const creator = announcement.createdBy;
      return (
        announcement.priority === 'high' || // High priority is always branch-wide
        (creator && (creator.role === 'hr_manager' || creator.isAdmin)) // Or created by HR/Admin
      );
    });
    
    console.log(`Found ${filteredAnnouncements.length} branch-wide announcements for ${branch}`);
    
    res.json(filteredAnnouncements);
  } catch (error) {
    console.error('Error fetching branch-wide announcements:', error);
    res.status(500).json({
      message: 'Error fetching branch-wide announcements',
      error: error.message
    });
  }
});

// Optional: Update the announcement creation endpoint to support department targeting
// Add this modification to your existing POST /api/announcements route
// Find your existing route and add these fields to the announcement creation:

/*
// In your existing POST /api/announcements route, modify the announcement creation like this:
const announcement = new Announcement({
  title,
  content,
  branchId,
  createdBy: req.user.id,
  priority: priority || 'medium',
  expiresAt: new Date(expiresAt),
  // Add these new optional fields:
  targetDepartment: req.body.targetDepartment, // Optional: specific department
  scope: req.body.scope || 'branch', // 'department' or 'branch'
});
*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});