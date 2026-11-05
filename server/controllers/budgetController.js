const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get budgets with monthly expense details
const getBudgets = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const budgets = await Budget.find({
      user: req.userId,
      month,
      year,
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const expenses = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const result = budgets.map((budget) => {
      const expense = expenses.find(
        (item) => item._id === budget.category
      );

      const spent = expense ? expense.spent : 0;

      return {
        ...budget.toObject(),
        spent,
        remaining: budget.amount - spent,
        exceeded: spent > budget.amount,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or update a budget
const saveBudget = async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: 'Please provide a valid category and amount.',
      });
    }

    const selectedMonth = Number(month) || new Date().getMonth() + 1;
    const selectedYear = Number(year) || new Date().getFullYear();

    if (
      selectedMonth < 1 ||
      selectedMonth > 12 ||
      !Number.isInteger(selectedYear)
    ) {
      return res.status(400).json({
        message: 'Please provide a valid month and year.',
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.userId,
        category: category.trim(),
        month: selectedMonth,
        year: selectedYear,
      },
      {
        $set: {
          amount: Number(amount),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: 'Budget saved successfully.',
      budget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a budget
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found.',
      });
    }

    res.status(200).json({
      message: 'Budget deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBudgets,
  saveBudget,
  deleteBudget,
};
