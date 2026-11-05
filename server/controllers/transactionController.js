
const Transaction = require('../models/Transaction');

// Get all transactions for the logged-in user
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.userId
        }).sort({ date: -1 });

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Add a new transaction
const addTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;

        if (!title || amount == null || !type || !category) {
            return res.status(400).json({
                message: 'Please provide title, amount, type and category'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                message: 'Type must be income or expense'
            });
        }

        const transaction = await Transaction.create({
            user: req.userId,
            title,
            amount,
            type,
            category,
            ...(date ? { date } : {})
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Add transaction error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update an existing transaction
const updateTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaction not found'
            });
        }

        if (transaction.user.toString() !== req.userId) {
            return res.status(403).json({
                message: 'User not authorized'
            });
        }

        if (title !== undefined) transaction.title = title;
        if (amount !== undefined) transaction.amount = amount;
        if (type !== undefined) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({
                    message: 'Type must be income or expense'
                });
            }
            transaction.type = type;
        }
        if (category !== undefined) transaction.category = category;
        if (date !== undefined) transaction.date = date;

        await transaction.save();

        res.status(200).json({
            message: 'Transaction updated successfully',
            transaction
        });

    } catch (error) {
        console.error('Update transaction error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaction not found'
            });
        }

        if (transaction.user.toString() !== req.userId) {
            return res.status(403).json({
                message: 'User not authorized'
            });
        }

        await transaction.deleteOne();

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
};
