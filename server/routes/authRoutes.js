
const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser
} = require('../controllers/authController');

console.log('registerUser:', typeof registerUser);
console.log('loginUser:', typeof loginUser);

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
