
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign(
        { userId: id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: 'Please provide name, username, email, and password.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters.'
            });
        }

        const normalizedUsername = username.trim().toLowerCase();
        const normalizedEmail = email.trim().toLowerCase();

        const userExists = await User.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedEmail }
            ]
        });

        if (userExists) {
            return res.status(400).json({
                message: 'Username or email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword
        });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            token: generateToken(user._id.toString())
        });

    } catch (error) {
        console.error('Register error:', error.message);

        return res.status(500).json({
            message: 'Registration failed.',
            error: error.message
        });
    }
};

// Login using username and password
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Please provide username and password.'
            });
        }

        const normalizedUsername = username.trim().toLowerCase();

        // Also allow existing users to log in using their email
        const user = await User.findOne({
            $or: [
                { username: normalizedUsername },
                { email: normalizedUsername }
            ]
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            token: generateToken(user._id.toString())
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Login failed.',
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
