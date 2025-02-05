// BranchController.js
const Branch = require('./branch');
const Employee = require('./employee');

exports.createBranch = async (req, res) => {
  try {
    const { name, hrManager, t1Member, operationalManager } = req.body;

    // Update employee roles
    await Employee.findByIdAndUpdate(hrManager, {
      'professionalDetails.role': 'hr_manager',
      'professionalDetails.branch': name
    });
    
    await Employee.findByIdAndUpdate(t1Member, {
      'professionalDetails.role': 't1_member',
      'professionalDetails.branch': name
    });
    
    await Employee.findByIdAndUpdate(operationalManager, {
      'professionalDetails.role': 'operational_manager',
      'professionalDetails.branch': name
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
};

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('hrManager', 'personalDetails.name')
      .populate('t1Member', 'personalDetails.name')
      .populate('operationalManager', 'personalDetails.name');
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBranchRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, employeeId } = req.body;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Update old employee's role back to 'employee'
    if (branch[role]) {
      await Employee.findByIdAndUpdate(branch[role], {
        'professionalDetails.role': 'employee',
        'professionalDetails.branch': ''
      });
    }

    // Update new employee's role
    await Employee.findByIdAndUpdate(employeeId, {
      'professionalDetails.role': role === 'hrManager' ? 'hr_manager' : 
                                 role === 't1Member' ? 't1_member' : 
                                 'operational_manager',
      'professionalDetails.branch': branch.name
    });

    branch[role] = employeeId;
    await branch.save();

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Reset roles for all employees in the branch
    const employeeIds = [branch.hrManager, branch.t1Member, branch.operationalManager];
    await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { 
        'professionalDetails.role': 'employee',
        'professionalDetails.branch': ''
      }
    );

    await Branch.findByIdAndDelete(id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};