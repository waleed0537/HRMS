// routes/branch.routes.js
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/BranchController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/branches', authenticateToken, isAdmin, branchController.createBranch);
router.get('/branches', authenticateToken, branchController.getAllBranches);
router.put('/branches/:id/role', authenticateToken, isAdmin, branchController.updateBranchRole);
router.delete('/branches/:id', authenticateToken, isAdmin, branchController.deleteBranch);

module.exports = router;