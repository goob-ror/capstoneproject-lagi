const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username exists
    const [existing] = await pool.query(
      'SELECT * FROM bidan WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new bidan with minimal data
    const [result] = await pool.query(
      'INSERT INTO bidan (username, password, nama_lengkap, role, isAuth) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, username, 'Bidan', 0]
    );

    res.status(201).json({
      message: 'Registration successful. Waiting for approval.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM bidan WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if approved
    if (!user.isAuth) {
      return res.status(403).json({ 
        message: 'Account pending approval',
        status: 'pending'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
