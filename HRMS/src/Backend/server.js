// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('../Backend/models/Users');
const Employee = require('../Backend/models/employee');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

createAdminUser();

// Routes
// Sign Up
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, role, branchName } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email,
      password,
      role,
      branchName,
      status: 'pending',
    });

    res.status(201).json({ message: 'Signup request submitted for approval' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
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
app.post('/api/employees', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path
    })) : [];

    const employeeData = {
      personalDetails: JSON.parse(req.body.personalDetails),
      professionalDetails: JSON.parse(req.body.professionalDetails),
      documents
    };

    const employee = new Employee(employeeData);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all employees
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
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

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});