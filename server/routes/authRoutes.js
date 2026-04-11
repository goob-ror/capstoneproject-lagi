const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const querystring = require('querystring');
const pool = require('../database/db');
const { rateLimitMiddleware, rateLimiter } = require('../middleware/rateLimiter');

// reCAPTCHA verification function using native https (no axios/undici)
async function verifyRecaptcha(token) {
  return new Promise((resolve) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      return resolve({ success: true, score: 1.0 });
    }

    const postData = querystring.stringify({
      secret: secretKey,
      response: token
    });

    const options = {
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Request failed' }));
    req.write(postData);
    req.end();
  });
}

// Register
router.post('/register', rateLimitMiddleware, async (req, res) => {
  try {
    const { username, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      
      if (!recaptchaResult.success) {
        rateLimiter.recordFailedAttempt(req);
        return res.status(400).json({ 
          message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' 
        });
      }

      // For reCAPTCHA v3, check the score (0.0 - 1.0, higher is better)
      if (recaptchaResult.score && recaptchaResult.score < 0.5) {
        rateLimiter.recordFailedAttempt(req);
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
      const result = rateLimiter.recordFailedAttempt(req);
      
      if (result.locked) {
        return res.status(429).json({ 
          message: `Terlalu banyak percobaan registrasi gagal. Coba lagi dalam ${result.cooldownMinutes} menit.`,
          locked: true
        });
      }
      
      return res.status(400).json({ 
        message: 'Username already exists',
        attemptsRemaining: result.attemptsRemaining
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new bidan with minimal data
    const [result] = await pool.query(
      'INSERT INTO bidan (username, password, nama_lengkap, role, isAuth) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, username, 'Bidan', 0]
    );

    // Successful registration - reset rate limit for this IP
    rateLimiter.recordSuccessfulLogin(req);

    res.status(201).json({
      message: 'Registration successful. Waiting for approval.',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Login
router.post('/login', rateLimitMiddleware, async (req, res) => {
  try {
    const { username, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      
      if (!recaptchaResult.success) {
        rateLimiter.recordFailedAttempt(req);
        return res.status(400).json({ 
          message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' 
        });
      }

      // For reCAPTCHA v3, check the score (0.0 - 1.0, higher is better)
      if (recaptchaResult.score && recaptchaResult.score < 0.5) {
        rateLimiter.recordFailedAttempt(req);
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
      const result = rateLimiter.recordFailedAttempt(req);
      
      if (result.locked) {
        return res.status(429).json({ 
          message: `Terlalu banyak percobaan login gagal. Akun dikunci selama ${result.cooldownMinutes} menit.`,
          locked: true,
          cooldownMinutes: result.cooldownMinutes
        });
      }
      
      return res.status(401).json({ 
        message: 'Username atau password salah!',
        attemptsRemaining: result.attemptsRemaining
      });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const result = rateLimiter.recordFailedAttempt(req);
      
      if (result.locked) {
        return res.status(429).json({ 
          message: `Terlalu banyak percobaan login gagal. Akun dikunci selama ${result.cooldownMinutes} menit.`,
          locked: true,
          cooldownMinutes: result.cooldownMinutes
        });
      }
      
      return res.status(401).json({ 
        message: 'Username atau password salah!',
        attemptsRemaining: result.attemptsRemaining
      });
    }

    // Check if approved
    if (!user.isAuth) {
      // Don't count this as a failed attempt since credentials are correct
      return res.status(403).json({ 
        message: 'Account pending approval',
        status: 'pending'
      });
    }

    // Successful login - reset rate limit
    rateLimiter.recordSuccessfulLogin(req);

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
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Admin endpoint to check rate limit status (optional - for debugging)
router.get('/rate-limit-status', async (req, res) => {
  try {
    const ip = rateLimiter.getClientIp(req);
    const status = rateLimiter.getStatus(ip);
    
    if (!status) {
      return res.json({
        ip,
        message: 'No rate limit record found for this IP',
        status: 'clean'
      });
    }
    
    res.json({
      ip,
      ...status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
