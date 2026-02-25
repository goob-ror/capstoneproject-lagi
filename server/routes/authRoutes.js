const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../database/db');

// reCAPTCHA verification function
async function verifyRecaptcha(token) {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      return { success: true, score: 1.0 };
    }

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      
      if (!recaptchaResult.success) {
        return res.status(400).json({ 
          message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' 
        });
      }

      // For reCAPTCHA v3, check the score (0.0 - 1.0, higher is better)
      if (recaptchaResult.score && recaptchaResult.score < 0.5) {
        return res.status(400).json({ 
          message: 'Verifikasi keamanan gagal. Silakan coba lagi.' 
        });
      }
    }

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
    const { username, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      
      if (!recaptchaResult.success) {
        return res.status(400).json({ 
          message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' 
        });
      }

      // For reCAPTCHA v3, check the score (0.0 - 1.0, higher is better)
      if (recaptchaResult.score && recaptchaResult.score < 0.5) {
        return res.status(400).json({ 
          message: 'Verifikasi keamanan gagal. Silakan coba lagi.' 
        });
      }
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM bidan WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usename atau password salah!' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Username atau password salah!' });
    }

    // Check if approved
    if (!user.isAuth) {
      return res.status(403).json({ 
        message: 'Account pending approval',
        status: 'pending'
      });
    }

    // Update last_login
    await pool.query(
      'UPDATE bidan SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

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
