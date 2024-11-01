const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const authenticate = require('../middlewares/authMiddleware');
const router = express.Router();

// Register Admin
router.post('', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const admin = new Admin({ email, password, name });
    await admin.save();
    res.status(201).json({ message: 'Admin created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Token
router.post('/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Token is valid', valid: true, userId: decoded.id });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
