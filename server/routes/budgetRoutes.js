const express = require('express');
const router = express.Router();

const {
  getBudgets,
  saveBudget,
  deleteBudget,
} = require('../controllers/budgetController');

const { protect } = require('../middleware/authMiddleware');

// Get all budgets
router.get('/', protect, getBudgets);

// Add or update budget
router.post('/', protect, saveBudget);

// Delete budget
router.delete('/:id', protect, deleteBudget);

module.exports = router;
